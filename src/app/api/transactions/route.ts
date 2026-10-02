import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";

export const GET = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || undefined;
  const status = searchParams.get("status") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const transactions = await prisma.transaction.findMany({
    where: { userId: payload.userId, ...(type ? { type: type as any } : {}), ...(status ? { status: status as any } : {}) },
    include: { eloadTxn: true, cashoutTxn: true, fundingTxn: true },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.transaction.count({ where: { userId: payload.userId } });

  return NextResponse.json({ transactions, total, page, pages: Math.ceil(total / limit) });
});
