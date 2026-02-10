import { useMessageStore } from "@/stores/messages";
import { useAuthStore } from "@/stores/auth";

interface TypingIndicatorProps {
  channelId: string;
}

const EMPTY_TYPING: Record<string, { displayName: string; timeout: ReturnType<typeof setTimeout> }> = {};

export function TypingIndicator({ channelId }: TypingIndicatorProps) {
  const typingUsers = useMessageStore((s) => s.typingUsers[channelId] ?? EMPTY_TYPING);
  const currentUser = useAuthStore((s) => s.user);

  // Filter out self
  const typers = Object.entries(typingUsers)
    .filter(([userId]) => userId !== currentUser?.id)
    .map(([, data]) => data.displayName);

  if (typers.length === 0) return null;

  let text: string;
  if (typers.length === 1) {
    text = `${typers[0]} is typing...`;
  } else if (typers.length === 2) {
    text = `${typers[0]} and ${typers[1]} are typing...`;
  } else if (typers.length === 3) {
    text = `${typers[0]}, ${typers[1]}, and ${typers[2]} are typing...`;
  } else {
    text = "Several people are typing...";
  }

  return (
    <div className="h-6 px-4 flex items-center gap-2 text-xs text-muted-foreground">
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
      </span>
      <span>{text}</span>
    </div>
  );
}
