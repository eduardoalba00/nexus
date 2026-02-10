import * as mediasoup from "mediasoup";
import type { types as msTypes } from "mediasoup";
import type { Config } from "../config.js";

const MEDIA_CODECS: msTypes.RouterRtpCodecCapability[] = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
];

export class MediasoupManager {
  private worker: msTypes.Worker | null = null;
  private routers = new Map<string, msTypes.Router>();
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async init(): Promise<void> {
    this.worker = await mediasoup.createWorker({
      logLevel: "warn",
      rtcMinPort: this.config.rtcMinPort,
      rtcMaxPort: this.config.rtcMaxPort,
    });

    this.worker.on("died", () => {
      console.error("mediasoup worker died, exiting");
      process.exit(1);
    });

    console.log("mediasoup worker created [pid:%d]", this.worker.pid);
  }

  async getOrCreateRouter(channelId: string): Promise<msTypes.Router> {
    let router = this.routers.get(channelId);
    if (router && !router.closed) return router;

    if (!this.worker) throw new Error("mediasoup worker not initialized");

    router = await this.worker.createRouter({ mediaCodecs: MEDIA_CODECS });
    this.routers.set(channelId, router);
    return router;
  }

  getRouter(channelId: string): msTypes.Router | undefined {
    const router = this.routers.get(channelId);
    if (router?.closed) {
      this.routers.delete(channelId);
      return undefined;
    }
    return router;
  }

  closeRouter(channelId: string): void {
    const router = this.routers.get(channelId);
    if (router && !router.closed) {
      router.close();
    }
    this.routers.delete(channelId);
  }

  async createWebRtcTransport(
    router: msTypes.Router,
  ): Promise<msTypes.WebRtcTransport> {
    const listenInfos: msTypes.TransportListenInfo[] = [
      { protocol: "udp", ip: "0.0.0.0", announcedAddress: this.config.rtcAnnouncedIp ?? "127.0.0.1" },
      { protocol: "tcp", ip: "0.0.0.0", announcedAddress: this.config.rtcAnnouncedIp ?? "127.0.0.1" },
    ];

    const transport = await router.createWebRtcTransport({
      listenInfos,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });

    return transport;
  }
}
