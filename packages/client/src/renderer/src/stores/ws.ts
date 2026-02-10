import { create } from "zustand";
import { DispatchEvent } from "@nexus/shared";
import type { WsDispatch, Message, Channel, ServerMember, MessageDeleteData, MemberLeaveData, VoiceState } from "@nexus/shared";
import { wsManager } from "@/lib/ws";
import { useChannelStore } from "./channels";
import { useMessageStore } from "./messages";
import { useServerStore } from "./servers";
import { useVoiceStore } from "./voice";

interface WsState {
  connected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
}

export const useWsStore = create<WsState>()((set) => ({
  connected: false,

  connect: (token) => {
    wsManager.setStatusChangeHandler((connected) => {
      set({ connected });
    });

    wsManager.setDispatchHandler((event: WsDispatch) => {
      switch (event.t) {
        case DispatchEvent.MESSAGE_CREATE:
          useMessageStore.getState().handleMessageCreate(event.d as Message);
          break;
        case DispatchEvent.MESSAGE_UPDATE:
          useMessageStore.getState().handleMessageUpdate(event.d as Message);
          break;
        case DispatchEvent.MESSAGE_DELETE:
          useMessageStore.getState().handleMessageDelete(event.d as MessageDeleteData);
          break;
        case DispatchEvent.CHANNEL_CREATE:
          useChannelStore.getState().handleChannelCreate(event.d as Channel);
          break;
        case DispatchEvent.CHANNEL_UPDATE:
          useChannelStore.getState().handleChannelUpdate(event.d as Channel);
          break;
        case DispatchEvent.CHANNEL_DELETE:
          useChannelStore.getState().handleChannelDelete(event.d as { id: string; serverId: string });
          break;
        case DispatchEvent.MEMBER_JOIN:
          // Refresh servers list to pick up servers we were added to
          useServerStore.getState().fetchServers();
          break;
        case DispatchEvent.MEMBER_LEAVE:
          // Could remove server from list if it's us leaving
          break;
        case DispatchEvent.VOICE_STATE_UPDATE:
          useVoiceStore.getState().handleVoiceStateUpdate(event.d as VoiceState);
          break;
      }
    });

    wsManager.connect(token);
  },

  disconnect: () => {
    wsManager.disconnect();
    set({ connected: false });
  },
}));
