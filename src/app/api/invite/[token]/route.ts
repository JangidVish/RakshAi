import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashInviteToken } from "@/lib/invite";

// GET /api/invite/[token] — public. Validate a raw invite token and return the
// vendor name + invited email so the acceptance form can prefill. Returns 410
// for expired/used tokens, 404 for unknown ones (no enumeration signal beyond
// existence, which is unavoidable for a redeem flow).
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const hash = hashInviteToken(params.token);
  const invite = await prisma.vendorInvite.findUnique({
    where: { token: hash },
    include: { vendor: { select: { name: true } } },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  }
  if (invite.usedAt) {
    return NextResponse.json(
      { error: "This invite has already been used" },
      { status: 410 }
    );
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "This invite has expired" },
      { status: 410 }
    );
  }

  return NextResponse.json({
    vendorName: invite.vendor.name,
    email: invite.email,
  });
}
