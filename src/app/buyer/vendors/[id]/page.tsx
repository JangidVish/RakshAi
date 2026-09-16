import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, FileCheck2, ClipboardCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { QUESTIONNAIRE } from "@/lib/questionnaire-config";
import { tierStyles, statusLabels, statusStyles } from "@/lib/utils";
import { RiskReviewPanel } from "@/components/risk-review-panel";
import { InviteVendorPanel } from "@/components/invite-vendor-panel";

export const dynamic = "force-dynamic";

function fmt(d: Date | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function VendorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: {
      nda: true,
      questionnaire: true,
      riskSummary: true,
      _count: { select: { users: true } },
    },
  });

  if (!vendor) notFound();

  const answers =
    (vendor.questionnaire?.answers as Record<string, unknown>) ?? {};

  const summary = vendor.riskSummary
    ? {
        summary: vendor.riskSummary.summary,
        topRisks: (vendor.riskSummary.topRisks as string[]) ?? [],
        gaps: (vendor.riskSummary.gaps as string[]) ?? [],
        tier: vendor.riskSummary.tier,
        source: vendor.riskSummary.source,
      }
    : null;

  // Timeline from the timestamps we actually have.
  const timeline = [
    { label: "Vendor added", at: vendor.createdAt },
    { label: "NDA accepted", at: vendor.nda?.acceptedAt ?? null },
    { label: "Questionnaire submitted", at: vendor.questionnaire?.submittedAt ?? null },
    { label: "AI summary generated", at: vendor.riskSummary?.createdAt ?? null },
    { label: "Buyer reviewed", at: vendor.reviewedAt ?? null },
  ].filter((t) => t.at);

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <Link
        href="/buyer/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to vendors
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-ink">{vendor.name}</h1>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tierStyles[vendor.riskTier]}`}
            >
              {vendor.riskTier}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[vendor.status] ?? "bg-slate-100 text-slate-600"}`}
            >
              {statusLabels[vendor.status] ?? vendor.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {vendor.domain ?? "—"} · {vendor.category ?? "Uncategorized"} · AI
            exposure {vendor.aiExposure}%
          </p>
        </div>
      </div>

      {vendor.status === "REMEDIATION" && vendor.remediationNote && (
        <div className="mb-6 rounded-xl border border-tier-high/30 bg-tier-highbg p-4">
          <p className="text-sm font-medium text-tier-high">
            Remediation requested
          </p>
          <p className="mt-1 text-sm text-ink-muted">{vendor.remediationNote}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <RiskReviewPanel
            vendorId={vendor.id}
            initial={summary}
            status={vendor.status}
            canReview={Boolean(vendor.questionnaire?.submitted)}
          />

          {/* Questionnaire answers */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-signal" />
              <h2 className="text-lg font-semibold text-ink">
                Questionnaire responses
              </h2>
            </div>
            {vendor.questionnaire?.submitted ? (
              <div className="space-y-5">
                {QUESTIONNAIRE.map((section) => (
                  <div key={section.id}>
                    <h3 className="mb-2 text-sm font-semibold text-ink">
                      {section.title}
                    </h3>
                    <dl className="space-y-1.5">
                      {section.fields.map((f) => {
                        const v = answers[f.id];
                        const shown =
                          v === undefined || v === null || v === ""
                            ? "—"
                            : typeof v === "boolean"
                              ? v
                                ? "Yes"
                                : "No"
                              : String(v);
                        return (
                          <div
                            key={f.id}
                            className="flex justify-between gap-4 text-sm"
                          >
                            <dt className="text-ink-muted">{f.label}</dt>
                            <dd className="text-right font-medium text-ink">
                              {shown}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">
                The vendor has not submitted the questionnaire yet.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          <InviteVendorPanel
            vendorId={vendor.id}
            vendorName={vendor.name}
            domain={vendor.domain}
            hasAccount={vendor._count.users > 0}
          />

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-signal" />
              <h2 className="text-base font-semibold text-ink">Profile</h2>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Status</dt>
                <dd className="font-medium text-ink">
                  {statusLabels[vendor.status] ?? vendor.status}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Risk tier</dt>
                <dd className="font-medium text-ink">{vendor.riskTier}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">NDA</dt>
                <dd className="font-medium text-ink">
                  {vendor.nda?.accepted ? "Signed" : "Not signed"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-signal" />
              <h2 className="text-base font-semibold text-ink">Timeline</h2>
            </div>
            <ol className="space-y-3">
              {timeline.map((t) => (
                <li key={t.label} className="flex justify-between gap-4 text-sm">
                  <span className="text-ink-muted">{t.label}</span>
                  <span className="font-medium text-ink">{fmt(t.at)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
