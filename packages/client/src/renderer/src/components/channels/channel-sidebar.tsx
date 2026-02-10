import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Hash, Volume2, Plus, LogOut, Link, Settings, Trash2 } from "lucide-react";
import { useServerStore } from "@/stores/servers";
import { useChannelStore } from "@/stores/channels";
import { useAuthStore } from "@/stores/auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateChannelDialog } from "@/components/channels/create-channel-dialog";
import { CreateCategoryDialog } from "@/components/channels/create-category-dialog";
import { InviteDialog } from "@/components/channels/invite-dialog";
import { cn } from "@/lib/utils";
import type { Channel, CategoryWithChannels } from "@nexus/shared";

interface ChannelSidebarProps {
  serverId: string;
}

export function ChannelSidebar({ serverId }: ChannelSidebarProps) {
  const servers = useServerStore((s) => s.servers);
  const leaveServer = useServerStore((s) => s.leaveServer);
  const deleteServer = useServerStore((s) => s.deleteServer);
  const setActiveServer = useServerStore((s) => s.setActiveServer);
  const channelList = useChannelStore((s) => s.channelList);
  const activeChannelId = useChannelStore((s) => s.activeChannelId);
  const setActiveChannel = useChannelStore((s) => s.setActiveChannel);
  const fetchChannels = useChannelStore((s) => s.fetchChannels);
  const user = useAuthStore((s) => s.user);

  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const server = servers.find((s) => s.id === serverId);
  const isOwner = server?.ownerId === user?.id;

  useEffect(() => {
    fetchChannels(serverId);
  }, [serverId, fetchChannels]);

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const handleLeave = async () => {
    await leaveServer(serverId);
    setActiveServer(null);
  };

  const handleDelete = async () => {
    await deleteServer(serverId);
    setActiveServer(null);
  };

  const ChannelItem = ({ channel }: { channel: Channel }) => (
    <button
      onClick={() => setActiveChannel(channel.id)}
      className={cn(
        "flex items-center gap-1.5 w-full px-2 py-1 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors",
        activeChannelId === channel.id && "bg-secondary text-foreground",
      )}
    >
      {channel.type === "voice" ? (
        <Volume2 className="h-4 w-4 shrink-0 opacity-50" />
      ) : (
        <Hash className="h-4 w-4 shrink-0 opacity-50" />
      )}
      <span className="truncate">{channel.name}</span>
    </button>
  );

  const CategorySection = ({ category }: { category: CategoryWithChannels }) => {
    const isCollapsed = collapsedCategories.has(category.id);
    return (
      <div className="mt-4">
        <button
          onClick={() => toggleCategory(category.id)}
          className="flex items-center gap-0.5 px-1 w-full text-xs font-semibold uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          <span className="truncate">{category.name}</span>
        </button>
        {!isCollapsed && (
          <div className="mt-0.5 space-y-0.5 pl-1">
            {category.channels.map((ch) => (
              <ChannelItem key={ch.id} channel={ch} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col w-60 bg-card border-r border-border">
        {/* Server header dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-between px-4 h-12 border-b border-border hover:bg-secondary/50 transition-colors">
              <span className="font-semibold truncate">{server?.name}</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItem onClick={() => setShowInvite(true)}>
              <Link className="h-4 w-4" />
              Invite People
            </DropdownMenuItem>
            {isOwner && (
              <>
                <DropdownMenuItem onClick={() => setShowCreateChannel(true)}>
                  <Plus className="h-4 w-4" />
                  Create Channel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCreateCategory(true)}>
                  <Plus className="h-4 w-4" />
                  Create Category
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Server
                </DropdownMenuItem>
              </>
            )}
            {!isOwner && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLeave}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Leave Server
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Channel list */}
        <ScrollArea className="flex-1">
          <div className="px-2 py-2">
            {/* Uncategorized channels */}
            {channelList?.uncategorized.map((ch) => (
              <ChannelItem key={ch.id} channel={ch} />
            ))}

            {/* Categories with channels */}
            {channelList?.categories.map((cat) => (
              <CategorySection key={cat.id} category={cat} />
            ))}
          </div>
        </ScrollArea>

        {/* User panel */}
        <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-background/50">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-semibold">
            {user?.displayName?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.username}</p>
          </div>
        </div>
      </div>

      <CreateChannelDialog
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
        serverId={serverId}
      />
      <CreateCategoryDialog
        open={showCreateCategory}
        onOpenChange={setShowCreateCategory}
        serverId={serverId}
      />
      <InviteDialog
        open={showInvite}
        onOpenChange={setShowInvite}
        serverId={serverId}
      />
    </>
  );
}
