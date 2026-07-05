import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Validation schema for creating a vendor
const createVendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  domain: z.string().optional(),
  category: z.string().optional(),
  riskTier: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  aiExposure: z.number().int().min(0).max(100).optional(),
});

// GET /api/vendors — list all vendors (buyer only)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "BUYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendors = await prisma.vendor.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      nda: { select: { accepted: true } },
      questionnaire: { select: { submitted: true } },
    },
  });

  return NextResponse.json({ vendors });
}

// POST /api/vendors — create a vendor (buyer only)
export async function POST(req: NextRequest) {
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

  const parsed = createVendorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const vendor = await prisma.vendor.create({ data: parsed.data });
  return NextResponse.json({ vendor }, { status: 201 });
}
