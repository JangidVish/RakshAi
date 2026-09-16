import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  generateInviteToken,
  inviteUrl,
  INVITE_TTL_DAYS,
} from "@/lib/invite";
import { sendMail } from "@/lib/mailer";

const bodySchema = z.object({ email: z.string().email("Valid email required") });

const INVITE_LIMIT = 20;
const INVITE_WINDOW_MS = 10 * 60 * 1000;

// POST /api/vendors/[id]/invite — create a single-use invite for a vendor and
// email the acceptance link (buyer only).
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "BUYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = clientIp(req.headers);
  const limit = rateLimit(`invite:${ip}`, INVITE_LIMIT, INVITE_WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many invites. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: params.id } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const email = parsed.data.email.toLowerCase();
  const { raw, hash } = generateInviteToken();
  const expiresAt = new Date(
    Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  await prisma.vendorInvite.create({
    data: { token: hash, vendorId: vendor.id, email, expiresAt },
  });

  // Advance lifecycle to INVITED (don't regress an already-engaged vendor).
  if (vendor.status === "DISCOVERED") {
    await prisma.vendor.update({
      where: { id: vendor.id },
      data: { status: "INVITED" },
    });
  }

  const link = inviteUrl(raw);
  const { delivered } = await sendMail({
    to: email,
    subject: `You're invited to complete ${vendor.name}'s security assessment`,
    html: `<p>Hello,</p><p>${vendor.name} has been invited to a RakshAI security assessment. Click below to get started — this link expires in ${INVITE_TTL_DAYS} days.</p><p><a href="${link}">Accept invitation</a></p>`,
    devLink: link,
  });

  return NextResponse.json({
    ok: true,
    expiresAt,
    delivered,
    // Surface the link in the response only in dev-console mode so the flow is
    // testable without an inbox. Never leak it once real email is configured.
    ...(delivered === "console" ? { devLink: link } : {}),
  });
}
