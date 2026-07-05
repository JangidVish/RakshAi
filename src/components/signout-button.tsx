"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted transition hover:bg-slate-50 hover:text-ink"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
