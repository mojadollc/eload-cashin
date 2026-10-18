import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { getPaymentLink } from "@/providers/paymongo/paymongo.provider";
import { TransactionStatus } from "@/types/enums";

export const POST = requireAuth(async (_req: NextRequest, payload: JwtPayload) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const pending = await prisma.transaction.findMany({
    where: {
      userId: payload.userId,
      type: "WALLET_FUND",
      status: TransactionStatus.PENDING,
      createdAt: { lt: oneDayAgo },
    },
    include: { fundingTxn: true },
  });

  for (const txn of pending) {
    const linkId = txn.fundingTxn?.paymongoLinkId;
    if (!linkId) {
      await prisma.transaction.update({
        where: { id: txn.id },
        data: { status: TransactionStatus.CANCELLED, failedAt: new Date() },
      });
      continue;
    }

    try {
      const link = await getPaymentLink(linkId);
      const status = link.attributes?.status;

      if (status === "archived") {
        await prisma.transaction.update({
          where: { id: txn.id },
          data: { status: TransactionStatus.CANCELLED, failedAt: new Date() },
        });
      }

      if (status === "paid") {
        const wallet = await prisma.wallet.findUnique({ where: { userId: txn.userId } });
        if (wallet) {
          const { creditWallet } = await import("@/services/wallet/wallet.service");
          await prisma.transaction.update({
            where: { id: txn.id },
            data: { status: TransactionStatus.SUCCESS, completedAt: new Date(), providerReference: linkId },
          });
          await prisma.fundingTransaction.update({
            where: { transactionId: txn.id },
            data: { paymongoPaymentId: linkId, paidAt: new Date() },
          });
          await creditWallet(wallet.id, Number(txn.grossAmount), "Wallet Funding (recovered)", txn.id, txn.transactionNumber);
        }
      }
    } catch {
      // PayMongo API error — skip
    }
  }

  return NextResponse.json({ ok: true });
});
