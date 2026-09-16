import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { generateRiskSummary } from "@/lib/risk-summary";

// Allow up to 60s for the model call.
export const maxDuration = 60;

// POST /api/risk-summary/[vendorId] — generate (or regenerate) the AI risk
// summary for a vendor from its submitted questionnaire (buyer only).
export async function POST(
  _req: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "BUYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: params.vendorId },
    include: { questionnaire: true },
  });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }
  if (!vendor.questionnaire?.submitted) {
    return NextResponse.json(
      { error: "Vendor has not submitted the questionnaire yet" },
      { status: 409 }
    );
  }

  const answers =
    (vendor.questionnaire.answers as Record<string, unknown>) ?? {};

  let generated;
  try {
    generated = await generateRiskSummary(vendor.name, answers);
  } catch (e) {
    console.error("[risk-summary] generation failed:", e);
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 502 }
    );
  }

  const { result, source } = generated;

  // Persist the summary and reflect the tier on the vendor record.
  await prisma.$transaction([
    prisma.riskSummary.upsert({
      where: { vendorId: vendor.id },
      update: {
        summary: result.summary,
        tier: result.tier,
        topRisks: result.topRisks,
        gaps: result.gaps,
        source,
      },
      create: {
        vendorId: vendor.id,
        summary: result.summary,
        tier: result.tier,
        topRisks: result.topRisks,
        gaps: result.gaps,
        source,
      },
    }),
    prisma.vendor.update({
      where: { id: vendor.id },
      data: { riskTier: result.tier },
    }),
  ]);

  return NextResponse.json({ ...result, source });
}
