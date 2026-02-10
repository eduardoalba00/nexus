import type { Channel } from "./server.js";
import type { Message } from "./message.js";
import type { ServerMember } from "./server.js";

export const WsOpcode = {
  DISPATCH: 0,
  IDENTIFY: 1,
  HEARTBEAT: 2,
  HEARTBEAT_ACK: 3,
  READY: 4,
} as const;

export type WsOpcode = (typeof WsOpcode)[keyof typeof WsOpcode];

export const DispatchEvent = {
  MESSAGE_CREATE: "MESSAGE_CREATE",
  MESSAGE_UPDATE: "MESSAGE_UPDATE",
  MESSAGE_DELETE: "MESSAGE_DELETE",
  CHANNEL_CREATE: "CHANNEL_CREATE",
  CHANNEL_UPDATE: "CHANNEL_UPDATE",
  CHANNEL_DELETE: "CHANNEL_DELETE",
  MEMBER_JOIN: "MEMBER_JOIN",
  MEMBER_LEAVE: "MEMBER_LEAVE",
} as const;

export type DispatchEvent = (typeof DispatchEvent)[keyof typeof DispatchEvent];

export interface WsIdentify {
  op: typeof WsOpcode.IDENTIFY;
  d: { token: string };
}

export interface WsHeartbeat {
  op: typeof WsOpcode.HEARTBEAT;
  d: null;
}

export interface WsHeartbeatAck {
  op: typeof WsOpcode.HEARTBEAT_ACK;
  d: null;
}

export interface WsReady {
  op: typeof WsOpcode.READY;
  d: { heartbeatInterval: number };
}

export interface WsDispatch<T = unknown> {
  op: typeof WsOpcode.DISPATCH;
  t: DispatchEvent;
  d: T;
}

// Dispatch event data types
export interface MessageDeleteData {
  id: string;
  channelId: string;
}

export interface MemberLeaveData {
  userId: string;
  serverId: string;
}

export type WsClientMessage = WsIdentify | WsHeartbeat;

export type WsServerMessage =
  | WsHeartbeatAck
  | WsReady
  | WsDispatch<Message>
  | WsDispatch<MessageDeleteData>
  | WsDispatch<Channel>
  | WsDispatch<{ id: string; serverId: string }>
  | WsDispatch<ServerMember>
  | WsDispatch<MemberLeaveData>;
