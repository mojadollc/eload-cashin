import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";

export const GET = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  const { searchParams } = new URL(req.url);
  const network = searchParams.get("network");

  const products = await prisma.eloadProduct.findMany({
    where: { isActive: true, ...(network ? { network } : {}) },
    orderBy: [{ network: "asc" }, { amount: "asc" }],
  });

  const grouped = products.reduce((acc: Record<string, typeof products>, p) => {
    if (!acc[p.network]) acc[p.network] = [];
    acc[p.network].push(p);
    return acc;
  }, {});

  return NextResponse.json(grouped);
});
