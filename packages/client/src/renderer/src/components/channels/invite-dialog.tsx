import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SERVER_ROUTES, buildRoute } from "@nexus/shared";
import type { Invite } from "@nexus/shared";
import { api } from "@/lib/api";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
}

export function InviteDialog({ open, onOpenChange, serverId }: InviteDialogProps) {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const createInvite = async () => {
    setLoading(true);
    try {
      const inv = await api.post<Invite>(
        buildRoute(SERVER_ROUTES.INVITES_CREATE, { serverId }),
        {},
      );
      setInvite(inv);
    } catch {
      toast.error("Failed to create invite");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!invite) return;
    await navigator.clipboard.writeText(invite.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setInvite(null);
      setCopied(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 overflow-hidden">
        <DialogHeader className="pt-6 px-6">
          <DialogTitle className="text-xl text-center font-bold">Invite people</DialogTitle>
          <DialogDescription className="text-center">
            Share the invite code with others so they can join the server.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 space-y-4">
          {!invite ? (
            <Button onClick={createInvite} disabled={loading} className="w-full">
              {loading ? "Generating..." : "Generate Invite Code"}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/50 rounded-md px-4 py-3 font-mono text-lg text-center select-all">
                {invite.code}
              </div>
              <Button size="icon" variant="secondary" onClick={copyCode}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
          <div className="bg-muted/30 -mx-6 px-6 py-4 mt-6" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
