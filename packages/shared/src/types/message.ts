import type { User } from "./user.js";

export interface MessageReplyRef {
  id: string;
  author: User;
  content: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  me: boolean;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface Message {
  id: string;
  channelId: string;
  author: User;
  content: string;
  editedAt: string | null;
  createdAt: string;
  replyTo: MessageReplyRef | null;
  reactions: Reaction[];
  attachments: Attachment[];
  pinnedAt: string | null;
}
