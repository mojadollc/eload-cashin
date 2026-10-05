import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { getInvoice } from "@/providers/xendit/xendit.provider";
import { creditWallet } from "@/services/wallet/wallet.service";
import { TransactionStatus } from "@/types/enums";

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const { transactionNumber } = await req.json();
  if (!transactionNumber) return NextResponse.json({ error: "Missing transactionNumber" }, { status: 400 });

  const txn = await prisma.transaction.findFirst({
    where: { transactionNumber, userId: payload.userId, type: "WALLET_FUND" },
    include: { fundingTxn: true },
  });

  if (!txn) return NextResponse.json({ status: "not_found" }, { status: 404 });

  // Already successfully processed
  if (txn.status === TransactionStatus.SUCCESS) return NextResponse.json({ status: "paid" });

  const invoiceId = txn.fundingTxn?.xenditInvoiceId;
  if (!invoiceId) return NextResponse.json({ status: txn.status.toLowerCase() });

  let invoice: any;
  try {
    invoice = await getInvoice(invoiceId);
  } catch {
    return NextResponse.json({ status: txn.status.toLowerCase() });
  }

  if (invoice.status === "PAID" || invoice.status === "SETTLED") {
    const wallet = await prisma.wallet.findUnique({ where: { userId: txn.userId } });
    if (!wallet) return NextResponse.json({ status: "error" }, { status: 500 });

    // Avoid double credit if webhook already processed it
    const fresh = await prisma.transaction.findUnique({ where: { id: txn.id } });
    if (fresh?.status === TransactionStatus.SUCCESS) return NextResponse.json({ status: "paid" });

    await prisma.$transaction(async (tx: any) => {
      await tx.transaction.update({
        where: { id: txn.id },
        data: { status: TransactionStatus.SUCCESS, completedAt: new Date(), providerReference: invoice.id },
      });
      await tx.fundingTransaction.update({
        where: { transactionId: txn.id },
        data: { xenditPaymentId: invoice.id, paidAt: new Date() },
      });
    });

    await creditWallet(wallet.id, Number(txn.grossAmount), "Wallet Funding", txn.id, transactionNumber);

    await prisma.notification.create({
      data: {
        userId: txn.userId,
        title: "Wallet Funded",
        message: `₱${Number(txn.grossAmount).toLocaleString()} has been added to your wallet.`,
        type: "WALLET_FUND",
      },
    });

    return NextResponse.json({ status: "paid", amount: Number(txn.grossAmount) });
  }

  if (invoice.status === "EXPIRED") {
    await prisma.transaction.update({
      where: { id: txn.id },
      data: { status: TransactionStatus.CANCELLED, failedAt: new Date() },
    });
    return NextResponse.json({ status: "expired" });
  }

  return NextResponse.json({ status: "pending", xenditStatus: invoice.status });
});
