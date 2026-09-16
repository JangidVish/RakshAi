import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";

const bodySchema = z.object({
  decision: z.enum(["APPROVE", "REMEDIATION"]),
  note: z.string().optional(),
});

// POST /api/vendors/[id]/review — buyer approves a vendor or requests
// remediation. Records the decision + timestamp and notifies the vendor.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "BUYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { decision, note } = parsed.data;

  if (decision === "REMEDIATION" && (!note || !note.trim())) {
    return NextResponse.json(
      { error: "A remediation note is required." },
      { status: 400 }
    );
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: { users: { select: { email: true } } },
  });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const now = new Date();
  const updated = await prisma.vendor.update({
    where: { id: vendor.id },
    data:
      decision === "APPROVE"
        ? { status: "APPROVED", reviewedAt: now, remediationNote: null }
        : { status: "REMEDIATION", reviewedAt: now, remediationNote: note!.trim() },
  });

  // Notify every linked vendor user (best-effort; failures don't block).
  const recipients = vendor.users.map((u) => u.email).filter(Boolean);
  await Promise.all(
    recipients.map((to) =>
      sendMail({
        to,
        subject:
          decision === "APPROVE"
            ? `${vendor.name} — assessment approved`
            : `${vendor.name} — remediation requested`,
        html:
          decision === "APPROVE"
            ? `<p>Good news — your security assessment has been approved.</p>`
            : `<p>The buyer has requested remediation before approval:</p><blockquote>${note}</blockquote><p>Please address the items above and resubmit.</p>`,
      }).catch(() => undefined)
    )
  );

  return NextResponse.json({
    ok: true,
    status: updated.status,
    reviewedAt: updated.reviewedAt,
  });
}
