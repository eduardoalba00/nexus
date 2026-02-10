import { Device, types as msTypes } from "mediasoup-client";
import { WsOpcode } from "@nexus/shared";
import type { VoiceSignalAction } from "@nexus/shared";
import { wsManager } from "./ws";

type PendingRequest = {
  resolve: (data: any) => void;
  reject: (err: Error) => void;
};

type SpeakingCallback = (speaking: boolean) => void;

export class VoiceManager {
  private device: Device | null = null;
  private sendTransport: msTypes.Transport | null = null;
  private recvTransport: msTypes.Transport | null = null;
  private producer: MediaStreamTrack | null = null;
  private consumers = new Map<string, { consumer: msTypes.Consumer; audio: HTMLAudioElement }>();
  private localStream: MediaStream | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private requestCounter = 0;

  // VAD
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private vadInterval: ReturnType<typeof setInterval> | null = null;
  private isSpeaking = false;
  private speakingCallback: SpeakingCallback | null = null;

  // Device selection
  private selectedInputDeviceId: string | null = null;
  private selectedOutputDeviceId: string | null = null;

  // Per-user volume
  private userVolumes = new Map<string, number>();

  constructor() {
    wsManager.setVoiceSignalHandler(this.handleSignal.bind(this));
  }

  setSpeakingCallback(cb: SpeakingCallback | null) {
    this.speakingCallback = cb;
  }

  setInputDevice(deviceId: string | null) {
    this.selectedInputDeviceId = deviceId;
  }

  setOutputDevice(deviceId: string | null) {
    this.selectedOutputDeviceId = deviceId;
    // Apply to all existing consumers
    for (const { audio } of this.consumers.values()) {
      if (deviceId && "setSinkId" in audio) {
        (audio as any).setSinkId(deviceId).catch(() => {});
      }
    }
  }

  setUserVolume(userId: string, volume: number) {
    this.userVolumes.set(userId, Math.max(0, Math.min(2, volume)));
    const entry = this.consumers.get(userId);
    if (entry) {
      entry.audio.volume = this.userVolumes.get(userId) ?? 1;
    }
  }

  getUserVolume(userId: string): number {
    return this.userVolumes.get(userId) ?? 1;
  }

  async join(channelId: string, serverId: string): Promise<void> {
    // Send voice state update to join
    wsManager.send({
      op: WsOpcode.VOICE_STATE_UPDATE,
      d: { channelId, serverId },
    });

    // Wait for router RTP capabilities (sent as __join__ requestId)
    const rtpCapabilities = await this.waitForJoinCapabilities();

    // Load device with router capabilities
    this.device = new Device();
    await this.device.load({ routerRtpCapabilities: rtpCapabilities });

    // Create send transport
    const sendParams = await this.signal("createSendTransport");
    this.sendTransport = this.device.createSendTransport(sendParams);

    this.sendTransport.on(
      "connect",
      ({ dtlsParameters }: { dtlsParameters: msTypes.DtlsParameters }, callback: () => void, errback: (err: Error) => void) => {
        this.signal("connectTransport", {
          transportId: this.sendTransport!.id,
          dtlsParameters,
        })
          .then(() => callback())
          .catch(errback);
      },
    );

    this.sendTransport.on(
      "produce",
      async (
        { kind, rtpParameters }: { kind: msTypes.MediaKind; rtpParameters: msTypes.RtpParameters },
        callback: (arg: { id: string }) => void,
        errback: (err: Error) => void,
      ) => {
        try {
          const { producerId } = await this.signal("produce", { kind, rtpParameters });
          callback({ id: producerId });
        } catch (err) {
          errback(err as Error);
        }
      },
    );

    // Create recv transport
    const recvParams = await this.signal("createRecvTransport");
    this.recvTransport = this.device.createRecvTransport(recvParams);

    this.recvTransport.on(
      "connect",
      ({ dtlsParameters }: { dtlsParameters: msTypes.DtlsParameters }, callback: () => void, errback: (err: Error) => void) => {
        this.signal("connectTransport", {
          transportId: this.recvTransport!.id,
          dtlsParameters,
        })
          .then(() => callback())
          .catch(errback);
      },
    );

    // Get microphone with selected device
    const audioConstraints: MediaTrackConstraints = this.selectedInputDeviceId
      ? { deviceId: { exact: this.selectedInputDeviceId } }
      : true;
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
    const audioTrack = this.localStream.getAudioTracks()[0];
    this.producer = audioTrack;
    await this.sendTransport.produce({ track: audioTrack });

    // Start VAD
    this.startVAD(this.localStream);
  }

