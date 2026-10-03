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

  // Telco networks
  const telcoNetworks = [
    { network: "Globe", category: "Telco" },
    { network: "Smart", category: "Telco" },
    { network: "DITO", category: "Telco" },
    { network: "TM", category: "Telco" },
    { network: "TNT", category: "Telco" },
    { network: "Sun", category: "Telco" },
  ];
  const telcoAmounts = [10, 20, 50, 100, 300, 500, 1000];

  // Game pins
  const gameProducts = [
    { network: "Mobile Legends", category: "Games", productCode: "MLBB_86", name: "Mobile Legends 86 Diamonds", amount: 100, description: "86 Diamonds" },
    { network: "Mobile Legends", category: "Games", productCode: "MLBB_172", name: "Mobile Legends 172 Diamonds", amount: 200, description: "172 Diamonds" },
    { network: "Mobile Legends", category: "Games", productCode: "MLBB_257", name: "Mobile Legends 257 Diamonds", amount: 300, description: "257 Diamonds" },
    { network: "Mobile Legends", category: "Games", productCode: "MLBB_706", name: "Mobile Legends 706 Diamonds", amount: 800, description: "706 Diamonds" },
    { network: "Ragnarok", category: "Games", productCode: "RO_100", name: "Ragnarok 100 Kafra Points", amount: 100, description: "100 Kafra Points" },
    { network: "Ragnarok", category: "Games", productCode: "RO_500", name: "Ragnarok 500 Kafra Points", amount: 500, description: "500 Kafra Points" },
    { network: "Clash of Clans", category: "Games", productCode: "COC_80", name: "Clash of Clans 80 Gems", amount: 100, description: "80 Gems" },
    { network: "Clash of Clans", category: "Games", productCode: "COC_500", name: "Clash of Clans 500 Gems", amount: 500, description: "500 Gems" },
    { network: "PUBG Mobile", category: "Games", productCode: "PUBG_60", name: "PUBG Mobile 60 UC", amount: 100, description: "60 UC" },
    { network: "PUBG Mobile", category: "Games", productCode: "PUBG_325", name: "PUBG Mobile 325 UC", amount: 500, description: "325 UC" },
    { network: "Free Fire", category: "Games", productCode: "FF_100", name: "Free Fire 100 Diamonds", amount: 100, description: "100 Diamonds" },
    { network: "Free Fire", category: "Games", productCode: "FF_520", name: "Free Fire 520 Diamonds", amount: 500, description: "520 Diamonds" },
  ];

  await prisma.eloadProduct.createMany({
    data: [
      ...telcoNetworks.flatMap(({ network, category }) =>
        telcoAmounts.map(amount => ({
          network,
          category,
          productCode: `${network.toUpperCase()}_${amount}`,
          name: `${network} ₱${amount} Regular Load`,
          amount,
        }))
      ),
      ...gameProducts,
    ],
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
