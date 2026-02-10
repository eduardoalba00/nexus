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
import { useServerStore } from "@/stores/servers";

interface CreateServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateServerDialog({ open, onOpenChange }: CreateServerDialogProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const createServer = useServerStore((s) => s.createServer);
  const setActiveServer = useServerStore((s) => s.setActiveServer);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const server = await createServer(name.trim());
      setActiveServer(server.id);
      toast.success(`Server "${server.name}" created!`);
      setName("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a server</DialogTitle>
          <DialogDescription>
            Give your new server a name. You can always change it later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-name">Server name</Label>
            <Input
              id="server-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Server"
              maxLength={100}
              autoFocus
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
