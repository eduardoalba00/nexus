import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function AppShell() {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Welcome, {user?.displayName || user?.username}!</h1>
        <p className="text-muted-foreground">You're now logged into Nexus.</p>
        <Button variant="secondary" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}
