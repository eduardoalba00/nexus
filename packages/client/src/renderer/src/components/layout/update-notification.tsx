import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

type Phase = "checking" | "downloading" | "installing" | "none";

export function UpdateNotification() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [version, setVersion] = useState<string>();
  const [progress, setProgress] = useState<{
    percent: number;
    bytesPerSecond: number;
    transferred: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    if (!window.updaterAPI) {
      setPhase("none");
      return;
    }

    const cleanupStatus = window.updaterAPI.onStatus((data) => {
      switch (data.status) {
        case "available":
          setPhase("downloading");
          setVersion(data.version);
          break;
        case "not-available":
          setPhase("none");
          break;
        case "downloaded":
          setPhase("installing");
          window.updaterAPI.install();
          break;
        case "error":
          // On error (e.g. no internet), let the user through
          setPhase((prev) => (prev === "checking" ? "none" : prev));
          break;
      }
    });

    const cleanupProgress = window.updaterAPI.onProgress((data) => {
      setProgress(data);
    });

    // Trigger a check from the renderer so we don't miss events
    // that fired before the component mounted
    window.updaterAPI.check().catch(() => {
      setPhase((prev) => (prev === "checking" ? "none" : prev));
    });

    return () => {
      cleanupStatus();
      cleanupProgress();
    };
  }, []);

  if (phase === "none") return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 rounded-xl bg-[oklch(0.2_0.02_264)] p-10 text-white shadow-2xl max-w-md w-full mx-4">
        {phase === "checking" && (
          <>
            <div className="flex items-center justify-center size-16 rounded-full bg-[oklch(0.55_0.2_264)]">
              <Loader2 className="size-8 animate-spin" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Checking for Updates</h2>
              <p className="text-white/70">Please wait...</p>
            </div>
          </>
        )}

        {phase === "downloading" && (
          <>
            <div className="flex items-center justify-center size-16 rounded-full bg-[oklch(0.55_0.2_264)]">
              <Loader2 className="size-8 animate-spin" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Downloading Update</h2>
              <p className="text-white/70">
                Version {version} is being downloaded...
              </p>
            </div>
            {progress && (
              <div className="w-full">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[oklch(0.55_0.2_264)] transition-all duration-300"
                    style={{ width: `${Math.round(progress.percent)}%` }}
                  />
                </div>
                <p className="text-xs text-white/50 mt-2 text-center">
                  {Math.round(progress.percent)}%
                </p>
              </div>
            )}
          </>
        )}

        {phase === "installing" && (
          <>
            <div className="flex items-center justify-center size-16 rounded-full bg-[oklch(0.55_0.2_264)]">
              <Loader2 className="size-8 animate-spin" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Installing Update</h2>
              <p className="text-white/70">
                Restarting...
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
