import { Hash, Volume2 } from "lucide-react";
import type { Channel } from "@nexus/shared";

interface ChannelHeaderProps {
  channel: Channel;
}

export function ChannelHeader({ channel }: ChannelHeaderProps) {
  return (
    <div className="flex items-center gap-2 h-12 px-4 border-b border-border shrink-0">
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
    </div>
  );
}
