// Mailer with a dev fallback. If RESEND_API_KEY is configured we send a real
// email; otherwise we log the message (and any link) to the server console so
// the full flow is testable locally with zero external setup.

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  /** Optional plain link surfaced in the dev-console fallback for easy copy. */
  devLink?: string;
};

export async function sendMail({
  to,
  subject,
  html,
  devLink,
}: SendArgs): Promise<{ delivered: "resend" | "console" }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "RakshAI <onboarding@resend.dev>";

  if (apiKey) {
    // Import lazily so the dependency is only touched when actually sending.
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({ from, to, subject, html });
    return { delivered: "resend" };
  }

  // Dev fallback.
  console.log("\n────────────── [DEV EMAIL] ──────────────");
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  if (devLink) console.log(`Link:    ${devLink}`);
  console.log("──────────────────────────────────────────\n");
  return { delivered: "console" };
}
