import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { TransactionStatus } from "@/types/enums";

export const POST = requireAuth(async (_req: NextRequest, payload: JwtPayload) => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  await prisma.transaction.updateMany({
    where: {
      userId: payload.userId,
      type: "WALLET_FUND",
      status: TransactionStatus.PENDING,
      createdAt: { lt: thirtyMinutesAgo },
    },
    data: { status: TransactionStatus.CANCELLED, failedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
});
