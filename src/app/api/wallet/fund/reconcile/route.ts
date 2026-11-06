import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { getCheckoutSession } from "@/providers/paymongo/paymongo.provider";
import { TransactionStatus } from "@/types/enums";

// Reconcile only marks expired sessions — crediting is done exclusively by the webhook.
export const POST = requireAuth(async (_req: NextRequest, payload: JwtPayload) => {
  const pending = await prisma.transaction.findMany({
    where: { userId: payload.userId, type: "WALLET_FUND", status: TransactionStatus.PENDING },
    include: { fundingTxn: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  for (const txn of pending) {
    const sessionId = txn.fundingTxn?.paymongoLinkId;
    if (!sessionId) continue;

    try {
      const session = await getCheckoutSession(sessionId);
      const status: string = session.attributes?.status || "";

      if (status === "expired") {
        await prisma.transaction.update({
          where: { id: txn.id },
          data: { status: TransactionStatus.CANCELLED, failedAt: new Date() },
        });
      }
      // "succeeded" is handled by webhook — skip here to avoid double-credit
    } catch {
      // PayMongo API error — skip
    }
  }

  return NextResponse.json({ ok: true });
});
