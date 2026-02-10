import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChannelStore } from "@/stores/channels";

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
}

export function CreateChannelDialog({ open, onOpenChange, serverId }: CreateChannelDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"text" | "voice">("text");
  const [loading, setLoading] = useState(false);
  const createChannel = useChannelStore((s) => s.createChannel);
  const fetchChannels = useChannelStore((s) => s.fetchChannels);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await createChannel(serverId, { name: name.trim().toLowerCase().replace(/\s+/g, "-"), type });
      await fetchChannels(serverId);
      toast.success("Channel created!");
      setName("");
      setType("text");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create channel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a channel</DialogTitle>
          <DialogDescription>
            Create a new text or voice channel in this server.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Channel type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === "text" ? "default" : "secondary"}
                size="sm"
                onClick={() => setType("text")}
              >
                # Text
              </Button>
              <Button
                type="button"
                variant={type === "voice" ? "default" : "secondary"}
                size="sm"
                onClick={() => setType("voice")}
              >
                Voice
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="channel-name">Channel name</Label>
            <Input
              id="channel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="new-channel"
              maxLength={100}
              autoFocus
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading ? "Creating..." : "Create Channel"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
