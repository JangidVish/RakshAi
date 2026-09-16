"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, CheckCircle2, AlertCircle } from "lucide-react";
import { QUESTIONNAIRE, missingRequired } from "@/lib/questionnaire-config";

type Answers = Record<string, string | boolean>;
type SaveState = "idle" | "saving" | "saved";

export function QuestionnaireForm() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [active, setActive] = useState(0); // active section index
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState<string[]>([]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing draft.
  useEffect(() => {
    fetch("/api/questionnaire")
      .then((r) => r.json())
      .then((d) => {
        setAnswers((d.answers as Answers) ?? {});
        setSubmitted(Boolean(d.submitted));
      })
      .catch(() => setError("Couldn't load your questionnaire."))
      .finally(() => setLoading(false));
  }, []);

  // Debounced autosave whenever answers change (but not while loading/submitted).
  function scheduleSave(next: Answers) {
    if (submitted) return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await fetch("/api/questionnaire", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: next }),
        });
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    }, 800);
  }

  function setField(id: string, value: string | boolean) {
    const next = { ...answers, [id]: value };
    setAnswers(next);
    scheduleSave(next);
  }

  async function handleSubmit() {
    setError("");
    // Client-side pre-check mirrors the server rule for instant feedback.
    const stillMissing = missingRequired(answers);
    if (stillMissing.length > 0) {
      setMissing(stillMissing);
      setError(`Please complete all required fields (${stillMissing.length} left).`);
      return;
    }
    setSubmitting(true);
    // Flush any pending draft first.
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await fetch("/api/questionnaire", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const res = await fetch("/api/questionnaire", { method: "POST" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMissing(d.missing ?? []);
      setError(d.error || "Submission failed.");
      setSubmitting(false);
      return;
    }
    setSubmitted(true);
    setSubmitting(false);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-ink-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-tier-low/30 bg-tier-lowbg p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-tier-low" />
        <h2 className="mt-3 text-xl font-semibold text-ink">
          Questionnaire submitted
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Your responses are with the buyer for review. We&apos;ll notify you of
          any updates.
        </p>
      </div>
    );
  }

  const total = QUESTIONNAIRE.flatMap((s) => s.fields.filter((f) => f.required)).length;
  const done = total - missingRequired(answers).length;
  const pct = Math.round((done / total) * 100);
  const section = QUESTIONNAIRE[active];

  return (
    <div>
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-medium text-ink">
            {done} / {total} required complete
          </span>
          <span className="flex items-center gap-1 text-xs text-ink-muted">
            {saveState === "saving" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Saving...
              </>
            )}
            {saveState === "saved" && (
              <>
                <Check className="h-3 w-3 text-tier-low" /> Draft saved
              </>
            )}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-signal transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Section tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {QUESTIONNAIRE.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActive(i)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              i === active
                ? "bg-ink text-white"
                : "bg-white text-ink-muted hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {i + 1}. {s.title}
          </button>
        ))}
      </div>

      {/* Active section fields */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
        <div className="mt-4 space-y-5">
          {section.fields.map((f) => {
            const isMissing = missing.includes(f.id);
            return (
              <div key={f.id}>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  {f.label}
                  {f.required && <span className="text-tier-high"> *</span>}
                </label>

                {f.type === "text" && (
                  <input
                    type="text"
                    value={(answers[f.id] as string) ?? ""}
                    onChange={(e) => setField(f.id, e.target.value)}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm focus:border-signal ${
                      isMissing ? "border-tier-high" : "border-slate-200"
                    }`}
                  />
                )}

                {f.type === "textarea" && (
                  <textarea
                    rows={3}
                    value={(answers[f.id] as string) ?? ""}
                    onChange={(e) => setField(f.id, e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-signal"
                  />
                )}

                {f.type === "select" && (
                  <select
                    value={(answers[f.id] as string) ?? ""}
                    onChange={(e) => setField(f.id, e.target.value)}
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm focus:border-signal ${
                      isMissing ? "border-tier-high" : "border-slate-200"
                    }`}
                  >
                    <option value="">Select...</option>
                    {f.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                )}

                {f.type === "checkbox" && (
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={Boolean(answers[f.id])}
                      onChange={(e) => setField(f.id, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Yes
                  </label>
                )}
              </div>
            );
          })}
        </div>

        {/* Section nav */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setActive((i) => Math.max(0, i - 1))}
            disabled={active === 0}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-ink-muted transition hover:bg-slate-50 disabled:opacity-40"
          >
            Previous
          </button>
          {active < QUESTIONNAIRE.length - 1 ? (
            <button
              onClick={() => setActive((i) => Math.min(QUESTIONNAIRE.length - 1, i + 1))}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-signal px-5 py-2 text-sm font-medium text-white transition hover:bg-signal-hover disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit questionnaire
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-tier-highbg px-3 py-2 text-sm text-tier-high">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
