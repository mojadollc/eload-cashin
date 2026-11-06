import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { TransactionStatus } from "@/types/enums";

// Returns the most recent PENDING wallet fund transaction, if any.
// Used by dashboard to show a "payment in progress" banner.
export const GET = requireAuth(async (_req: NextRequest, payload: JwtPayload) => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const txn = await prisma.transaction.findFirst({
    where: {
      userId: payload.userId,
      type: "WALLET_FUND",
      status: TransactionStatus.PENDING,
      createdAt: { gt: twoHoursAgo },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!txn) return NextResponse.json({ transactionNumber: null });

  return NextResponse.json({
    transactionNumber: txn.transactionNumber,
    amount: Number(txn.grossAmount),
  });
});
