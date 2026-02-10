import type { types as msTypes } from "mediasoup";

export interface VoiceParticipant {
  userId: string;
  channelId: string;
  serverId: string;
  muted: boolean;
  deafened: boolean;
  sendTransport: msTypes.WebRtcTransport | null;
  recvTransport: msTypes.WebRtcTransport | null;
  producer: msTypes.Producer | null;
  consumers: Map<string, msTypes.Consumer>; // keyed by producer userId
}

export class VoiceStateManager {
  // channelId -> Map<userId, VoiceParticipant>
  private channels = new Map<string, Map<string, VoiceParticipant>>();
  // userId -> channelId (reverse lookup)
  private userChannels = new Map<string, string>();

  join(
    userId: string,
    channelId: string,
    serverId: string,
  ): { previousChannelId: string | null } {
    const previousChannelId = this.userChannels.get(userId) ?? null;

    // Auto-leave previous channel
    if (previousChannelId && previousChannelId !== channelId) {
      this.removeFromChannel(userId, previousChannelId);
    }

    let channelUsers = this.channels.get(channelId);
    if (!channelUsers) {
      channelUsers = new Map();
      this.channels.set(channelId, channelUsers);
    }

    if (!channelUsers.has(userId)) {
      channelUsers.set(userId, {
        userId,
        channelId,
        serverId,
        muted: false,
        deafened: false,
        sendTransport: null,
        recvTransport: null,
        producer: null,
        consumers: new Map(),
      });
    }

    this.userChannels.set(userId, channelId);
    return { previousChannelId };
  }

  leave(userId: string): { channelId: string; serverId: string } | null {
    const channelId = this.userChannels.get(userId);
    if (!channelId) return null;

    const channelUsers = this.channels.get(channelId);
    const participant = channelUsers?.get(userId);
    if (!participant) return null;

    const { serverId } = participant;
    this.removeFromChannel(userId, channelId);
    return { channelId, serverId };
  }

  getParticipant(userId: string): VoiceParticipant | null {
    const channelId = this.userChannels.get(userId);
    if (!channelId) return null;
    return this.channels.get(channelId)?.get(userId) ?? null;
  }

  getChannelUsers(channelId: string): VoiceParticipant[] {
    const channelUsers = this.channels.get(channelId);
    if (!channelUsers) return [];
    return Array.from(channelUsers.values());
  }

  getChannelForUser(userId: string): string | null {
    return this.userChannels.get(userId) ?? null;
  }

  isChannelEmpty(channelId: string): boolean {
    const channelUsers = this.channels.get(channelId);
    return !channelUsers || channelUsers.size === 0;
  }

  private removeFromChannel(userId: string, channelId: string): void {
    const channelUsers = this.channels.get(channelId);
    if (!channelUsers) return;

    const participant = channelUsers.get(userId);
    if (participant) {
      // Close all mediasoup objects
      participant.producer?.close();
      for (const consumer of participant.consumers.values()) {
        consumer.close();
      }
      participant.sendTransport?.close();
      participant.recvTransport?.close();
    }

    channelUsers.delete(userId);
    this.userChannels.delete(userId);

    if (channelUsers.size === 0) {
      this.channels.delete(channelId);
    }
  }
}
