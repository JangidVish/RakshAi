"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const NDA_TEXT = `This Non-Disclosure Agreement ("Agreement") is entered into between the vendor organization ("Vendor") and the assessing party ("Buyer") for the purpose of a security risk assessment.

1. Confidential Information. Both parties may exchange confidential information during the assessment, including security posture, questionnaire responses, and remediation details.

2. Obligations. The receiving party agrees to protect confidential information with the same degree of care it uses for its own confidential information and to use it solely for the assessment.

3. Term. Confidentiality obligations survive for three (3) years from the date of acceptance.

4. No License. Nothing in this Agreement grants any rights to intellectual property beyond the assessment purpose.

By accepting, you confirm you are authorized to bind your organization to these terms.`;

export function NdaAcceptForm() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/nda/accept", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not record acceptance. Try again.");
      setLoading(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-ink">Non-Disclosure Agreement</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Please review and accept to continue onboarding.
      </p>

      <div className="mt-4 max-h-64 overflow-y-auto whitespace-pre-line rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-ink-muted">
        {NDA_TEXT}
      </div>

      <label className="mt-4 flex items-start gap-3 text-sm text-ink">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300"
        />
        <span>
          I have read and agree to the Non-Disclosure Agreement on behalf of my
          organization.
        </span>
      </label>

      {error && (
        <p className="mt-3 rounded-lg bg-tier-highbg px-3 py-2 text-sm text-tier-high">
          {error}
        </p>
      )}

      <button
        onClick={handleAccept}
        disabled={!agreed || loading}
        className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-signal px-5 py-2.5 text-sm font-medium text-white transition hover:bg-signal-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Recording..." : "Accept & Continue"}
      </button>
    </div>
  );
}
