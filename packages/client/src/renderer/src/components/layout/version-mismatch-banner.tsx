import { AlertTriangle } from "lucide-react";
import { useWsStore } from "@/stores/ws";

export function VersionMismatchBanner() {
  const versionMismatch = useWsStore((s) => s.versionMismatch);

  if (!versionMismatch) return null;

  return (
    <div className="flex items-center gap-2 bg-[oklch(0.55_0.15_30)] px-4 py-1.5 text-white text-sm">
      <AlertTriangle className="size-4 shrink-0" />
      <span>
        The server is being updated. Please try again shortly.
      </span>
    </div>
  );
}
