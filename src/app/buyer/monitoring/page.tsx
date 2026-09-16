import Link from "next/link";
import { Activity, TriangleAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { tierStyles } from "@/lib/utils";
import {
  RiskOverTimeChart,
  TierPieChart,
} from "@/components/monitoring-charts";

export const dynamic = "force-dynamic";

// Phase 5 monitoring stub. The pie is real (live tier counts); the trend line is
// seeded historical data (no time-series store in the MVP), clearly a stub.
export default async function MonitoringPage() {
  const grouped = await prisma.vendor.groupBy({
    by: ["riskTier"],
    _count: { _all: true },
  });
  const tierCounts = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((tier) => ({
    tier,
    count: grouped.find((g) => g.riskTier === tier)?._count._all ?? 0,
  }));

  // Vendors needing attention → action items (real, derived from status).
  const attention = await prisma.vendor.findMany({
    where: { status: { in: ["REMEDIATION", "PENDING_REVIEW", "QUESTIONNAIRE_SENT"] } },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { id: true, name: true, status: true, riskTier: true, remediationNote: true },
  });

  // Seeded trend (Phase 5 stub — no historical store yet).
  const riskTrend = [
    { month: "Feb", score: 61 },
    { month: "Mar", score: 58 },
    { month: "Apr", score: 63 },
    { month: "May", score: 55 },
    { month: "Jun", score: 49 },
    { month: "Jul", score: 46 },
  ];

  const actionLabel: Record<string, string> = {
    REMEDIATION: "Remediation requested",
    PENDING_REVIEW: "Awaiting your review",
    QUESTIONNAIRE_SENT: "Questionnaire in progress",
  };

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-signal" />
          <h1 className="text-2xl font-semibold text-ink">Monitoring</h1>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            Phase 5 preview
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          Portfolio risk trend, tier distribution, and open action items.
        </p>
      </header>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-ink">
            Average risk score over time
            <span className="ml-2 font-normal text-ink-muted">(seeded)</span>
          </h2>
          <RiskOverTimeChart data={riskTrend} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-ink">
            Vendors by risk tier
          </h2>
          <TierPieChart data={tierCounts} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
          <TriangleAlert className="h-4 w-4 text-tier-medium" />
          Top open action items
        </h2>
        {attention.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Nothing needs attention — all vendors are up to date.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
                <th className="py-2">Vendor</th>
                <th className="py-2">Tier</th>
                <th className="py-2">Action needed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attention.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="py-2.5">
                    <Link
                      href={`/buyer/vendors/${v.id}`}
                      className="font-medium text-ink hover:text-signal hover:underline"
                    >
                      {v.name}
                    </Link>
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tierStyles[v.riskTier]}`}
                    >
                      {v.riskTier}
                    </span>
                  </td>
                  <td className="py-2.5 text-ink-muted">
                    {v.remediationNote
                      ? v.remediationNote
                      : actionLabel[v.status] ?? v.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
