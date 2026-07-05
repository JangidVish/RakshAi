import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role === "BUYER") redirect("/buyer/dashboard");
  redirect("/vendor/onboard"); // built in Week 2

  return null;
}
