import { PrismaClient, Role, RiskTier, VendorStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // Buyer / CISO account
  await prisma.user.upsert({
    where: { email: "ciso@acme.com" },
    update: {},
    create: {
      email: "ciso@acme.com",
      password: passwordHash,
      name: "Priya Sharma",
      role: Role.BUYER,
      company: "Acme Corp",
    },
  });

  const vendors = [
    { name: "CloudFlow Systems", domain: "cloudflow.io", category: "Cloud Infrastructure", riskTier: RiskTier.HIGH, aiExposure: 78, status: VendorStatus.PENDING_REVIEW },
    { name: "DataMint Analytics", domain: "datamint.com", category: "Data & Analytics", riskTier: RiskTier.MEDIUM, aiExposure: 45, status: VendorStatus.APPROVED },
    { name: "SecurePay Gateway", domain: "securepay.com", category: "Payments", riskTier: RiskTier.CRITICAL, aiExposure: 22, status: VendorStatus.QUESTIONNAIRE_SENT },
    { name: "InboxAI", domain: "inboxai.co", category: "AI / Productivity", riskTier: RiskTier.HIGH, aiExposure: 91, status: VendorStatus.NDA_SIGNED },
    { name: "LogiTrack", domain: "logitrack.net", category: "Logistics", riskTier: RiskTier.LOW, aiExposure: 12, status: VendorStatus.DISCOVERED },
  ];

  for (const v of vendors) {
    const existing = await prisma.vendor.findFirst({ where: { name: v.name } });
    if (existing) {
      console.log(`  vendor exists: ${v.name}`);
      continue;
    }
    const vendor = await prisma.vendor.create({ data: v });
    console.log(`  created vendor: ${vendor.name}`);
  }

  // Vendor-side login: a VENDOR user LINKED to a real Vendor record so the
  // vendor portal (onboarding, NDA, questionnaire) is testable end-to-end.
  // Linked to CloudFlow Systems, which is left in NDA-unsigned state.
  const cloudflow = await prisma.vendor.findFirst({
    where: { name: "CloudFlow Systems" },
  });
  if (cloudflow) {
    await prisma.user.upsert({
      where: { email: "vendor@cloudflow.io" },
      update: { vendorId: cloudflow.id },
      create: {
        email: "vendor@cloudflow.io",
        password: passwordHash,
        name: "Sam Rivera",
        role: Role.VENDOR,
        company: "CloudFlow Systems",
        vendorId: cloudflow.id,
      },
    });
    console.log("  created vendor user linked to CloudFlow Systems");
  }

  // ── Realistic demo data ──────────────────────────────────────────────
  // Populate three vendors with full NDA + questionnaire + AI summary in
  // distinct lifecycle states so the buyer dashboard and monitoring views look
  // real for a demo. Idempotent via upserts.
  const strongAnswers = {
    legal_name: "DataMint Analytics Inc",
    headquarters: "Boston, MA",
    employee_count: "201-1000",
    primary_contact: "security@datamint.com",
    mfa_enforced: "Yes",
    encryption_at_rest: "Yes",
    incident_response: "Yes",
    pentest_frequency: "Quarterly",
    security_notes: "Dedicated security team, annual SOC 2 audit.",
    uses_ai: "Yes",
    ai_vendors: "OpenAI, Anthropic",
    customer_data_in_ai: "Anonymized only",
    ai_governance: "Formal AI data-handling policy, PII stripped before inference.",
    certifications: "SOC 2 + ISO 27001",
    gdpr: "Yes",
    data_residency: "US + EU",
    confirm_accurate: true,
  };
  const weakAnswers = {
    legal_name: "SecurePay Gateway LLC",
    headquarters: "Remote",
    employee_count: "1-50",
    primary_contact: "admin@securepay.com",
    mfa_enforced: "No",
    encryption_at_rest: "No",
    incident_response: "No",
    pentest_frequency: "Never",
    security_notes: "",
    uses_ai: "Yes",
    ai_vendors: "OpenAI",
    customer_data_in_ai: "Yes",
    ai_governance: "",
    certifications: "None",
    gdpr: "No",
    data_residency: "US",
    confirm_accurate: true,
  };

  // CloudFlow: mid-tier posture — core controls present, but certification
  // evidence unverified and IR plan untested. Matches its HIGH tier + summary.
  const cloudflowAnswers = {
    legal_name: "CloudFlow Systems Inc",
    headquarters: "Austin, TX",
    employee_count: "51-200",
    primary_contact: "security@cloudflow.io",
    mfa_enforced: "Partial",
    encryption_at_rest: "Yes",
    incident_response: "Yes",
    pentest_frequency: "Annually",
    security_notes:
      "SOC 2 Type II audit in progress; report not yet issued. IR plan documented but not exercised in the last 12 months.",
    uses_ai: "Yes",
    ai_vendors: "OpenAI, AWS Bedrock",
    customer_data_in_ai: "Anonymized only",
    ai_governance:
      "AI usage policy drafted; PII stripped before inference, review process still being formalized.",
    certifications: "SOC 2",
    gdpr: "Yes",
    data_residency: "US",
    confirm_accurate: true,
  };

  async function enrich(
    name: string,
    opts: {
      status: VendorStatus;
      tier: RiskTier;
      answers: Record<string, unknown>;
      summary: string;
      topRisks: string[];
      gaps: string[];
      reviewed?: boolean;
      remediationNote?: string;
    }
  ) {
    const v = await prisma.vendor.findFirst({ where: { name } });
    if (!v) return;
    await prisma.nda.upsert({
      where: { vendorId: v.id },
      update: { accepted: true, acceptedAt: new Date(), acceptedBy: "demo" },
      create: { vendorId: v.id, accepted: true, acceptedAt: new Date(), acceptedBy: "demo" },
    });
    const answersJson = opts.answers as object;
    await prisma.questionnaire.upsert({
      where: { vendorId: v.id },
      update: { answers: answersJson, submitted: true, submittedAt: new Date() },
      create: { vendorId: v.id, answers: answersJson, submitted: true, submittedAt: new Date() },
    });
    await prisma.riskSummary.upsert({
      where: { vendorId: v.id },
      update: { summary: opts.summary, tier: opts.tier, topRisks: opts.topRisks, gaps: opts.gaps, source: "seed" },
      create: { vendorId: v.id, summary: opts.summary, tier: opts.tier, topRisks: opts.topRisks, gaps: opts.gaps, source: "seed" },
    });
    await prisma.vendor.update({
      where: { id: v.id },
      data: {
        status: opts.status,
        riskTier: opts.tier,
        ...(opts.reviewed ? { reviewedAt: new Date() } : {}),
        ...(opts.remediationNote ? { remediationNote: opts.remediationNote } : {}),
      },
    });
    console.log(`  enriched demo vendor: ${name} (${opts.status})`);
  }

  // 1) Approved + AI summary
  await enrich("DataMint Analytics", {
    status: VendorStatus.APPROVED,
    tier: RiskTier.LOW,
    answers: strongAnswers,
    summary:
      "DataMint Analytics demonstrates a mature security posture with enforced MFA, encryption at rest, quarterly penetration testing, and both SOC 2 and ISO 27001 certifications. Customer data is anonymized before AI processing under a formal governance policy. Residual risk is low.",
    topRisks: [
      "Reliance on multiple third-party AI providers introduces supply-chain exposure.",
      "EU data residency requires ongoing GDPR transfer monitoring.",
      "Scaling headcount may strain current security team coverage.",
    ],
    gaps: ["No material gaps identified; maintain certification cadence."],
    reviewed: true,
  });

  // 2) Pending review (CloudFlow already has a summary from the app; ensure state)
  await enrich("CloudFlow Systems", {
    status: VendorStatus.PENDING_REVIEW,
    tier: RiskTier.HIGH,
    answers: cloudflowAnswers,
    summary:
      "CloudFlow Systems has submitted its security questionnaire and is awaiting buyer review. Core controls are in place but certification evidence is pending verification.",
    topRisks: [
      "Certification claims not yet independently verified.",
      "Incident response plan not exercised in the last 12 months.",
      "Broad cloud infrastructure access surface.",
    ],
    gaps: ["Awaiting SOC 2 report upload.", "Pentest schedule to be confirmed."],
  });

  // 3) Remediation requested
  await enrich("SecurePay Gateway", {
    status: VendorStatus.REMEDIATION,
    tier: RiskTier.CRITICAL,
    answers: weakAnswers,
    summary:
      "SecurePay Gateway presents critical risk. MFA and encryption at rest are absent, there is no incident response plan, customer data is sent to AI models without anonymization, and the vendor holds no recognized certifications. Immediate remediation is required before approval.",
    topRisks: [
      "No MFA — high account-takeover risk on a payments vendor.",
      "Customer data sent to AI models unprotected — data leakage risk.",
      "No encryption at rest for sensitive payment data.",
    ],
    gaps: [
      "Enable MFA organization-wide.",
      "Encrypt data at rest.",
      "Establish an incident response plan.",
      "Obtain SOC 2 certification.",
    ],
    reviewed: true,
    remediationNote:
      "Enable MFA for all staff, encrypt data at rest, stop sending raw customer data to AI models, and provide a SOC 2 report before we can proceed.",
  });

  console.log("\nSeed complete.");
  console.log("Buyer login   ->  ciso@acme.com        /  password123");
  console.log("Vendor login  ->  vendor@cloudflow.io  /  password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
