import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";

export const GET = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));

  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: payload.userId } });

  const where: any = {
    walletId: wallet.id,
    ...(type ? { entryType: type } : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.walletLedger.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.walletLedger.count({ where }),
  ]);

  return NextResponse.json({ entries, total, page, pages: Math.ceil(total / limit), limit });
});
