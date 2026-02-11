import { create } from "zustand";
import type { Server } from "@migo/shared";
import { SERVER_ROUTES, INVITE_ROUTES, buildRoute } from "@migo/shared";
import { api } from "@/lib/api";

interface ServerState {
  servers: Server[];
  activeServerId: string | null;

  fetchServers: () => Promise<void>;
  createServer: (name: string) => Promise<Server>;
  joinServer: (code: string) => Promise<Server>;
  leaveServer: (serverId: string) => Promise<void>;
  deleteServer: (serverId: string) => Promise<void>;
  setActiveServer: (serverId: string | null) => void;
}

export const useServerStore = create<ServerState>()((set, get) => ({
  servers: [],
  activeServerId: null,

  fetchServers: async () => {
    const servers = await api.get<Server[]>(SERVER_ROUTES.LIST);
    set({ servers });
  },

  createServer: async (name) => {
    const server = await api.post<Server>(SERVER_ROUTES.CREATE, { name });
    set((s) => ({ servers: [...s.servers, server] }));
    return server;
  },

  joinServer: async (code) => {
    const server = await api.post<Server>(INVITE_ROUTES.JOIN, { code });
    set((s) => ({ servers: [...s.servers, server] }));
    return server;
  },

  leaveServer: async (serverId) => {
    await api.delete(buildRoute(SERVER_ROUTES.LEAVE, { serverId }));
    set((s) => ({
      servers: s.servers.filter((sv) => sv.id !== serverId),
      activeServerId: s.activeServerId === serverId ? null : s.activeServerId,
    }));
  },

  deleteServer: async (serverId) => {
    await api.delete(buildRoute(SERVER_ROUTES.DELETE, { serverId }));
    set((s) => ({
      servers: s.servers.filter((sv) => sv.id !== serverId),
      activeServerId: s.activeServerId === serverId ? null : s.activeServerId,
    }));
  },

  setActiveServer: (serverId) => set({ activeServerId: serverId }),
}));
