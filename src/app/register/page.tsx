"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Loader2, Building2, Store } from "lucide-react";

type Role = "BUYER" | "VENDOR";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("BUYER");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        company,
        email,
        password,
        role,
        ...(role === "BUYER" ? { inviteCode } : {}),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    // Auto sign-in after successful registration
    await signIn("credentials", { email, password, redirect: false });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-signal" />
          <span className="text-lg font-semibold">RakshAI</span>
        </div>

        <h2 className="text-2xl font-semibold text-ink">Create your account</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Choose the account type that matches your role.
        </p>

        {/* Role selector */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("BUYER")}
            className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition ${
              role === "BUYER"
                ? "border-signal bg-signal-soft"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <Building2 className="h-5 w-5 text-signal" />
            <span className="text-sm font-medium text-ink">Buyer / CISO</span>
            <span className="text-xs text-ink-muted">Assess and monitor vendors</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("VENDOR")}
            className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition ${
              role === "VENDOR"
                ? "border-signal bg-signal-soft"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <Store className="h-5 w-5 text-signal" />
            <span className="text-sm font-medium text-ink">Vendor</span>
            <span className="text-xs text-ink-muted">Respond to assessments</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Full name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Priya Sharma"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-signal"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Company{" "}
              <span className="font-normal text-ink-muted">(optional)</span>
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corp"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-signal"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-signal"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-signal"
            />
          </div>

          {role === "BUYER" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Invite code
              </label>
              <input
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Provided by your RakshAI administrator"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-signal"
              />
              <p className="mt-1 text-xs text-ink-muted">
                Buyer accounts require an invite code.
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-tier-highbg px-3 py-2 text-sm text-tier-high">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-signal-hover disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-signal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
