"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Loader2,
  Building2,
  Store,
  MailWarning,
  BadgeCheck,
} from "lucide-react";

type Role = "BUYER" | "VENDOR";

/** Result of validating an invite token from the URL. */
type InviteState =
  | { status: "none" }
  | { status: "checking" }
  | { status: "valid"; vendorName: string; email: string }
  | { status: "invalid"; message: string };

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token");

  const [role, setRole] = useState<Role>("BUYER");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<InviteState>(
    inviteToken ? { status: "checking" } : { status: "none" }
  );

  // Validate the invite token before showing the form, so an expired or already
  // used link fails loudly here instead of at submit time.
  useEffect(() => {
    if (!inviteToken) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/invite/${encodeURIComponent(inviteToken)}`
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (!res.ok) {
          setInvite({
            status: "invalid",
            message: data.error || "This invite link is no longer valid.",
          });
          return;
        }

        setInvite({
          status: "valid",
          vendorName: data.vendorName,
          email: data.email,
        });
        // An invite is always a vendor invite: lock the role and prefill the
        // address it was sent to.
        setRole("VENDOR");
        setEmail(data.email);
        setCompany(data.vendorName);
      } catch {
        if (!cancelled) {
          setInvite({
            status: "invalid",
            message: "Could not verify this invite link. Please try again.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

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
        ...(invite.status === "valid" && inviteToken ? { inviteToken } : {}),
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

  // ── Invite link states ────────────────────────────────────────────────
  if (invite.status === "checking") {
    return (
      <Shell>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-6">
          <Loader2 className="h-5 w-5 animate-spin text-signal" />
          <p className="text-sm text-ink-muted">Checking your invitation…</p>
        </div>
      </Shell>
    );
  }

  if (invite.status === "invalid") {
    return (
      <Shell>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <MailWarning className="h-6 w-6 text-tier-high" />
          <h2 className="mt-3 text-lg font-semibold text-ink">
            This invitation can&apos;t be used
          </h2>
          <p className="mt-1.5 text-sm text-ink-muted">{invite.message}</p>
          <p className="mt-4 text-sm text-ink-muted">
            Invitations expire after 7 days and can only be used once. Ask your
            security contact to send a new one.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-signal-hover"
          >
            Go to sign in
          </Link>
        </div>
      </Shell>
    );
  }

  const invited = invite.status === "valid";

  return (
    <Shell>
      {invited ? (
        <div className="mb-6 rounded-xl border border-signal bg-signal-soft p-4">
          <div className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-signal" />
            <div>
              <p className="text-sm font-medium text-ink">
                You&apos;ve been invited to complete the security assessment for{" "}
                {invite.vendorName}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Set a password to create your vendor account. You&apos;ll accept
                an NDA next, then fill in the questionnaire.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-semibold text-ink">Create your account</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Choose the account type that matches your role.
          </p>
        </>
      )}

      {/* Role selector — hidden for invitees, whose role is fixed by the invite */}
      {!invited && (
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
      )}

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
            {!invited && (
              <span className="font-normal text-ink-muted">(optional)</span>
            )}
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
            readOnly={invited}
            placeholder="name@company.com"
            className={`w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-signal ${
              invited ? "bg-slate-50 text-ink-muted" : "bg-white"
            }`}
          />
          {invited && (
            <p className="mt-1 text-xs text-ink-muted">
              This is the address the invitation was sent to.
            </p>
          )}
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

        {role === "BUYER" && !invited && (
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
          <div className="rounded-lg bg-tier-highbg px-3 py-2 text-sm text-tier-high">
            <p>{error}</p>
            {error.includes("already exists") && (
              <Link href="/login" className="mt-1 inline-block font-medium underline">
                Sign in instead
              </Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-signal-hover disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading
            ? "Creating account..."
            : invited
              ? "Accept invitation"
              : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-signal hover:underline">
          Sign in
        </Link>
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-signal" />
          <span className="text-lg font-semibold">RakshAI</span>
        </div>
        {children}
      </div>
    </div>
  );
}

// useSearchParams needs a Suspense boundary in the App Router.
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-6">
            <Loader2 className="h-5 w-5 animate-spin text-signal" />
            <p className="text-sm text-ink-muted">Loading…</p>
          </div>
        </Shell>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
