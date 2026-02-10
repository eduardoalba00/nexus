import { useState, useRef } from "react";
import { Plus, SendHorizontal } from "lucide-react";
import { useMessageStore } from "@/stores/messages";

interface MessageInputProps {
  channelId: string;
  channelName?: string;
}

export function MessageInput({ channelId, channelName }: MessageInputProps) {
  const [content, setContent] = useState("");
  const sendMessage = useMessageStore((s) => s.sendMessage);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      await sendMessage(channelId, trimmed);
    } catch {
      // Re-populate on failure
      setContent(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="px-4 pb-4 pt-1 shrink-0">
      <div className="relative">
        <div className="absolute top-7 left-4">
          <div className="w-7 h-7 rounded-full bg-muted-foreground/20 flex items-center justify-center">
            <Plus className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={channelName ? `Message #${channelName}` : "Send a message..."}
          className="w-full px-14 py-3 bg-muted/50 border-none rounded-lg text-sm resize-none outline-none max-h-[200px] placeholder:text-muted-foreground"
          rows={1}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="absolute top-7 right-4 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
