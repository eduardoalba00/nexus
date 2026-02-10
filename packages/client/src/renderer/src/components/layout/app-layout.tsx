import { ServerSidebar } from "@/components/servers/server-sidebar";
import { ChannelSidebar } from "@/components/channels/channel-sidebar";
import { MainContent } from "@/components/layout/main-content";
import { DmSidebar } from "@/components/dms/dm-sidebar";
import { DmView } from "@/components/dms/dm-view";
import { useServerStore } from "@/stores/servers";
import { useDmStore } from "@/stores/dms";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppLayout() {
  const activeServerId = useServerStore((s) => s.activeServerId);
  const activeDmId = useDmStore((s) => s.activeDmId);

  // If no server is active, we're in DM mode
  const isDmMode = !activeServerId;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-1 overflow-hidden bg-background">
        <ServerSidebar />
        {isDmMode ? (
          <>
            <DmSidebar />
            <DmView />
          </>
        ) : (
          <>
            <ChannelSidebar serverId={activeServerId} />
            <MainContent />
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
