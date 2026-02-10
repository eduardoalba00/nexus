import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export function UpdateNotification() {
  const [updateReady, setUpdateReady] = useState(false);
  const [version, setVersion] = useState<string>();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!window.updaterAPI) return;

    const cleanup = window.updaterAPI.onStatus((data) => {
      if (data.status === "downloaded") {
        setUpdateReady(true);
        setVersion(data.version);
      }
    });

    return cleanup;
  }, []);

  if (!updateReady || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-[oklch(0.55_0.2_264)] px-4 py-1.5 text-white text-sm">
      <div className="flex items-center gap-2">
        <Download className="size-4" />
        <span>
          A new update{version ? ` (v${version})` : ""} is ready — restart to
          apply.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.updaterAPI.install()}
          className="rounded bg-white/20 px-3 py-0.5 text-xs font-medium hover:bg-white/30 transition-colors cursor-pointer"
        >
          Restart Now
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded p-0.5 hover:bg-white/20 transition-colors cursor-pointer"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
