import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { getInvoice } from "@/providers/xendit/xendit.provider";
import { TransactionStatus } from "@/types/enums";

export const POST = requireAuth(async (_req: NextRequest, payload: JwtPayload) => {
  // Only look at PENDING WALLET_FUND transactions older than 24 hours
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
    const invoiceId = txn.fundingTxn?.xenditInvoiceId;
    if (!invoiceId) {
      // No invoice created — safe to cancel
      await prisma.transaction.update({
        where: { id: txn.id },
        data: { status: TransactionStatus.CANCELLED, failedAt: new Date() },
      });
      continue;
    }

    try {
      const invoice = await getInvoice(invoiceId);
      // Only cancel if Xendit confirms it's expired or failed
      if (["EXPIRED", "FAILED"].includes(invoice.status)) {
        await prisma.transaction.update({
          where: { id: txn.id },
          data: { status: TransactionStatus.CANCELLED, failedAt: new Date() },
        });
      }
      // If PAID but our DB is still PENDING, credit the wallet (recovery)
      if (invoice.status === "PAID" || invoice.status === "SETTLED") {
        const wallet = await prisma.wallet.findUnique({ where: { userId: txn.userId } });
        if (wallet) {
          const { creditWallet } = await import("@/services/wallet/wallet.service");
          await prisma.transaction.update({
            where: { id: txn.id },
            data: { status: TransactionStatus.SUCCESS, completedAt: new Date(), providerReference: invoice.id },
          });
          await prisma.fundingTransaction.update({
            where: { transactionId: txn.id },
            data: { xenditPaymentId: invoice.id, paidAt: new Date() },
          });
          await creditWallet(wallet.id, Number(txn.grossAmount), "Wallet Funding (recovered)", txn.id, txn.transactionNumber);
        }
      }
    } catch {
      // Xendit API error — skip, don't cancel
    }
  }

  return NextResponse.json({ ok: true });
});
