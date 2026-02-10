import { useEffect } from "react";
import { useMemberStore } from "@/stores/members";
import { MemberItem } from "./member-item";
import type { ServerMember, UserStatus } from "@nexus/shared";

interface MembersSidebarProps {
  serverId: string;
}

const STATUS_ORDER: UserStatus[] = ["online", "idle", "dnd", "offline"];
const STATUS_LABELS: Record<UserStatus, string> = {
  online: "Online",
  idle: "Idle",
  dnd: "Do Not Disturb",
  offline: "Offline",
};

export function MembersSidebar({ serverId }: MembersSidebarProps) {
  const members = useMemberStore((s) => s.members);
  const presenceMap = useMemberStore((s) => s.presenceMap);
  const showSidebar = useMemberStore((s) => s.showSidebar);
  const fetchMembers = useMemberStore((s) => s.fetchMembers);

  useEffect(() => {
    fetchMembers(serverId);
  }, [serverId, fetchMembers]);

  if (!showSidebar) return null;

  // Group by status
  const grouped: Record<UserStatus, ServerMember[]> = {
    online: [],
    idle: [],
    dnd: [],
    offline: [],
  };

  for (const member of members) {
    const status = presenceMap[member.user.id] || member.user.status || "offline";
    grouped[status as UserStatus].push(member);
  }

  return (
    <div className="w-60 bg-card border-l border-border flex flex-col overflow-y-auto shrink-0">
      <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Members — {members.length}
      </div>
      {STATUS_ORDER.map((status) => {
        const group = grouped[status];
        if (group.length === 0) return null;
        return (
          <div key={status}>
            <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
              {STATUS_LABELS[status]} — {group.length}
            </div>
            {group.map((member) => (
              <MemberItem key={member.id} member={member} status={status} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
