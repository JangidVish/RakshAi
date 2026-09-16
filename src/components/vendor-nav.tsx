"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, FileCheck2 } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/vendor/onboard", label: "Onboarding", icon: FileCheck2 },
  { href: "/vendor/questionnaire", label: "Questionnaire", icon: ClipboardList },
];

export function VendorNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition",
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
  );
}
