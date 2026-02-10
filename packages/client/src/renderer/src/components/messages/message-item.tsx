import { useState } from "react";
import { Pencil, Trash2, X, Check } from "lucide-react";
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
  const [hovering, setHovering] = useState(false);

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

  if (compact) {
    return (
      <div
        className="group flex items-start gap-4 px-2 py-0.5 hover:bg-secondary/30 rounded"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div className="w-10 shrink-0 flex justify-center">
          {hovering && (
            <span className="text-[10px] text-muted-foreground leading-[22px]">
              {formatTime(message.createdAt)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="flex-1 bg-secondary rounded px-2 py-1 text-sm resize-none outline-none"
                rows={1}
                autoFocus
              />
              <button onClick={handleEdit} className="text-green-500 hover:text-green-400">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => { setEditing(false); setEditContent(message.content); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
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
        {isOwn && hovering && !editing && (
          <div className="flex gap-1 shrink-0">
            <button onClick={() => { setEditing(true); setEditContent(message.content); }} className="text-muted-foreground hover:text-foreground p-1">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive p-1">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="group flex items-start gap-4 px-2 py-2 mt-4 first:mt-0 hover:bg-secondary/30 rounded"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-semibold shrink-0">
        {message.author.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm">{message.author.displayName}</span>
          <span className="text-xs text-muted-foreground">{formatDate(message.createdAt)}</span>
        </div>
        {editing ? (
          <div className="flex items-center gap-2 mt-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="flex-1 bg-secondary rounded px-2 py-1 text-sm resize-none outline-none"
              rows={1}
              autoFocus
            />
            <button onClick={handleEdit} className="text-green-500 hover:text-green-400">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => { setEditing(false); setEditContent(message.content); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
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
      {isOwn && hovering && !editing && (
        <div className="flex gap-1 shrink-0">
          <button onClick={() => { setEditing(true); setEditContent(message.content); }} className="text-muted-foreground hover:text-foreground p-1">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive p-1">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
