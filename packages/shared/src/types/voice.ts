export interface VoiceState {
  userId: string;
  channelId: string | null;
  serverId: string;
  muted: boolean;
  deafened: boolean;
}

export type VoiceSignalAction =
  | "routerRtpCapabilities"
  | "createSendTransport"
  | "connectTransport"
  | "produce"
  | "createRecvTransport"
  | "consume"
  | "resumeConsumer";

export interface VoiceChannelUser {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  muted: boolean;
  deafened: boolean;
  speaking: boolean;
}
