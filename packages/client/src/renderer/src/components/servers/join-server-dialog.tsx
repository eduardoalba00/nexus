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

interface JoinServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinServerDialog({ open, onOpenChange }: JoinServerDialogProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const joinServer = useServerStore((s) => s.joinServer);
  const setActiveServer = useServerStore((s) => s.setActiveServer);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
      const server = await joinServer(code.trim());
      setActiveServer(server.id);
      toast.success(`Joined "${server.name}"!`);
      setCode("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to join server. Invalid or expired invite code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a server</DialogTitle>
          <DialogDescription>
            Enter an invite code to join an existing server.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite code</Label>
            <Input
              id="invite-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter invite code"
              autoFocus
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!code.trim() || loading}>
              {loading ? "Joining..." : "Join Server"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
