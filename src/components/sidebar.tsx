"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Activity,
  FileWarning,
  Lock,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/buyer/dashboard", label: "Dashboard", icon: LayoutDashboard, live: true },
  { href: "/buyer/vendors", label: "Vendors", icon: Users, live: true },
  { href: "/buyer/monitoring", label: "Monitoring", icon: Activity, live: false },
  { href: "/buyer/exposure", label: "Exposure & AI-SPM", icon: FileWarning, live: false },
];

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-6 py-5">
        <ShieldCheck className="h-6 w-6 text-signal" />
        <span className="text-lg font-semibold tracking-tight text-ink">RakshAI</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          if (!item.live) {
            return (
              <div
                key={item.href}
                className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-400"
                title="Coming soon"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                <Lock className="h-3 w-3" />
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-signal-soft font-medium text-signal"
                  : "text-ink-muted hover:bg-slate-50 hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 px-3 py-2">
          <p className="text-sm font-medium text-ink">{userName}</p>
          <p className="text-xs text-ink-muted">Buyer / CISO</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-muted transition hover:bg-slate-50 hover:text-ink"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
