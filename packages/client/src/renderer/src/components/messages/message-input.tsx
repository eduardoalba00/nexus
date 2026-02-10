import { useState, useRef } from "react";
import { SendHorizontal } from "lucide-react";
import { useMessageStore } from "@/stores/messages";

interface MessageInputProps {
  channelId: string;
}

export function MessageInput({ channelId }: MessageInputProps) {
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
      <div className="flex items-end gap-2 bg-secondary rounded-lg px-4 py-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Send a message..."
          className="flex-1 bg-transparent text-sm resize-none outline-none max-h-[200px] py-1 placeholder:text-muted-foreground"
          rows={1}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors pb-1"
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
