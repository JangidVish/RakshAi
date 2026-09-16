import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// POST /api/nda/accept — record NDA acceptance for the calling vendor.
// Idempotency: a second accept is rejected with 409 so the timestamp is never
// overwritten.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    session.user.role !== "VENDOR" ||
    !session.user.vendorId
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendorId = session.user.vendorId;

  const existing = await prisma.nda.findUnique({ where: { vendorId } });
  if (existing?.accepted) {
    return NextResponse.json(
      { error: "NDA already accepted" },
      { status: 409 }
    );
  }

  const acceptedBy = session.user.email ?? "unknown";
  const now = new Date();

  // Write the NDA record and advance lifecycle atomically. Don't regress a
  // vendor already past the NDA stage.
  await prisma.$transaction(async (tx) => {
    await tx.nda.upsert({
      where: { vendorId },
      update: { accepted: true, acceptedAt: now, acceptedBy },
      create: { vendorId, accepted: true, acceptedAt: now, acceptedBy },
    });
    const vendor = await tx.vendor.findUnique({ where: { id: vendorId } });
    if (vendor && (vendor.status === "INVITED" || vendor.status === "DISCOVERED")) {
      await tx.vendor.update({
        where: { id: vendorId },
        data: { status: "NDA_SIGNED" },
      });
    }
  });

  return NextResponse.json({ ok: true, acceptedAt: now });
}
