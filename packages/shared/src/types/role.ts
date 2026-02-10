export const Permission = {
  SEND_MESSAGES: 1 << 0,
  MANAGE_MESSAGES: 1 << 1,
  MANAGE_CHANNELS: 1 << 2,
  MANAGE_ROLES: 1 << 3,
  KICK_MEMBERS: 1 << 4,
  BAN_MEMBERS: 1 << 5,
  MANAGE_SERVER: 1 << 6,
  ADMINISTRATOR: 1 << 7,
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ALL_PERMISSIONS = Object.values(Permission).reduce((a, b) => a | b, 0);

export interface Role {
  id: string;
  serverId: string;
  name: string;
  color: string | null;
  position: number;
  permissions: number;
  isDefault: boolean;
  createdAt: string;
}

export interface MemberRole {
  memberId: string;
  roleId: string;
}

export function hasPermission(permissions: number, permission: number): boolean {
  if (permissions & Permission.ADMINISTRATOR) return true;
  return (permissions & permission) === permission;
}

export function computePermissions(roles: Role[]): number {
  return roles.reduce((acc, role) => acc | role.permissions, 0);
}
