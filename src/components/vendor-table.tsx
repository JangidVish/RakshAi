"use client";

import { useEffect, useState } from "react";
import { Search, Inbox, Loader2 } from "lucide-react";
import {
  tierStyles,
  statusLabels,
  statusStyles,
} from "@/lib/utils";

type Vendor = {
  id: string;
  name: string;
  domain: string | null;
  category: string | null;
  riskTier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  aiExposure: number;
  status: string;
  updatedAt: string;
};

const tierOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function VendorTable() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/vendors")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load vendors");
        return res.json();
      })
      .then((data) => setVendors(data.vendors))
      .catch(() => setError("Couldn't load vendors. Refresh to try again."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = vendors
    .filter((v) => (tierFilter === "ALL" ? true : v.riskTier === tierFilter))
    .filter(
      (v) =>
        v.name.toLowerCase().includes(query.toLowerCase()) ||
        (v.domain ?? "").toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => tierOrder[a.riskTier] - tierOrder[b.riskTier]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-ink-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading vendors...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-tier-high/20 bg-tier-highbg p-6 text-center text-sm text-tier-high">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vendors..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-signal"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                tierFilter === t
                  ? "bg-ink text-white"
                  : "text-ink-muted hover:bg-slate-50"
              }`}
            >
              {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Inbox className="mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-ink">No vendors found</p>
          <p className="mt-1 text-sm text-ink-muted">
            {query || tierFilter !== "ALL"
              ? "Try adjusting your search or filter."
              : "Vendors you add will appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Risk tier</th>
                <th className="px-4 py-3">AI exposure</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((v) => (
                <tr key={v.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{v.name}</div>
                    {v.domain && (
                      <div className="text-xs text-ink-muted">{v.domain}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {v.category ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tierStyles[v.riskTier]}`}
                    >
                      {v.riskTier.charAt(0) + v.riskTier.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-signal"
                          style={{ width: `${v.aiExposure}%` }}
                        />
                      </div>
                      <span className="text-xs text-ink-muted">
                        {v.aiExposure}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[v.status] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {statusLabels[v.status] ?? v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
