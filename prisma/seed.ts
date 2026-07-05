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

  console.log("\nSeed complete.");
  console.log("Buyer login  ->  ciso@acme.com  /  password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
