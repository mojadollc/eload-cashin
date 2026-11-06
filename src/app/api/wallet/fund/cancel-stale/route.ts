import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { getCheckoutSession } from "@/providers/paymongo/paymongo.provider";
import { TransactionStatus } from "@/types/enums";

// Cancels all PENDING fund transactions with no valid checkout session ID.
// Runs on wallet page load to clean up stuck/abandoned transactions.
export const POST = requireAuth(async (_req: NextRequest, payload: JwtPayload) => {
  const pending = await prisma.transaction.findMany({
    where: {
      userId: payload.userId,
      type: "WALLET_FUND",
      status: TransactionStatus.PENDING,
    },
    include: { fundingTxn: true },
  });

  for (const txn of pending) {
    const sessionId = txn.fundingTxn?.paymongoLinkId;

    // No session or old link_* ID — cancel immediately, can never be resolved
    if (!sessionId || !sessionId.startsWith("cs_")) {
      await prisma.transaction.update({ where: { id: txn.id }, data: { status: TransactionStatus.CANCELLED, failedAt: new Date() } });
      continue;
    }

    // cs_* session older than 1 hour — check if expired
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (txn.createdAt < oneHourAgo) {
      try {
        const session = await getCheckoutSession(sessionId);
        const status: string = session.attributes?.status || "";
        if (status === "expired") {
          await prisma.transaction.update({ where: { id: txn.id }, data: { status: TransactionStatus.CANCELLED, failedAt: new Date() } });
        }
      } catch {
        // PayMongo unreachable — skip
      }
    }
  }

  return NextResponse.json({ ok: true });
});
