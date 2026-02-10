import type { User } from "./user.js";

export interface Message {
  id: string;
  channelId: string;
  author: User;
  content: string;
  editedAt: string | null;
  createdAt: string;
}
