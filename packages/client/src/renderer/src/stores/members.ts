import { create } from "zustand";
import type { ServerMember, UserStatus } from "@nexus/shared";
import { SERVER_ROUTES, buildRoute } from "@nexus/shared";
import { api } from "@/lib/api";

interface MemberState {
  members: ServerMember[];
  presenceMap: Record<string, UserStatus>;
  showSidebar: boolean;

  fetchMembers: (serverId: string) => Promise<void>;
  handlePresenceUpdate: (data: { userId: string; status: UserStatus }) => void;
  toggleSidebar: () => void;
  clearMembers: () => void;
}

export const useMemberStore = create<MemberState>()((set) => ({
  members: [],
  presenceMap: {},
  showSidebar: true,

  fetchMembers: async (serverId) => {
    const members = await api.get<ServerMember[]>(
      buildRoute(SERVER_ROUTES.MEMBERS, { serverId }),
    );
    set({ members });
    // Initialize presence from member data
    const presenceMap: Record<string, UserStatus> = {};
    for (const m of members) {
      presenceMap[m.user.id] = m.user.status as UserStatus;
    }
    set((s) => ({ presenceMap: { ...s.presenceMap, ...presenceMap } }));
  },

  handlePresenceUpdate: (data) => {
    set((s) => ({
      presenceMap: { ...s.presenceMap, [data.userId]: data.status },
      members: s.members.map((m) =>
        m.user.id === data.userId
          ? { ...m, user: { ...m.user, status: data.status } }
          : m,
      ),
    }));
  },

  toggleSidebar: () => set((s) => ({ showSidebar: !s.showSidebar })),

  clearMembers: () => set({ members: [], presenceMap: {} }),
}));
