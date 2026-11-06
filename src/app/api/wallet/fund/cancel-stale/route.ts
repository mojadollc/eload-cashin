import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { getCheckoutSession } from "@/providers/paymongo/paymongo.provider";
import { TransactionStatus } from "@/types/enums";

// Cancels PENDING fund transactions older than 1 hour whose checkout session has expired.
export const POST = requireAuth(async (_req: NextRequest, payload: JwtPayload) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const pending = await prisma.transaction.findMany({
    where: {
      userId: payload.userId,
      type: "WALLET_FUND",
      status: TransactionStatus.PENDING,
      createdAt: { lt: oneHourAgo },
    },
    include: { fundingTxn: true },
  });

  for (const txn of pending) {
    const sessionId = txn.fundingTxn?.paymongoLinkId;

    // No session ID or old payment link ID (link_*) — cancel immediately
    if (!sessionId || !sessionId.startsWith("cs_")) {
      await prisma.transaction.update({ where: { id: txn.id }, data: { status: TransactionStatus.CANCELLED, failedAt: new Date() } });
      continue;
    }

    try {
      const session = await getCheckoutSession(sessionId);
      const status: string = session.attributes?.status || "";
      if (status === "expired") {
        await prisma.transaction.update({ where: { id: txn.id }, data: { status: TransactionStatus.CANCELLED, failedAt: new Date() } });
      }
      // "succeeded" is handled by webhook — never credit here
    } catch {
      // PayMongo API error — skip
    }
  }

  return NextResponse.json({ ok: true });
});
