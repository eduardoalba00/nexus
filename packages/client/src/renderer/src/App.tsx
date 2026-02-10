import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Titlebar } from "@/components/titlebar";
import { AuthPage } from "@/pages/auth";
import { AppShell } from "@/pages/app-shell";
import { useAuthStore } from "@/stores/auth";

export default function App() {
  const { user, tokens, fetchMe } = useAuthStore();
  const isAuthenticated = !!user && !!tokens;

  useEffect(() => {
    if (tokens) {
      fetchMe();
    }
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <Titlebar />
      {isAuthenticated ? <AppShell /> : <AuthPage />}
      <Toaster position="bottom-right" />
    </div>
  );
}
