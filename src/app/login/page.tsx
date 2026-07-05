"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Incorrect email or password. Try again.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-signal" />
          <span className="text-lg font-semibold tracking-tight">RakshAI</span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold leading-tight">
            One protocol for vendor risk, trust, and exposure.
          </h1>
          <p className="mt-4 max-w-md text-sm text-slate-300">
            Discover every vendor, verify identity, and let AI assess risk —
            across the full vendor lifecycle.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Shift Security × Fabrik Protocol × SAFE Security
        </p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <ShieldCheck className="h-6 w-6 text-signal" />
            <span className="text-lg font-semibold">RakshAI</span>
          </div>

          <h2 className="text-2xl font-semibold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Welcome back. Enter your credentials to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ciso@acme.com"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-signal"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-signal"
              />
            </div>

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
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-signal hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-ink-muted">
            <span className="font-medium text-ink">Demo login:</span>{" "}
            ciso@acme.com / password123
          </div>
        </div>
      </div>
    </div>
  );
}
