import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ShieldCheck } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { SignOutButton } from "@/components/signout-button";

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BUYER") {
    redirect("/login");
  }

  return (
    <div className="flex">
      <Sidebar userName={session.user.name ?? "User"} />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        {/* Mobile top bar (sidebar is hidden below lg). */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-signal" />
            <span className="font-semibold text-ink">RakshAI</span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/buyer/dashboard" className="text-ink-muted hover:text-ink">
              Dashboard
            </Link>
            <Link href="/buyer/monitoring" className="text-ink-muted hover:text-ink">
              Monitoring
            </Link>
            <SignOutButton />
          </nav>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
