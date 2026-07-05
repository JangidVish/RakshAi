import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ShieldCheck } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/signout-button";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "VENDOR") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-signal" />
          <span className="text-lg font-semibold tracking-tight text-ink">
            RakshAI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-ink">
              {session.user.name ?? "Vendor"}
            </p>
            <p className="text-xs text-ink-muted">Vendor</p>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
