import { create } from "zustand";
import type { Message } from "@nexus/shared";
import { MESSAGE_ROUTES, buildRoute } from "@nexus/shared";
import { api } from "@/lib/api";

interface MessageState {
  messagesByChannel: Record<string, Message[]>;
  hasMore: Record<string, boolean>;

  fetchMessages: (channelId: string, before?: string) => Promise<void>;
  sendMessage: (channelId: string, content: string) => Promise<void>;
  editMessage: (channelId: string, messageId: string, content: string) => Promise<void>;
  deleteMessage: (channelId: string, messageId: string) => Promise<void>;
  handleMessageCreate: (message: Message) => void;
  handleMessageUpdate: (message: Message) => void;
  handleMessageDelete: (data: { id: string; channelId: string }) => void;
  clearMessages: (channelId: string) => void;
}

export const useMessageStore = create<MessageState>()((set, get) => ({
  messagesByChannel: {},
  hasMore: {},

  fetchMessages: async (channelId, before) => {
    const params = new URLSearchParams();
    if (before) params.set("before", before);
    params.set("limit", "50");

    const path = buildRoute(MESSAGE_ROUTES.LIST, { channelId });
    const url = params.toString() ? `${path}?${params}` : path;
    const messages = await api.get<Message[]>(url);

    set((s) => {
      const existing = before ? (s.messagesByChannel[channelId] || []) : [];
      return {
        messagesByChannel: {
          ...s.messagesByChannel,
          [channelId]: before ? [...messages, ...existing] : messages,
        },
        hasMore: {
          ...s.hasMore,
          [channelId]: messages.length === 50,
        },
      };
    });
  },

  sendMessage: async (channelId, content) => {
    await api.post(buildRoute(MESSAGE_ROUTES.CREATE, { channelId }), { content });
  },

  editMessage: async (channelId, messageId, content) => {
    await api.patch(
      buildRoute(MESSAGE_ROUTES.UPDATE, { channelId, messageId }),
      { content },
    );
  },

  deleteMessage: async (channelId, messageId) => {
    await api.delete(
      buildRoute(MESSAGE_ROUTES.DELETE, { channelId, messageId }),
    );
  },

  handleMessageCreate: (message) => {
    set((s) => {
      const existing = s.messagesByChannel[message.channelId] || [];
      return {
        messagesByChannel: {
          ...s.messagesByChannel,
          [message.channelId]: [...existing, message],
        },
      };
    });
  },

  handleMessageUpdate: (message) => {
    set((s) => {
      const existing = s.messagesByChannel[message.channelId] || [];
      return {
        messagesByChannel: {
          ...s.messagesByChannel,
          [message.channelId]: existing.map((m) =>
            m.id === message.id ? message : m,
          ),
        },
      };
    });
  },

  handleMessageDelete: (data) => {
    set((s) => {
      const existing = s.messagesByChannel[data.channelId] || [];
      return {
        messagesByChannel: {
          ...s.messagesByChannel,
          [data.channelId]: existing.filter((m) => m.id !== data.id),
        },
      };
    });
  },

  clearMessages: (channelId) => {
    set((s) => {
      const { [channelId]: _, ...rest } = s.messagesByChannel;
      const { [channelId]: __, ...restHasMore } = s.hasMore;
      return { messagesByChannel: rest, hasMore: restHasMore };
    });
  },
}));
