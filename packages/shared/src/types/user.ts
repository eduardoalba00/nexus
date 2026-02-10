export type UserStatus = "online" | "idle" | "dnd" | "offline";

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: UserStatus;
  customStatus: string | null;
  createdAt: string;
  updatedAt: string;
}