  leave(): void {
    this.stopVAD();

    // Close all consumers
    for (const { consumer, audio } of this.consumers.values()) {
      consumer.close();
      audio.srcObject = null;
      audio.remove();
    }
    this.consumers.clear();

    // Close transports
    this.sendTransport?.close();
    this.recvTransport?.close();
    this.sendTransport = null;
    this.recvTransport = null;

    // Stop microphone
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.producer = null;

    this.device = null;

    // Tell server we left
    wsManager.send({
      op: WsOpcode.VOICE_STATE_UPDATE,
      d: { channelId: null, serverId: "" },
    });
  }

  mute(): void {
    if (this.producer) {
      this.producer.enabled = false;
    }
  }

  unmute(): void {
    if (this.producer) {
      this.producer.enabled = true;
    }
  }

  deafen(): void {
    for (const { audio } of this.consumers.values()) {
      audio.muted = true;
    }
  }

  undeafen(): void {
    for (const { audio } of this.consumers.values()) {
      audio.muted = false;
    }
  }

  // --- VAD (Voice Activity Detection) ---
  private startVAD(stream: MediaStream) {
    try {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.4;
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const THRESHOLD = 20; // Sensitivity threshold

      this.vadInterval = setInterval(() => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        const speaking = avg > THRESHOLD;

        if (speaking !== this.isSpeaking) {
          this.isSpeaking = speaking;
          this.speakingCallback?.(speaking);
        }
      }, 50);
    } catch {
      // VAD not available, ignore
    }
  }

  private stopVAD() {
    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
    this.isSpeaking = false;
  }

  // --- Static device enumeration ---
  static async getAudioDevices(): Promise<{ inputs: MediaDeviceInfo[]; outputs: MediaDeviceInfo[] }> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      inputs: devices.filter((d) => d.kind === "audioinput"),
      outputs: devices.filter((d) => d.kind === "audiooutput"),
    };
  }

  private async consumeProducer(producerId: string, producerUserId: string): Promise<void> {
    if (!this.device || !this.recvTransport) return;

    const params = await this.signal("consume", {
      producerId,
      rtpCapabilities: this.device.rtpCapabilities,
    });

    const consumer = await this.recvTransport.consume({
      id: params.consumerId,
      producerId: params.producerId,
      kind: params.kind,
      rtpParameters: params.rtpParameters,
    });

    // Resume the consumer on the server
    await this.signal("resumeConsumer", { consumerId: consumer.id });

    // Play audio
    const audio = new Audio();
    audio.srcObject = new MediaStream([consumer.track]);

    // Apply per-user volume
    const vol = this.userVolumes.get(producerUserId) ?? 1;
    audio.volume = vol;

    // Apply output device
    if (this.selectedOutputDeviceId && "setSinkId" in audio) {
      (audio as any).setSinkId(this.selectedOutputDeviceId).catch(() => {});
    }

    audio.play().catch(() => {});

    this.consumers.set(producerUserId, { consumer, audio });
  }

  private handleSignal(msg: any): void {
    const { requestId, action, data, error } = msg.d;

    // Handle server-initiated signals (new producer notification)
    if (requestId === "__newProducer__" && action === "consume") {
      this.consumeProducer(data.producerId, data.producerUserId);
      return;
    }

    // Handle join capabilities
    if (requestId === "__join__" && action === "routerRtpCapabilities") {
      const pending = this.pendingRequests.get("__join__");
      if (pending) {
        this.pendingRequests.delete("__join__");
        pending.resolve(data);
      }
      return;
    }

    // Handle request/response correlation
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      this.pendingRequests.delete(requestId);
      if (error) {
        pending.reject(new Error(error));
      } else {
        pending.resolve(data);
      }
    }
  }

  private signal(action: VoiceSignalAction, data?: any): Promise<any> {
    const requestId = `req_${++this.requestCounter}`;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      wsManager.send({
        op: WsOpcode.VOICE_SIGNAL,
        d: { requestId, action, data },
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error(`Voice signal timeout: ${action}`));
        }
      }, 10_000);
    });
  }

  private waitForJoinCapabilities(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.pendingRequests.set("__join__", { resolve, reject });

      setTimeout(() => {
        if (this.pendingRequests.has("__join__")) {
          this.pendingRequests.delete("__join__");
          reject(new Error("Join capabilities timeout"));
        }
      }, 10_000);
    });
  }
}

export const voiceManager = new VoiceManager();
