"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X } from "lucide-react";

const TIERS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export function AddVendorButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [category, setCategory] = useState("");
  const [riskTier, setRiskTier] = useState<(typeof TIERS)[number]>("MEDIUM");
  const [aiExposure, setAiExposure] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function close() {
    setOpen(false);
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        // Send optional fields only when filled, so blanks don't fail validation.
        ...(domain ? { domain } : {}),
        ...(category ? { category } : {}),
        riskTier,
        aiExposure: Number(aiExposure) || 0,
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error || "Could not add this vendor.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setName("");
    setDomain("");
    setCategory("");
    setRiskTier("MEDIUM");
    setAiExposure("0");
    setOpen(false);

    // Land on the new vendor so the next step — inviting them — is one click away.
    if (data.vendor?.id) {
      router.push(`/buyer/vendors/${data.vendor.id}`);
    } else {
      router.refresh();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-signal-hover"
      >
        <Plus className="h-4 w-4" />
        Add vendor
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-vendor-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 id="add-vendor-title" className="text-lg font-semibold text-ink">
                  Add a vendor
                </h2>
                <p className="mt-0.5 text-sm text-ink-muted">
                  Adds them to the inventory. You can invite them next.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-md p-1 text-ink-muted transition hover:bg-slate-50 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="v-name"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  Vendor name
                </label>
                <input
                  id="v-name"
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Northwind Cloud"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-signal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="v-domain"
                    className="mb-1.5 block text-sm font-medium text-ink"
                  >
                    Domain
                  </label>
                  <input
                    id="v-domain"
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="northwind.com"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-signal"
                  />
                </div>
                <div>
                  <label
                    htmlFor="v-category"
                    className="mb-1.5 block text-sm font-medium text-ink"
                  >
                    Category
                  </label>
                  <input
                    id="v-category"
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Cloud Infrastructure"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-signal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="v-tier"
                    className="mb-1.5 block text-sm font-medium text-ink"
                  >
                    Initial risk tier
                  </label>
                  <select
                    id="v-tier"
                    value={riskTier}
                    onChange={(e) =>
                      setRiskTier(e.target.value as (typeof TIERS)[number])
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-signal"
                  >
                    {TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="v-ai"
                    className="mb-1.5 block text-sm font-medium text-ink"
                  >
                    AI exposure %
                  </label>
                  <input
                    id="v-ai"
                    type="number"
                    min={0}
                    max={100}
                    value={aiExposure}
                    onChange={(e) => setAiExposure(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-signal"
                  />
                </div>
              </div>

              <p className="text-xs text-ink-muted">
                Tier and exposure are starting estimates — the AI assessment sets
                the real tier once the questionnaire comes back.
              </p>

              {error && (
                <p className="rounded-lg bg-tier-highbg px-3 py-2 text-sm text-tier-high">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-signal-hover disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Adding..." : "Add vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
