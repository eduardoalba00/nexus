export const AUTH_ROUTES = {
  REGISTER: "/api/auth/register",
  LOGIN: "/api/auth/login",
  REFRESH: "/api/auth/refresh",
  ME: "/api/auth/me",
} as const;

export const SERVER_ROUTES = {
  LIST: "/api/servers",
  CREATE: "/api/servers",
  GET: "/api/servers/:serverId",
  UPDATE: "/api/servers/:serverId",
  DELETE: "/api/servers/:serverId",
  MEMBERS: "/api/servers/:serverId/members",
  LEAVE: "/api/servers/:serverId/members/me",
  CATEGORIES_CREATE: "/api/servers/:serverId/categories",
  CATEGORIES_DELETE: "/api/servers/:serverId/categories/:categoryId",
  CHANNELS_LIST: "/api/servers/:serverId/channels",
  CHANNELS_CREATE: "/api/servers/:serverId/channels",
  CHANNELS_UPDATE: "/api/servers/:serverId/channels/:channelId",
  CHANNELS_DELETE: "/api/servers/:serverId/channels/:channelId",
  INVITES_CREATE: "/api/servers/:serverId/invites",
  INVITES_LIST: "/api/servers/:serverId/invites",
} as const;

export const INVITE_ROUTES = {
  JOIN: "/api/invites/join",
} as const;

export const MESSAGE_ROUTES = {
  LIST: "/api/channels/:channelId/messages",
  CREATE: "/api/channels/:channelId/messages",
  UPDATE: "/api/channels/:channelId/messages/:messageId",
  DELETE: "/api/channels/:channelId/messages/:messageId",
} as const;

export function buildRoute(
  template: string,
  params: Record<string, string>,
): string {
  return template.replace(/:(\w+)/g, (_, key) => {
    const value = params[key];
    if (value === undefined) throw new Error(`Missing route param: ${key}`);
    return encodeURIComponent(value);
  });
}
