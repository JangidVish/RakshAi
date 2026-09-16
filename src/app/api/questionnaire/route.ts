import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { allFieldIds, missingRequired } from "@/lib/questionnaire-config";

// Helper: resolve the calling vendor's own questionnaire context.
async function vendorContext() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "VENDOR" || !session.user.vendorId) {
    return null;
  }
  return { vendorId: session.user.vendorId as string };
}

// GET /api/questionnaire — the vendor's own draft/answers + submit state.
export async function GET() {
  const ctx = await vendorContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = await prisma.questionnaire.findUnique({
    where: { vendorId: ctx.vendorId },
    select: { answers: true, submitted: true, submittedAt: true },
  });

  return NextResponse.json({
    answers: q?.answers ?? {},
    submitted: q?.submitted ?? false,
    submittedAt: q?.submittedAt ?? null,
  });
}

const patchSchema = z.object({
  answers: z.record(z.any()),
});

// PATCH /api/questionnaire — save a draft (merge answers). No-op once submitted.
export async function PATCH(req: NextRequest) {
  const ctx = await vendorContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  }

  // Drop any keys not in the config so answers can't be polluted.
  const valid = allFieldIds();
  const incoming = Object.fromEntries(
    Object.entries(parsed.data.answers).filter(([k]) => valid.has(k))
  );

  const existing = await prisma.questionnaire.findUnique({
    where: { vendorId: ctx.vendorId },
  });

  if (existing?.submitted) {
    return NextResponse.json(
      { error: "Questionnaire already submitted" },
      { status: 409 }
    );
  }

  const merged = {
    ...((existing?.answers as Record<string, unknown>) ?? {}),
    ...incoming,
  };

  await prisma.questionnaire.upsert({
    where: { vendorId: ctx.vendorId },
    update: { answers: merged },
    create: { vendorId: ctx.vendorId, answers: merged },
  });

  return NextResponse.json({ ok: true });
}

// POST /api/questionnaire — final submit. Validates required fields, then locks
// the questionnaire and moves the vendor to PENDING_REVIEW.
export async function POST() {
  const ctx = await vendorContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.questionnaire.findUnique({
    where: { vendorId: ctx.vendorId },
  });

  if (existing?.submitted) {
    return NextResponse.json(
      { error: "Questionnaire already submitted" },
      { status: 409 }
    );
  }

  const answers = (existing?.answers as Record<string, unknown>) ?? {};
  const missing = missingRequired(answers);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Please complete all required fields", missing },
      { status: 422 }
    );
  }

  // Lock questionnaire + advance vendor lifecycle atomically.
  await prisma.$transaction([
    prisma.questionnaire.update({
      where: { vendorId: ctx.vendorId },
      data: { submitted: true, submittedAt: new Date() },
    }),
    prisma.vendor.update({
      where: { id: ctx.vendorId },
      data: { status: "PENDING_REVIEW" },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
