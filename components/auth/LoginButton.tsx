"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { heroButtonVariants } from "@/lib/variants";
import { useAuth } from "./AuthProvider";

export function LoginButton() {
  const { user, loading, signIn } = useAuth();

  if (loading) {
    return (
      <div className="text-sm text-[var(--fuzo-charcoal)] opacity-75">
        Loading...
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url} alt={user.name || "User"} />
            <AvatarFallback className="bg-[var(--fuzo-coral)] text-white text-xs">
              {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-[var(--fuzo-navy)] font-medium">
            {user.name || user.email}
          </span>
        </div>
        <LogoutButton />
      </div>
    );
  }

  return (
    <Button
      onClick={signIn}
      className={cn(heroButtonVariants({ variant: "primary", size: "sm" }))}
    >
      Sign in with Google
    </Button>
  );
}

function LogoutButton() {
  const { signOut } = useAuth();

  return (
    <Button onClick={signOut} variant="outline" size="sm" className="text-xs">
      Sign out
    </Button>
  );
}
