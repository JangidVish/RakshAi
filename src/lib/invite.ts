import { randomBytes, createHash } from "crypto";

// Invite tokens follow password-reset discipline: the RAW token only ever
// travels in the emailed link; the DATABASE stores its SHA-256 hash. A leaked
// DB therefore yields no usable invites.

export const INVITE_TTL_DAYS = 7;

/** Generate a raw token (for the link) and its hash (for the DB). */
export function generateInviteToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashInviteToken(raw) };
}

/** Hash a raw token for storage / lookup. */
export function hashInviteToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Build the acceptance link for an emailed invite. */
export function inviteUrl(rawToken: string): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/vendor/accept?token=${rawToken}`;
}
