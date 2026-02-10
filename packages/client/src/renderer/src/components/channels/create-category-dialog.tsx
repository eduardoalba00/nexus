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

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
}

export function CreateCategoryDialog({ open, onOpenChange, serverId }: CreateCategoryDialogProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const createCategory = useChannelStore((s) => s.createCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await createCategory(serverId, name.trim());
      toast.success("Category created!");
      setName("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a category</DialogTitle>
          <DialogDescription>
            Categories help organize your channels.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Category name</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="General"
              maxLength={100}
              autoFocus
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading ? "Creating..." : "Create Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
