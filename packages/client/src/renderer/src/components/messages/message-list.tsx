import { useEffect, useRef, useCallback } from "react";
import { useMessageStore } from "@/stores/messages";
import type { Message } from "@nexus/shared";
import { MessageItem } from "@/components/messages/message-item";
import { Loader2 } from "lucide-react";

const EMPTY_MESSAGES: Message[] = [];

interface MessageListProps {
  channelId: string;
}

export function MessageList({ channelId }: MessageListProps) {
  const messages = useMessageStore((s) => s.messagesByChannel[channelId] ?? EMPTY_MESSAGES);
  const hasMore = useMessageStore((s) => s.hasMore[channelId] ?? true);
  const fetchMessages = useMessageStore((s) => s.fetchMessages);

  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wasAtBottom = useRef(true);
  const loadingMore = useRef(false);

  // Initial fetch
  useEffect(() => {
    fetchMessages(channelId);
  }, [channelId, fetchMessages]);

  // Auto-scroll to bottom on new messages if user was at bottom
  useEffect(() => {
    if (wasAtBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [messages.length]);

  // Scroll to bottom on channel change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
    wasAtBottom.current = true;
  }, [channelId]);

  const handleScroll = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    wasAtBottom.current = atBottom;

    // Load more on scroll to top
    if (el.scrollTop < 100 && hasMore && !loadingMore.current && messages.length > 0) {
      loadingMore.current = true;
      const prevHeight = el.scrollHeight;
      await fetchMessages(channelId, messages[0].id);
      // Maintain scroll position
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - prevHeight;
        loadingMore.current = false;
      });
    }
  }, [channelId, hasMore, messages, fetchMessages]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-2"
    >
      {hasMore && messages.length > 0 && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {messages.map((message, i) => {
        const prev = messages[i - 1];
        const isCompact =
          prev &&
          prev.author.id === message.author.id &&
          new Date(message.createdAt).getTime() -
            new Date(prev.createdAt).getTime() <
            5 * 60 * 1000;

        return (
          <MessageItem
            key={message.id}
            message={message}
            compact={isCompact}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
