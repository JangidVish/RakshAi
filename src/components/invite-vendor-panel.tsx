"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Check, Copy, Terminal } from "lucide-react";

type Props = {
  vendorId: string;
  vendorName: string;
  /** Pre-fills the email box from the vendor's domain when we have one. */
  domain?: string | null;
  /** An account is already linked, so there is nobody left to invite. */
  hasAccount: boolean;
};

type Sent = {
  expiresAt: string;
  delivered: "resend" | "console";
  /** Only returned in console mode, so the flow is demoable without an inbox. */
  devLink?: string;
};

export function InviteVendorPanel({
  vendorId,
  vendorName,
  domain,
  hasAccount,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState(domain ? `security@${domain}` : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<Sent | null>(null);
  const [copied, setCopied] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch(`/api/vendors/${vendorId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error || "Could not send the invitation.");
      setLoading(false);
      return;
    }

    setSent(data);
    setLoading(false);
    // Status may have advanced to INVITED.
    router.refresh();
  }

  async function copyLink() {
    if (!sent?.devLink) return;
    try {
      await navigator.clipboard.writeText(sent.devLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — select the link and copy it manually.");
    }
  }

  if (hasAccount) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-2 flex items-center gap-2">
          <Check className="h-5 w-5 text-tier-low" />
          <h2 className="text-lg font-semibold text-ink">Vendor contact</h2>
        </div>
        <p className="text-sm text-ink-muted">
          {vendorName} already has an account on the platform. Send a new
          invitation only if they need a second contact.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-2 flex items-center gap-2">
        <Send className="h-5 w-5 text-signal" />
        <h2 className="text-lg font-semibold text-ink">Invite this vendor</h2>
      </div>
      <p className="mb-4 text-sm text-ink-muted">
        Emails a single-use link that lets {vendorName} create their account,
        accept the NDA, and complete the questionnaire. Expires in 7 days.
      </p>

      {sent ? (
        <div className="space-y-3">
          <div className="rounded-lg bg-tier-lowbg px-3 py-2.5 text-sm text-tier-low">
            <p className="font-medium">Invitation sent to {email}</p>
            <p className="mt-0.5 text-xs">
              Expires {new Date(sent.expiresAt).toLocaleDateString()}
            </p>
          </div>

          {sent.delivered === "console" && sent.devLink && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                <Terminal className="h-3.5 w-3.5" />
                No email provider configured — use this link directly
              </p>
              <p className="break-all rounded bg-white px-2 py-1.5 font-mono text-xs text-ink-soft">
                {sent.devLink}
              </p>
              <button
                type="button"
                onClick={copyLink}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink transition hover:bg-slate-50"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-tier-low" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy link
                  </>
                )}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setSent(null);
              setCopied(false);
            }}
            className="text-sm font-medium text-signal hover:underline"
          >
            Send another invitation
          </button>
        </div>
      ) : (
        <form onSubmit={send} className="space-y-3">
          <div>
            <label
              htmlFor="invite-email"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Security contact email
            </label>
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="security@vendor.com"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-signal"
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
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-signal-hover disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {loading ? "Sending..." : "Send invitation"}
          </button>
        </form>
      )}
    </div>
  );
}
