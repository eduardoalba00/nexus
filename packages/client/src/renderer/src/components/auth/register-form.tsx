import { useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      return;
    }
    if (username.length < 3) {
      setLocalError("Username must be at least 3 characters");
      return;
    }

    try {
      await register(username, password, displayName || undefined);
    } catch {
      // Error is already set in store
    }
  };

  const displayError = localError || error;

  return (
    <Card className="w-full max-w-sm shadow-xl overflow-hidden p-0">
      <CardHeader className="pt-8 px-6 text-center">
        <CardTitle className="text-2xl">Create an account</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="px-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg-username" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                clearError();
                setLocalError(null);
              }}
              className="bg-muted/50 border-0 focus-visible:ring-0"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-display-name" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Display Name
            </Label>
            <Input
              id="reg-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={username || ""}
              className="bg-muted/50 border-0 focus-visible:ring-0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
                setLocalError(null);
              }}
              className="bg-muted/50 border-0 focus-visible:ring-0"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-confirm-password" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Confirm Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reg-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setLocalError(null);
              }}
              className="bg-muted/50 border-0 focus-visible:ring-0"
              required
            />
          </div>
          {displayError && <p className="text-sm text-destructive">{displayError}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 bg-muted/30 px-6 py-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Continue"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button type="button" onClick={onSwitchToLogin} className="text-primary hover:underline">
              Log In
            </button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
