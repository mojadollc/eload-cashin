import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.feeRule.deleteMany();
  await prisma.feeRule.createMany({
    data: [
      { service: "WALLET_FUND", feeType: "FIXED", amount: 15 },
      { service: "ELOAD", feeType: "FIXED", amount: 2 },
      { service: "CASHOUT", feeType: "FIXED", amount: 15 },
    ] as any[],
  });

  await prisma.eloadProduct.deleteMany();
  const networks = ["Globe", "Smart", "DITO", "TM", "TNT", "Sun"];
  const amounts = [10, 20, 50, 100, 300, 500, 1000];
  await prisma.eloadProduct.createMany({
    data: networks.flatMap(network =>
      amounts.map(amount => ({
        network,
        productCode: `${network.toUpperCase()}_${amount}`,
        name: `${network} ₱${amount} Regular Load`,
        amount,
      }))
    ),
  });

  const existing = await prisma.user.findUnique({ where: { mobile: "09000000000" } });
  if (!existing) {
    const admin = await prisma.user.create({
      data: {
        userId: "USR-0000001",
        firstName: "Super",
        lastName: "Admin",
        mobile: "09000000000",
        email: "admin@cashintap.com",
        passwordHash: await bcrypt.hash("Admin@1234", 12),
        role: "SUPER_ADMIN" as any,
        status: "ACTIVE" as any,
        mobileVerified: true,
        emailVerified: true,
        referralCode: "ADMIN001",
      },
    });
    await prisma.wallet.create({
      data: { walletId: "WAL-0000001", accountNumber: "8800000001", userId: admin.id },
    });
  }

  console.log("✅ Seed complete");
}

main().catch(console.error).finally(() => prisma.$disconnect());
