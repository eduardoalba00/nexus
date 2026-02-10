import type { User } from "./user.js";

export interface DmChannel {
  id: string;
  recipients: User[];
  lastMessageAt: string | null;
  createdAt: string;
}
