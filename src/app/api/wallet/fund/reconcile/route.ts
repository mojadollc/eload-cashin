import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { getPaymentLink } from "@/providers/paymongo/paymongo.provider";
import { creditWallet } from "@/services/wallet/wallet.service";
import { TransactionStatus } from "@/types/enums";

export const POST = requireAuth(async (_req: NextRequest, payload: JwtPayload) => {
  const pending = await prisma.transaction.findMany({
    where: { userId: payload.userId, type: "WALLET_FUND", status: TransactionStatus.PENDING },
    include: { fundingTxn: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  let recovered = 0;

  for (const txn of pending) {
    const linkId = txn.fundingTxn?.paymongoLinkId;
    if (!linkId) continue;

    try {
      const link = await getPaymentLink(linkId);
      const status: string = link.attributes?.status || "";

      if (status === "paid") {
        const fresh = await prisma.transaction.findUnique({ where: { id: txn.id } });
        if (fresh?.status === TransactionStatus.SUCCESS) continue;

        const wallet = await prisma.wallet.findUnique({ where: { userId: txn.userId } });
        if (!wallet) continue;

        await prisma.$transaction(async (tx: any) => {
          await tx.transaction.update({ where: { id: txn.id }, data: { status: TransactionStatus.SUCCESS, completedAt: new Date(), providerReference: linkId } });
          await tx.fundingTransaction.update({ where: { transactionId: txn.id }, data: { paymongoPaymentId: linkId, paidAt: new Date() } });
        });

        await creditWallet(wallet.id, Number(txn.grossAmount), "Wallet Funding", txn.id, txn.transactionNumber);

        await prisma.notification.create({
          data: {
            userId: txn.userId,
            title: "Wallet Funded",
            message: `₱${Number(txn.grossAmount).toLocaleString("en-PH", { minimumFractionDigits: 2 })} has been added to your wallet.`,
            type: "WALLET_FUND",
          },
        });

        recovered++;
      } else if (status === "archived") {
        await prisma.transaction.update({ where: { id: txn.id }, data: { status: TransactionStatus.CANCELLED, failedAt: new Date() } });
      }
    } catch {
      // PayMongo API error — skip
    }
  }

  return NextResponse.json({ ok: true, recovered });
});
