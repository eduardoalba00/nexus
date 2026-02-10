import { Device, types as msTypes } from "mediasoup-client";
import { WsOpcode } from "@nexus/shared";
import type { VoiceSignalAction } from "@nexus/shared";
import { wsManager } from "./ws";

type PendingRequest = {
  resolve: (data: any) => void;
  reject: (err: Error) => void;
};

export class VoiceManager {
  private device: Device | null = null;
  private sendTransport: msTypes.Transport | null = null;
  private recvTransport: msTypes.Transport | null = null;
  private producer: MediaStreamTrack | null = null;
  private consumers = new Map<string, { consumer: msTypes.Consumer; audio: HTMLAudioElement }>();
  private localStream: MediaStream | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private requestCounter = 0;

  constructor() {
    wsManager.setVoiceSignalHandler(this.handleSignal.bind(this));
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

    // Get microphone and produce audio
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioTrack = this.localStream.getAudioTracks()[0];
    this.producer = audioTrack;
    await this.sendTransport.produce({ track: audioTrack });
  }

  leave(): void {
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
