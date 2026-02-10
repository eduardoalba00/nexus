import { useState } from "react";
import { Plus, ArrowLeftRight } from "lucide-react";
import { useServerStore } from "@/stores/servers";
import { useChannelStore } from "@/stores/channels";
import { useWorkspaceStore } from "@/stores/workspace";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CreateServerDialog } from "@/components/servers/create-server-dialog";
import { JoinServerDialog } from "@/components/servers/join-server-dialog";
import { cn } from "@/lib/utils";

export function ServerSidebar() {
  const servers = useServerStore((s) => s.servers);
  const activeServerId = useServerStore((s) => s.activeServerId);
  const setActiveServer = useServerStore((s) => s.setActiveServer);
  const fetchChannels = useChannelStore((s) => s.fetchChannels);
  const clearChannels = useChannelStore((s) => s.clearChannels);
  const setActiveChannel = useChannelStore((s) => s.setActiveChannel);

  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const handleServerClick = async (serverId: string) => {
    if (serverId === activeServerId) return;
    setActiveServer(serverId);
    setActiveChannel(null);
    clearChannels();
    await fetchChannels(serverId);
  };

  return (
    <>
      <div className="flex flex-col items-center w-[72px] bg-sidebar py-3 gap-2 overflow-y-auto">
        {servers.map((server) => {
          const isActive = activeServerId === server.id;
          return (
            <Tooltip key={server.id}>
              <TooltipTrigger asChild>
                <div className="group relative flex items-center justify-center w-full">
                  {/* Pill indicator */}
                  <div
                    className={cn(
                      "absolute left-0 bg-sidebar-primary rounded-r-full w-[4px] transition-all",
                      isActive
                        ? "h-[36px]"
                        : "h-[8px] group-hover:h-[20px]",
                      !isActive && "opacity-0 group-hover:opacity-100",
                    )}
                  />
                  <button
                    onClick={() => handleServerClick(server.id)}
                    className={cn(
                      "relative h-[48px] w-[48px] rounded-[24px] bg-card flex items-center justify-center text-foreground font-semibold text-lg transition-all",
                      "hover:rounded-[16px] hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
                      isActive && "rounded-[16px] bg-sidebar-primary text-sidebar-primary-foreground",
                    )}
                  >
                    {server.name.charAt(0).toUpperCase()}
                  </button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">{server.name}</TooltipContent>
            </Tooltip>
          );
        })}

        <Separator className="w-8 my-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="group relative flex items-center justify-center w-full">
              <button
                onClick={() => setShowCreate(true)}
                className="h-[48px] w-[48px] rounded-[24px] bg-card flex items-center justify-center text-green-500 transition-all hover:rounded-[16px] hover:bg-green-500 hover:text-white"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">Create a server</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="group relative flex items-center justify-center w-full">
              <button
                onClick={() => setShowJoin(true)}
                className="h-[48px] w-[48px] rounded-[24px] bg-card flex items-center justify-center text-green-500 transition-all hover:rounded-[16px] hover:bg-green-500 hover:text-white text-sm font-bold"
              >
                Join
              </button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">Join a server</TooltipContent>
        </Tooltip>

        <div className="mt-auto" />

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="group relative flex items-center justify-center w-full">
              <button
                onClick={() => setActiveWorkspace(null)}
                className="h-[48px] w-[48px] rounded-[24px] bg-card flex items-center justify-center text-muted-foreground transition-all hover:rounded-[16px] hover:bg-sidebar-accent hover:text-foreground"
              >
                <ArrowLeftRight className="h-5 w-5" />
              </button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">Switch workspace</TooltipContent>
        </Tooltip>
      </div>

      <CreateServerDialog open={showCreate} onOpenChange={setShowCreate} />
      <JoinServerDialog open={showJoin} onOpenChange={setShowJoin} />
    </>
  );
}
