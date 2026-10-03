import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { getProducts } from "@/providers/gbits/gbits.provider";

export const GET = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const network = searchParams.get("network");

  // Try to sync live products from GbitsAPI
  try {
    const liveProducts = await getProducts();
    if (liveProducts.length > 0) {
      for (const p of liveProducts) {
        await prisma.eloadProduct.upsert({
          where: { provider_productCode: { provider: "GBITS", productCode: p.productCode } },
          update: { name: p.name, amount: p.amount, isActive: true },
          create: { provider: "GBITS", category: "Telco", network: p.network, productCode: p.productCode, name: p.name, amount: p.amount },
        });
      }
    }
  } catch {
    // GbitsAPI unavailable - use DB products
  }

  const products = await prisma.eloadProduct.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
      ...(network ? { network } : {}),
    },
    orderBy: [{ category: "asc" }, { network: "asc" }, { amount: "asc" }],
  });

  // Group by category → network
  const grouped = products.reduce((acc: Record<string, Record<string, typeof products>>, p) => {
    if (!acc[p.category]) acc[p.category] = {};
    if (!acc[p.category][p.network]) acc[p.category][p.network] = [];
    acc[p.category][p.network].push(p);
    return acc;
  }, {});

  return NextResponse.json(grouped);
});
