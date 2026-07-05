import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

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
      <main className="h-screen flex-1 overflow-y-auto bg-slate-50">{children}</main>
    </div>
  );
}
