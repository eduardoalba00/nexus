import { useEffect, useRef, useCallback } from "react";
import { useMessageStore } from "@/stores/messages";
import type { Message } from "@migo/shared";
import { MessageItem } from "@/components/messages/message-item";
import { TypingIndicator } from "@/components/messages/typing-indicator";
import { Loader2, Hash } from "lucide-react";

const EMPTY_MESSAGES: Message[] = [];

interface MessageListProps {
  channelId: string;
  channelName?: string;
}

export function MessageList({ channelId, channelName }: MessageListProps) {
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
      className="flex-1 flex flex-col overflow-y-auto"
    >
      {hasMore && messages.length > 0 && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {!hasMore && channelName && (
        <div className="px-4 pt-8 pb-4">
          <div className="h-[68px] w-[68px] rounded-full bg-muted flex items-center justify-center mb-4">
            <Hash className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Welcome to #{channelName}</h1>
          <p className="text-muted-foreground mt-1">
            This is the start of the #{channelName} channel.
          </p>
        </div>
      )}
      {messages.map((message, i) => {
        const prev = messages[i - 1];
        const isCompact =
          prev &&
          prev.author.id === message.author.id &&
          !message.replyTo &&
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
      <TypingIndicator channelId={channelId} />
      <div ref={bottomRef} />
    </div>
  );
}
