import { create } from "zustand";
import type { VoiceState, VoiceChannelUser } from "@nexus/shared";
import { voiceManager } from "@/lib/voice";

interface VoiceStoreState {
  currentChannelId: string | null;
  currentServerId: string | null;
  participants: Map<string, VoiceChannelUser>;
  isMuted: boolean;
  isDeafened: boolean;
  isConnecting: boolean;

  joinChannel: (channelId: string, serverId: string) => Promise<void>;
  leaveChannel: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  handleVoiceStateUpdate: (state: VoiceState) => void;
}

export const useVoiceStore = create<VoiceStoreState>()((set, get) => ({
  currentChannelId: null,
  currentServerId: null,
  participants: new Map(),
  isMuted: false,
  isDeafened: false,
  isConnecting: false,

  joinChannel: async (channelId, serverId) => {
    const { currentChannelId } = get();
    if (currentChannelId === channelId) return;

    // If already in a channel, leave first
    if (currentChannelId) {
      get().leaveChannel();
    }

    set({ isConnecting: true, currentChannelId: channelId, currentServerId: serverId });

    try {
      await voiceManager.join(channelId, serverId);
      set({ isConnecting: false });
    } catch (err) {
      console.error("Failed to join voice channel:", err);
      set({ isConnecting: false, currentChannelId: null, currentServerId: null });
    }
  },

  leaveChannel: () => {
    voiceManager.leave();
    set({
      currentChannelId: null,
      currentServerId: null,
      participants: new Map(),
      isMuted: false,
      isDeafened: false,
      isConnecting: false,
    });
  },

  toggleMute: () => {
    const { isMuted } = get();
    if (isMuted) {
      voiceManager.unmute();
    } else {
      voiceManager.mute();
    }
    set({ isMuted: !isMuted });
  },

  toggleDeafen: () => {
    const { isDeafened } = get();
    if (isDeafened) {
      voiceManager.undeafen();
    } else {
      voiceManager.deafen();
    }
    set({ isDeafened: !isDeafened });
  },

  handleVoiceStateUpdate: (state: VoiceState) => {
    set((s) => {
      const participants = new Map(s.participants);

      if (state.channelId === null) {
        // User left voice
        participants.delete(state.userId);
      } else if (state.channelId === s.currentChannelId) {
        // User joined/updated in our channel
        const existing = participants.get(state.userId);
        participants.set(state.userId, {
          userId: state.userId,
          username: existing?.username ?? "",
          displayName: existing?.displayName ?? "",
          avatarUrl: existing?.avatarUrl ?? null,
          muted: state.muted,
          deafened: state.deafened,
          speaking: false,
        });
      }

      return { participants };
    });
  },
}));
