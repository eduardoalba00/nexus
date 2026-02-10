import { Mic, MicOff, Headphones, HeadphoneOff, PhoneOff } from "lucide-react";
import { useVoiceStore } from "@/stores/voice";
import { cn } from "@/lib/utils";

export function VoicePanel() {
  const currentChannelId = useVoiceStore((s) => s.currentChannelId);
  const isConnecting = useVoiceStore((s) => s.isConnecting);
  const isMuted = useVoiceStore((s) => s.isMuted);
  const isDeafened = useVoiceStore((s) => s.isDeafened);
  const leaveChannel = useVoiceStore((s) => s.leaveChannel);
  const toggleMute = useVoiceStore((s) => s.toggleMute);
  const toggleDeafen = useVoiceStore((s) => s.toggleDeafen);

  if (!currentChannelId) return null;

  return (
    <div className="border-t border-border bg-background/50 px-3 py-2">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            isConnecting ? "bg-yellow-500 animate-pulse" : "bg-green-500",
          )}
        />
        <span className="text-xs font-medium text-green-500">
          {isConnecting ? "Connecting..." : "Voice Connected"}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={toggleMute}
          className={cn(
            "p-1.5 rounded hover:bg-secondary/80 transition-colors",
            isMuted && "text-destructive",
          )}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <button
          onClick={toggleDeafen}
          className={cn(
            "p-1.5 rounded hover:bg-secondary/80 transition-colors",
            isDeafened && "text-destructive",
          )}
          title={isDeafened ? "Undeafen" : "Deafen"}
        >
          {isDeafened ? <HeadphoneOff className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
        </button>
        <button
          onClick={leaveChannel}
          className="p-1.5 rounded hover:bg-destructive/20 text-destructive transition-colors ml-auto"
          title="Disconnect"
        >
          <PhoneOff className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
