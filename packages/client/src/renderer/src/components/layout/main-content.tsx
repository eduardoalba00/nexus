import { useChannelStore } from "@/stores/channels";
import { useServerStore } from "@/stores/servers";
import { ChannelHeader } from "@/components/channels/channel-header";
import { MessageList } from "@/components/messages/message-list";
import { MessageInput } from "@/components/messages/message-input";
import { Hash } from "lucide-react";

export function MainContent() {
  const activeServerId = useServerStore((s) => s.activeServerId);
  const activeChannelId = useChannelStore((s) => s.activeChannelId);
  const channelList = useChannelStore((s) => s.channelList);

  // Find the active channel
  let activeChannel = null;
  if (channelList && activeChannelId) {
    activeChannel =
      channelList.uncategorized.find((ch) => ch.id === activeChannelId) ||
      channelList.categories
        .flatMap((cat) => cat.channels)
        .find((ch) => ch.id === activeChannelId) ||
      null;
  }

  if (!activeServerId) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center text-muted-foreground space-y-2">
          <Hash className="h-12 w-12 mx-auto opacity-50" />
          <p className="text-lg font-medium">Select a server</p>
          <p className="text-sm">Choose a server from the sidebar to get started</p>
        </div>
      </div>
    );
  }

  if (!activeChannel) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center text-muted-foreground space-y-2">
          <Hash className="h-12 w-12 mx-auto opacity-50" />
          <p className="text-lg font-medium">Select a channel</p>
          <p className="text-sm">Choose a channel from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ChannelHeader channel={activeChannel} />
      <MessageList channelId={activeChannel.id} />
      <MessageInput channelId={activeChannel.id} />
    </div>
  );
}
