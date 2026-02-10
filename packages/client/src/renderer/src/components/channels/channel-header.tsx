import { useState } from "react";
import { Hash, Volume2, Users, Search } from "lucide-react";
import { useWsStore } from "@/stores/ws";
import { useMemberStore } from "@/stores/members";
import { cn } from "@/lib/utils";
import type { Channel } from "@nexus/shared";
import { SearchDialog } from "@/components/search/search-dialog";

interface ChannelHeaderProps {
  channel: Channel;
}

export function ChannelHeader({ channel }: ChannelHeaderProps) {
  const connected = useWsStore((s) => s.connected);
  const toggleSidebar = useMemberStore((s) => s.toggleSidebar);
  const showSidebar = useMemberStore((s) => s.showSidebar);
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 h-12 px-4 border-b-2 border-border shrink-0">
        {channel.type === "voice" ? (
          <Volume2 className="h-5 w-5 text-muted-foreground" />
        ) : (
          <Hash className="h-5 w-5 text-muted-foreground" />
        )}
        <span className="font-semibold">{channel.name}</span>
        {channel.topic && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <span className="text-sm text-muted-foreground truncate">{channel.topic}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowSearch(true)}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Search (Ctrl+F)"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={toggleSidebar}
            className={cn(
              "p-1.5 rounded transition-colors",
              showSidebar
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Toggle Members"
          >
            <Users className="h-4 w-4" />
          </button>
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              connected ? "bg-green-500" : "bg-yellow-500 animate-pulse",
            )}
            title={connected ? "Connected" : "Connecting..."}
          />
        </div>
      </div>
      <SearchDialog serverId={channel.serverId} open={showSearch} onOpenChange={setShowSearch} />
    </>
  );
}
