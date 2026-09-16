import { prisma } from "@/lib/prisma";
import { VendorTable } from "@/components/vendor-table";
import { AddVendorButton } from "@/components/add-vendor-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Server-side counts for the summary cards
  const [total, elevatedRisk, pendingReview, approved] = await Promise.all([
    prisma.vendor.count(),
    // Elevated risk = HIGH and CRITICAL tiers (the vendors needing attention).
    prisma.vendor.count({ where: { riskTier: { in: ["HIGH", "CRITICAL"] } } }),
    prisma.vendor.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.vendor.count({ where: { status: "APPROVED" } }),
  ]);

  const stats = [
    { label: "Total vendors", value: total },
    { label: "High & critical risk", value: elevatedRisk, accent: "text-tier-high" },
    { label: "Pending review", value: pendingReview, accent: "text-tier-medium" },
    { label: "Approved", value: approved, accent: "text-tier-low" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Vendor & AI map</h1>
          <p className="mt-1 text-sm text-ink-muted">
            One consolidated inventory — risk tier, AI exposure, and lifecycle
            status.
          </p>
        </div>
        <AddVendorButton />
      </header>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <p className="text-sm text-ink-muted">{s.label}</p>
            <p className={`mt-2 text-3xl font-semibold ${s.accent ?? "text-ink"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <VendorTable />
    </div>
  );
}
