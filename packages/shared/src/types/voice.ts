export interface VoiceState {
  userId: string;
  channelId: string | null;
  serverId: string;
  muted: boolean;
  deafened: boolean;
  /** Included in server→client broadcasts for display purposes */
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
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
