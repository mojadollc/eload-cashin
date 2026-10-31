import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";

export const GET = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));

  const wallet = await prisma.wallet.findUnique({ where: { userId: payload.userId } });
  if (!wallet) return fail("Wallet not found", 404);

  const [entries, total] = await Promise.all([
    prisma.walletLedger.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.walletLedger.count({ where: { walletId: wallet.id } }),
  ]);

  return ok({
    entries: entries.map((e) => ({ ...e, amount: e.amount.toString(), balanceAfter: e.balanceAfter.toString() })),
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  });
});
