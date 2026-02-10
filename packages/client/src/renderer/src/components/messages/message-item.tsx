import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useMessageStore } from "@/stores/messages";
import { cn } from "@/lib/utils";
import type { Message } from "@nexus/shared";

interface MessageItemProps {
  message: Message;
  compact: boolean;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return `Today at ${formatTime(dateStr)}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday at ${formatTime(dateStr)}`;
  return `${d.toLocaleDateString()} ${formatTime(dateStr)}`;
}

export function MessageItem({ message, compact }: MessageItemProps) {
  const user = useAuthStore((s) => s.user);
  const editMessage = useMessageStore((s) => s.editMessage);
  const deleteMessage = useMessageStore((s) => s.deleteMessage);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isOwn = user?.id === message.author.id;

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setEditing(false);
      return;
    }
    await editMessage(message.channelId, message.id, editContent.trim());
    setEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    }
    if (e.key === "Escape") {
      setEditing(false);
      setEditContent(message.content);
    }
  };

  const handleDelete = async () => {
    await deleteMessage(message.channelId, message.id);
  };

  const ActionToolbar = () => {
    if (!isOwn || editing) return null;
    return (
      <div className="hidden group-hover:flex absolute p-1 -top-2 right-5 bg-card border border-border rounded-md shadow-sm">
        <button
          onClick={() => { setEditing(true); setEditContent(message.content); }}
          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="relative group flex items-start hover:bg-muted/30 px-4 py-0.5">
        <div className="w-10 shrink-0 flex justify-center">
          <span className="hidden group-hover:inline text-[10px] text-muted-foreground leading-[22px]">
            {formatTime(message.createdAt)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="w-full bg-muted border-none rounded-md px-2 py-1 text-sm resize-none outline-none"
                rows={1}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Press Escape to cancel, Enter to save
              </p>
            </div>
          ) : (
            <p className="text-sm break-words whitespace-pre-wrap">
              {message.content}
              {message.editedAt && (
                <span className="text-[10px] text-muted-foreground ml-1">(edited)</span>
              )}
            </p>
          )}
        </div>
        <ActionToolbar />
      </div>
    );
  }

  return (
    <div className="relative group flex items-start hover:bg-muted/30 p-4 gap-4">
      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0 hover:drop-shadow-md">
        {message.author.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm hover:underline cursor-pointer">{message.author.displayName}</span>
          <span className="text-xs text-muted-foreground">{formatDate(message.createdAt)}</span>
        </div>
        {editing ? (
          <div className="space-y-1 mt-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="w-full bg-muted border-none rounded-md px-2 py-1 text-sm resize-none outline-none"
              rows={1}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Press Escape to cancel, Enter to save
            </p>
          </div>
        ) : (
          <p className="text-sm break-words whitespace-pre-wrap">
            {message.content}
            {message.editedAt && (
              <span className="text-[10px] text-muted-foreground ml-1">(edited)</span>
            )}
          </p>
        )}
      </div>
      <ActionToolbar />
    </div>
  );
}
