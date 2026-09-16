import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { hashInviteToken } from "@/lib/invite";

// Constant-time string compare that never short-circuits on length.
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still burn a compare against a same-length buffer to avoid timing leak.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

// Cap registration attempts per IP to blunt account enumeration + spam.
const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["BUYER", "VENDOR"]),
  company: z.string().optional(),
  inviteCode: z.string().optional(), // buyer gate
  inviteToken: z.string().optional(), // vendor invite link token
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limit = rateLimit(`register:${ip}`, REGISTER_LIMIT, REGISTER_WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, password, role, company, inviteCode, inviteToken } =
    parsed.data;

  // Buyer accounts are privileged (full vendor inventory access), so they are
  // gated behind a server-side invite code. Vendors may self-register freely —
  // their account carries no data access until a buyer links it.
  if (role === "BUYER") {
    const expected = process.env.BUYER_INVITE_CODE;
    if (!expected) {
      // Fail closed: refuse buyer signups rather than allow them unguarded.
      return NextResponse.json(
        { error: "Buyer registration is not available." },
        { status: 403 }
      );
    }
    if (!inviteCode || !safeEqual(inviteCode, expected)) {
      return NextResponse.json(
        { error: "A valid invite code is required to create a buyer account." },
        { status: 403 }
      );
    }
  }

  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  // A vendor may arrive via an invite link. If so, validate the token and link
  // the new account to that Vendor record. Validation happens before the write
  // so we never create an orphan account against a bad token.
  let linkedVendorId: string | null = null;
  if (role === "VENDOR" && inviteToken) {
    const invite = await prisma.vendorInvite.findUnique({
      where: { token: hashInviteToken(inviteToken) },
    });
    if (!invite || invite.usedAt || invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "This invite link is invalid or has expired." },
        { status: 410 }
      );
    }
    linkedVendorId = invite.vendorId;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Create the user and burn the invite atomically so a token can't be redeemed
  // twice via a race.
  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: passwordHash,
        role,
        company,
        ...(linkedVendorId ? { vendorId: linkedVendorId } : {}),
      },
    });
    if (role === "VENDOR" && inviteToken && linkedVendorId) {
      await tx.vendorInvite.update({
        where: { token: hashInviteToken(inviteToken) },
        data: { usedAt: new Date() },
      });
    }
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
