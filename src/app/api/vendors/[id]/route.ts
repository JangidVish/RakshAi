import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  domain: z.string().optional(),
  category: z.string().optional(),
  riskTier: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  aiExposure: z.number().int().min(0).max(100).optional(),
  status: z
    .enum([
      "DISCOVERED",
      "INVITED",
      "NDA_SIGNED",
      "QUESTIONNAIRE_SENT",
      "PENDING_REVIEW",
      "APPROVED",
      "REMEDIATION",
      "OFFBOARDED",
    ])
    .optional(),
});

// GET /api/vendors/[id] — vendor detail
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Object-level authorization: BUYER sees any vendor (owns the inventory);
  // a VENDOR may only read its own linked record. Anyone else is scoped out.
  if (
    session.user.role !== "BUYER" &&
    session.user.vendorId !== params.id
  ) {
    // Return 404 rather than 403 so vendor IDs can't be enumerated.
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: { nda: true, questionnaire: true, riskSummary: true },
  });

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  return NextResponse.json({ vendor });
}

// PATCH /api/vendors/[id] — update vendor (buyer only)
export async function PATCH(
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

  const parsed = updateVendorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.vendor.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const vendor = await prisma.vendor.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ vendor });
}
