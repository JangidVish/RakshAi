import Link from "next/link";
import { getServerSession } from "next-auth";
import { CheckCircle2, Circle, Clock, MailQuestion, ArrowRight } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NdaAcceptForm } from "@/components/nda-accept-form";

export const dynamic = "force-dynamic";

export default async function VendorOnboardPage() {
  // Layout already guarantees a VENDOR session; read the linked vendor (if any).
  const session = await getServerSession(authOptions);
  const vendorId = session?.user.vendorId ?? null;

  const vendor = vendorId
    ? await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: { nda: true, questionnaire: true },
      })
    : null;

  // Self-registered vendor not yet linked to a Vendor record — no engagement yet.
  if (!vendor) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <MailQuestion className="mx-auto h-10 w-10 text-signal" />
          <h1 className="mt-4 text-2xl font-semibold text-ink">
            No active engagement yet
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            Your account isn&apos;t linked to a vendor record. When a buyer
            invites your organization, onboarding steps — NDA and the security
            questionnaire — will appear here.
          </p>
        </div>
      </div>
    );
  }

  const steps = [
    {
      label: "NDA signed",
      done: vendor.nda?.accepted ?? false,
      hint: vendor.nda?.accepted
        ? "Accepted"
        : "Awaiting your signature",
    },
    {
      label: "Security questionnaire",
      done: vendor.questionnaire?.submitted ?? false,
      hint: vendor.questionnaire?.submitted
        ? "Submitted"
        : "Not yet submitted",
    },
    {
      label: "Buyer review",
      done: vendor.status === "APPROVED",
      hint:
        vendor.status === "APPROVED"
          ? "Approved"
          : vendor.status === "PENDING_REVIEW"
            ? "In review"
            : "Pending",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-ink">
          Welcome, {vendor.name}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Complete the steps below to finish onboarding.
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-signal-soft px-3 py-1 text-xs font-medium text-signal">
          <Clock className="h-3 w-3" />
          Status: {vendor.status.replace(/_/g, " ")}
        </span>
      </header>

      {/* Active action: NDA first, then questionnaire. */}
      {!vendor.nda?.accepted ? (
        <div className="mb-8">
          <NdaAcceptForm />
        </div>
      ) : !vendor.questionnaire?.submitted ? (
        <div className="mb-8 flex items-center justify-between rounded-xl border border-signal/30 bg-signal-soft p-5">
          <div>
            <p className="text-sm font-medium text-ink">
              NDA signed — next, complete the security questionnaire.
            </p>
            <p className="text-xs text-ink-muted">
              Four sections. Your progress saves automatically.
            </p>
          </div>
          <Link
            href="/vendor/questionnaire"
            className="flex items-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-signal-hover"
          >
            Start questionnaire
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-tier-low/30 bg-tier-lowbg p-5">
          <p className="text-sm font-medium text-tier-low">
            All steps complete — your submission is with the buyer for review.
          </p>
        </div>
      )}

      <ol className="space-y-3">
        {steps.map((step) => {
          const Icon = step.done ? CheckCircle2 : Circle;
          return (
            <li
              key={step.label}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5"
            >
              <Icon
                className={`h-6 w-6 shrink-0 ${
                  step.done ? "text-tier-low" : "text-slate-300"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-ink">{step.label}</p>
                <p className="text-xs text-ink-muted">{step.hint}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
