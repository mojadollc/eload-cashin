import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

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

  const telcoProducts = [
    // Globe
    { network: "Globe", productCode: "GLOBE_10", name: "Globe ₱10 Regular Load", amount: 10, description: "Regular load valid 1 day" },
    { network: "Globe", productCode: "GLOBE_20", name: "Globe ₱20 Regular Load", amount: 20, description: "Regular load valid 2 days" },
    { network: "Globe", productCode: "GLOBE_50", name: "Globe ₱50 Regular Load", amount: 50, description: "Regular load valid 5 days" },
    { network: "Globe", productCode: "GLOBE_100", name: "Globe ₱100 Regular Load", amount: 100, description: "Regular load valid 10 days" },
    { network: "Globe", productCode: "GLOBE_300", name: "Globe ₱300 Regular Load", amount: 300, description: "Regular load valid 30 days" },
    { network: "Globe", productCode: "GLOBE_500", name: "Globe ₱500 Regular Load", amount: 500, description: "Regular load valid 60 days" },
    { network: "Globe", productCode: "GLOBE_1000", name: "Globe ₱1000 Regular Load", amount: 1000, description: "Regular load valid 120 days" },
    { network: "Globe", productCode: "GLOBE_GO50", name: "GoSURF50", amount: 50, description: "1GB data + unli texts valid 3 days" },
    { network: "Globe", productCode: "GLOBE_GO99", name: "GoSURF99", amount: 99, description: "2GB data + unli texts valid 7 days" },
    { network: "Globe", productCode: "GLOBE_GO149", name: "GoSURF149", amount: 149, description: "3GB data + unli texts valid 15 days" },
    { network: "Globe", productCode: "GLOBE_GO299", name: "GoSURF299", amount: 299, description: "8GB data + unli texts valid 30 days" },
    { network: "Globe", productCode: "GLOBE_GOUNLI30", name: "GoUNLI30", amount: 30, description: "Unli calls & texts to Globe/TM valid 1 day" },
    { network: "Globe", productCode: "GLOBE_GOUNLI99", name: "GoUNLI99", amount: 99, description: "Unli calls & texts to Globe/TM valid 7 days" },
    // TM
    { network: "TM", productCode: "TM_10", name: "TM ₱10 Regular Load", amount: 10, description: "Regular load valid 1 day" },
    { network: "TM", productCode: "TM_20", name: "TM ₱20 Regular Load", amount: 20, description: "Regular load valid 2 days" },
    { network: "TM", productCode: "TM_50", name: "TM ₱50 Regular Load", amount: 50, description: "Regular load valid 5 days" },
    { network: "TM", productCode: "TM_100", name: "TM ₱100 Regular Load", amount: 100, description: "Regular load valid 10 days" },
    { network: "TM", productCode: "TM_300", name: "TM ₱300 Regular Load", amount: 300, description: "Regular load valid 30 days" },
    { network: "TM", productCode: "TM_500", name: "TM ₱500 Regular Load", amount: 500, description: "Regular load valid 60 days" },
    { network: "TM", productCode: "TM_1000", name: "TM ₱1000 Regular Load", amount: 1000, description: "Regular load valid 120 days" },
    { network: "TM", productCode: "TM_GOUNLI30", name: "TM GoUNLI30", amount: 30, description: "Unli calls & texts to Globe/TM valid 1 day" },
    { network: "TM", productCode: "TM_SURF50", name: "TM GoSURF50", amount: 50, description: "1GB data valid 3 days" },
    { network: "TM", productCode: "TM_SURF99", name: "TM GoSURF99", amount: 99, description: "2GB data valid 7 days" },
    // Smart
    { network: "Smart", productCode: "SMART_10", name: "Smart ₱10 Regular Load", amount: 10, description: "Regular load valid 1 day" },
    { network: "Smart", productCode: "SMART_20", name: "Smart ₱20 Regular Load", amount: 20, description: "Regular load valid 2 days" },
    { network: "Smart", productCode: "SMART_50", name: "Smart ₱50 Regular Load", amount: 50, description: "Regular load valid 5 days" },
    { network: "Smart", productCode: "SMART_100", name: "Smart ₱100 Regular Load", amount: 100, description: "Regular load valid 10 days" },
    { network: "Smart", productCode: "SMART_300", name: "Smart ₱300 Regular Load", amount: 300, description: "Regular load valid 30 days" },
    { network: "Smart", productCode: "SMART_500", name: "Smart ₱500 Regular Load", amount: 500, description: "Regular load valid 60 days" },
    { network: "Smart", productCode: "SMART_1000", name: "Smart ₱1000 Regular Load", amount: 1000, description: "Regular load valid 120 days" },
    { network: "Smart", productCode: "SMART_GIGA50", name: "Smart GigaSurf50", amount: 50, description: "1GB data + 1GB for Giga Games valid 3 days" },
    { network: "Smart", productCode: "SMART_GIGA99", name: "Smart GigaSurf99", amount: 99, description: "2.5GB data + 1GB for Giga Games valid 7 days" },
    { network: "Smart", productCode: "SMART_GIGA299", name: "Smart GigaSurf299", amount: 299, description: "10GB data + 2GB for Giga Games valid 30 days" },
    { network: "Smart", productCode: "SMART_UNLI30", name: "Smart UnliCall30", amount: 30, description: "Unli calls & texts to Smart/TNT valid 1 day" },
    { network: "Smart", productCode: "SMART_UNLI99", name: "Smart UnliCall99", amount: 99, description: "Unli calls & texts to Smart/TNT valid 7 days" },
    // TNT
    { network: "TNT", productCode: "TNT_10", name: "TNT ₱10 Regular Load", amount: 10, description: "Regular load valid 1 day" },
    { network: "TNT", productCode: "TNT_20", name: "TNT ₱20 Regular Load", amount: 20, description: "Regular load valid 2 days" },
    { network: "TNT", productCode: "TNT_50", name: "TNT ₱50 Regular Load", amount: 50, description: "Regular load valid 5 days" },
    { network: "TNT", productCode: "TNT_100", name: "TNT ₱100 Regular Load", amount: 100, description: "Regular load valid 10 days" },
    { network: "TNT", productCode: "TNT_300", name: "TNT ₱300 Regular Load", amount: 300, description: "Regular load valid 30 days" },
    { network: "TNT", productCode: "TNT_500", name: "TNT ₱500 Regular Load", amount: 500, description: "Regular load valid 60 days" },
    { network: "TNT", productCode: "TNT_1000", name: "TNT ₱1000 Regular Load", amount: 1000, description: "Regular load valid 120 days" },
    { network: "TNT", productCode: "TNT_GIGA50", name: "TNT GigaSurf50", amount: 50, description: "1GB data valid 3 days" },
    { network: "TNT", productCode: "TNT_GIGA99", name: "TNT GigaSurf99", amount: 99, description: "2.5GB data valid 7 days" },
    { network: "TNT", productCode: "TNT_UNLI30", name: "TNT UnliCall30", amount: 30, description: "Unli calls & texts to Smart/TNT valid 1 day" },
    // Sun
    { network: "Sun", productCode: "SUN_10", name: "Sun ₱10 Regular Load", amount: 10, description: "Regular load valid 1 day" },
    { network: "Sun", productCode: "SUN_20", name: "Sun ₱20 Regular Load", amount: 20, description: "Regular load valid 2 days" },
    { network: "Sun", productCode: "SUN_50", name: "Sun ₱50 Regular Load", amount: 50, description: "Regular load valid 5 days" },
    { network: "Sun", productCode: "SUN_100", name: "Sun ₱100 Regular Load", amount: 100, description: "Regular load valid 10 days" },
    { network: "Sun", productCode: "SUN_300", name: "Sun ₱300 Regular Load", amount: 300, description: "Regular load valid 30 days" },
    { network: "Sun", productCode: "SUN_500", name: "Sun ₱500 Regular Load", amount: 500, description: "Regular load valid 60 days" },
    { network: "Sun", productCode: "SUN_1000", name: "Sun ₱1000 Regular Load", amount: 1000, description: "Regular load valid 120 days" },
    { network: "Sun", productCode: "SUN_UNLI30", name: "Sun UnliCall30", amount: 30, description: "Unli calls & texts to Sun/Smart valid 1 day" },
    { network: "Sun", productCode: "SUN_SURF50", name: "Sun Surf50", amount: 50, description: "1GB data valid 3 days" },
    // DITO
    { network: "DITO", productCode: "DITO_10", name: "DITO ₱10 Regular Load", amount: 10, description: "Regular load valid 1 day" },
    { network: "DITO", productCode: "DITO_20", name: "DITO ₱20 Regular Load", amount: 20, description: "Regular load valid 2 days" },
    { network: "DITO", productCode: "DITO_50", name: "DITO ₱50 Regular Load", amount: 50, description: "Regular load valid 5 days" },
    { network: "DITO", productCode: "DITO_100", name: "DITO ₱100 Regular Load", amount: 100, description: "Regular load valid 10 days" },
    { network: "DITO", productCode: "DITO_300", name: "DITO ₱300 Regular Load", amount: 300, description: "Regular load valid 30 days" },
    { network: "DITO", productCode: "DITO_500", name: "DITO ₱500 Regular Load", amount: 500, description: "Regular load valid 60 days" },
    { network: "DITO", productCode: "DITO_1000", name: "DITO ₱1000 Regular Load", amount: 1000, description: "Regular load valid 120 days" },
    { network: "DITO", productCode: "DITO_DATA99", name: "DITO Unli Data 99", amount: 99, description: "Unli data valid 7 days" },
    { network: "DITO", productCode: "DITO_DATA199", name: "DITO Unli Data 199", amount: 199, description: "Unli data valid 15 days" },
    { network: "DITO", productCode: "DITO_DATA299", name: "DITO Unli Data 299", amount: 299, description: "Unli data valid 30 days" },
    { network: "DITO", productCode: "DITO_UNLI30", name: "DITO UnliCall30", amount: 30, description: "Unli calls & texts to DITO valid 1 day" },
  ];

  const gameProducts = [
    { network: "Mobile Legends", productCode: "MLBB_86", name: "Mobile Legends 86 Diamonds", amount: 100, description: "86 Diamonds" },
    { network: "Mobile Legends", productCode: "MLBB_172", name: "Mobile Legends 172 Diamonds", amount: 200, description: "172 Diamonds" },
    { network: "Mobile Legends", productCode: "MLBB_257", name: "Mobile Legends 257 Diamonds", amount: 300, description: "257 Diamonds" },
    { network: "Mobile Legends", productCode: "MLBB_514", name: "Mobile Legends 514 Diamonds", amount: 600, description: "514 Diamonds" },
    { network: "Mobile Legends", productCode: "MLBB_706", name: "Mobile Legends 706 Diamonds", amount: 800, description: "706 Diamonds" },
    { network: "Mobile Legends", productCode: "MLBB_1412", name: "Mobile Legends 1412 Diamonds", amount: 1600, description: "1412 Diamonds" },
    { network: "Ragnarok", productCode: "RO_100", name: "Ragnarok 100 Kafra Points", amount: 100, description: "100 Kafra Points" },
    { network: "Ragnarok", productCode: "RO_500", name: "Ragnarok 500 Kafra Points", amount: 500, description: "500 Kafra Points" },
    { network: "Ragnarok", productCode: "RO_1000", name: "Ragnarok 1000 Kafra Points", amount: 1000, description: "1000 Kafra Points" },
    { network: "Clash of Clans", productCode: "COC_80", name: "Clash of Clans 80 Gems", amount: 100, description: "80 Gems" },
    { network: "Clash of Clans", productCode: "COC_500", name: "Clash of Clans 500 Gems", amount: 500, description: "500 Gems" },
    { network: "Clash of Clans", productCode: "COC_1200", name: "Clash of Clans 1200 Gems", amount: 1000, description: "1200 Gems" },
    { network: "PUBG Mobile", productCode: "PUBG_60", name: "PUBG Mobile 60 UC", amount: 100, description: "60 UC" },
    { network: "PUBG Mobile", productCode: "PUBG_325", name: "PUBG Mobile 325 UC", amount: 500, description: "325 UC" },
    { network: "PUBG Mobile", productCode: "PUBG_660", name: "PUBG Mobile 660 UC", amount: 1000, description: "660 UC" },
    { network: "Free Fire", productCode: "FF_100", name: "Free Fire 100 Diamonds", amount: 100, description: "100 Diamonds" },
    { network: "Free Fire", productCode: "FF_310", name: "Free Fire 310 Diamonds", amount: 300, description: "310 Diamonds" },
    { network: "Free Fire", productCode: "FF_520", name: "Free Fire 520 Diamonds", amount: 500, description: "520 Diamonds" },
    { network: "Free Fire", productCode: "FF_1060", name: "Free Fire 1060 Diamonds", amount: 1000, description: "1060 Diamonds" },
  ];

  await prisma.eloadProduct.createMany({
    data: [
      ...telcoProducts.map(p => ({ ...p, category: "Telco", provider: "GBITS" })),
      ...gameProducts.map(p => ({ ...p, category: "Games", provider: "GBITS" })),
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
