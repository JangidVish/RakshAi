"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { tierStyles } from "@/lib/utils";

type Summary = {
  summary: string;
  topRisks: string[];
  gaps: string[];
  tier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  source?: string;
};

export function RiskReviewPanel({
  vendorId,
  initial,
  status,
  canReview,
}: {
  vendorId: string;
  initial: Summary | null;
  status: string;
  canReview: boolean;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(initial);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Typewriter reveal of the summary prose.
  const [typed, setTyped] = useState(initial?.summary ?? "");
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!animating || !summary) return;
    setTyped("");
    let i = 0;
    const full = summary.summary;
    const timer = setInterval(() => {
      i += 3;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(timer);
        setAnimating(false);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [animating, summary]);

  // Remediation modal.
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  async function generate() {
    setError("");
    setGenerating(true);
    const res = await fetch(`/api/risk-summary/${vendorId}`, { method: "POST" });
    setGenerating(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Generation failed.");
      return;
    }
    const data = (await res.json()) as Summary;
    setSummary(data);
    setAnimating(true);
    router.refresh();
  }

  async function review(decision: "APPROVE" | "REMEDIATION") {
    setReviewing(true);
    const res = await fetch(`/api/vendors/${vendorId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note: decision === "REMEDIATION" ? note : undefined }),
    });
    setReviewing(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Action failed.");
      return;
    }
    setShowModal(false);
    setNote("");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-signal" />
          <h2 className="text-lg font-semibold text-ink">AI risk summary</h2>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg bg-signal px-4 py-2 text-sm font-medium text-white transition hover:bg-signal-hover disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generating
            ? "Generating..."
            : summary
              ? "Regenerate"
              : "Generate summary"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-tier-highbg px-3 py-2 text-sm text-tier-high">
          {error}
        </p>
      )}

      {!summary && !generating && (
        <p className="mt-6 text-sm text-ink-muted">
          No summary yet. Generate one from the vendor&apos;s submitted
          questionnaire.
        </p>
      )}

      {generating && (
        <div className="mt-6 flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing questionnaire responses...
        </div>
      )}

      {summary && !generating && (
        <div className="mt-5 space-y-5">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${tierStyles[summary.tier]}`}
            >
              {summary.tier} RISK
            </span>
            {summary.source === "stub" && (
              <span className="text-xs text-ink-muted">
                (dev stub — set OPENAI_API_KEY for AI summary)
              </span>
            )}
          </div>

          <p className="text-sm leading-relaxed text-ink">
            {animating ? typed : summary.summary}
            {animating && <span className="animate-pulse">▋</span>}
          </p>

          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <AlertTriangle className="h-4 w-4 text-tier-high" /> Top risks
            </h3>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-muted">
              {summary.topRisks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">Gaps</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
              {summary.gaps.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Decision actions */}
      {canReview && summary && (
        <div className="mt-6 flex gap-3 border-t border-slate-100 pt-5">
          <button
            onClick={() => review("APPROVE")}
            disabled={reviewing}
            className="flex items-center gap-2 rounded-lg bg-tier-low px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" /> Approve vendor
          </button>
          <button
            onClick={() => setShowModal(true)}
            disabled={reviewing}
            className="flex items-center gap-2 rounded-lg border border-tier-high/30 px-4 py-2 text-sm font-medium text-tier-high transition hover:bg-tier-highbg disabled:opacity-50"
          >
            <AlertTriangle className="h-4 w-4" /> Request remediation
          </button>
        </div>
      )}

      {status === "APPROVED" && (
        <p className="mt-6 flex items-center gap-2 rounded-lg bg-tier-lowbg px-3 py-2 text-sm text-tier-low">
          <Check className="h-4 w-4" /> This vendor is approved.
        </p>
      )}

      {/* Remediation modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink">
                Request remediation
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X className="h-5 w-5 text-ink-muted" />
              </button>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              Describe what the vendor needs to fix. They&apos;ll be notified.
            </p>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Enable MFA for all staff and provide SOC 2 report."
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-signal"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-ink-muted hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => review("REMEDIATION")}
                disabled={reviewing || !note.trim()}
                className="flex items-center gap-2 rounded-lg bg-tier-high px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {reviewing && <Loader2 className="h-4 w-4 animate-spin" />}
                Send request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
