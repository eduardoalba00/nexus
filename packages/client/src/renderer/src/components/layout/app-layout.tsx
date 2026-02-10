import { ServerSidebar } from "@/components/servers/server-sidebar";
import { ChannelSidebar } from "@/components/channels/channel-sidebar";
import { MainContent } from "@/components/layout/main-content";
import { useServerStore } from "@/stores/servers";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppLayout() {
  const activeServerId = useServerStore((s) => s.activeServerId);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-1 overflow-hidden">
        <ServerSidebar />
        {activeServerId && <ChannelSidebar serverId={activeServerId} />}
        <MainContent />
      </div>
    </TooltipProvider>
  );
}
