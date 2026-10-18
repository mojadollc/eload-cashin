import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { verifyPayMongoWebhook } from "@/providers/paymongo/paymongo.provider";
import { creditWallet } from "@/services/wallet/wallet.service";
import { TransactionStatus } from "@/types/enums";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sigHeader = req.headers.get("paymongo-signature") || "";

  if (!verifyPayMongoWebhook(rawBody, sigHeader, process.env.PAYMONGO_PAYMENT_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventType: string = payload?.data?.attributes?.type || "";

  // Handle both payment.paid and link.payment.paid
  if (!["payment.paid", "link.payment.paid"].includes(eventType)) {
    return NextResponse.json({ ok: true });
  }

  const paymentData = payload?.data?.attributes?.data;
  if (!paymentData) return NextResponse.json({ ok: true });

  const paymongoPaymentId: string = paymentData.id;
  // remarks holds our transaction number (set during link creation)
  const txnNumber: string = paymentData.attributes?.remarks || paymentData.attributes?.description || "";

  const webhook = await prisma.providerWebhook.create({
    data: { provider: "PAYMONGO", eventType, payload, reference: txnNumber || paymongoPaymentId },
  });

  if (webhook.processed) return NextResponse.json({ ok: true });

  const transaction = await prisma.transaction.findFirst({
    where: { transactionNumber: txnNumber, type: "WALLET_FUND" },
    include: { fundingTxn: true },
  });

  if (!transaction) {
    await prisma.providerWebhook.update({ where: { id: webhook.id }, data: { processed: true, processedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  if (transaction.status === TransactionStatus.SUCCESS) {
    await prisma.providerWebhook.update({ where: { id: webhook.id }, data: { processed: true, processedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: transaction.userId } });

  await prisma.$transaction(async (tx: any) => {
    await tx.transaction.update({ where: { id: transaction.id }, data: { status: TransactionStatus.SUCCESS, completedAt: new Date(), providerReference: paymongoPaymentId } });
    await tx.fundingTransaction.update({ where: { transactionId: transaction.id }, data: { paymongoPaymentId, paidAt: new Date() } });
    await tx.providerWebhook.update({ where: { id: webhook.id }, data: { processed: true, processedAt: new Date() } });
  });

  await creditWallet(wallet.id, Number(transaction.grossAmount), "Wallet Funding", transaction.id, txnNumber);

  await prisma.notification.create({
    data: { userId: transaction.userId, title: "Wallet Funded", message: `₱${Number(transaction.grossAmount).toLocaleString()} has been added to your wallet.`, type: "WALLET_FUND" },
  });

  return NextResponse.json({ ok: true });
}
