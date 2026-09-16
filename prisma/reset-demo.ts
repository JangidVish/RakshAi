import { PrismaClient, VendorStatus, RiskTier } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Remove the throwaway account created while testing the invite flow.
  const del = await prisma.user.deleteMany({
    where: { email: "security@logitrack.net" },
  });
  console.log(`removed test users: ${del.count}`);

  const logi = await prisma.vendor.findFirst({ where: { name: "LogiTrack" } });
  if (logi) {
    await prisma.vendorInvite.deleteMany({ where: { vendorId: logi.id } });
    await prisma.nda.deleteMany({ where: { vendorId: logi.id } });
    await prisma.questionnaire.deleteMany({ where: { vendorId: logi.id } });
    await prisma.riskSummary.deleteMany({ where: { vendorId: logi.id } });
    await prisma.vendor.update({
      where: { id: logi.id },
      data: {
        status: VendorStatus.DISCOVERED,
        riskTier: RiskTier.LOW,
        reviewedAt: null,
        remediationNote: null,
      },
    });
    console.log("LogiTrack reset to DISCOVERED (not yet engaged)");
  }

  // CloudFlow is the vendor reviewed live on stage: put it back to awaiting review.
  const cf = await prisma.vendor.findFirst({ where: { name: "CloudFlow Systems" } });
  if (cf) {
    await prisma.vendor.update({
      where: { id: cf.id },
      data: {
        status: VendorStatus.PENDING_REVIEW,
        riskTier: RiskTier.HIGH,
        reviewedAt: null,
        remediationNote: null,
      },
    });
    console.log("CloudFlow Systems reset to PENDING_REVIEW");
  }
}

main().finally(() => prisma.$disconnect());
