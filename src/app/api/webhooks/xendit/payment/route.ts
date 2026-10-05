import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { verifyXenditWebhook } from "@/providers/xendit/xendit.provider";
import { creditWallet } from "@/services/wallet/wallet.service";
import { TransactionStatus } from "@/types/enums";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-callback-token") || "";
  if (!verifyXenditWebhook(token)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await req.json();

  const webhook = await prisma.providerWebhook.create({
    data: { provider: "XENDIT", eventType: payload.status || "PAYMENT", payload, reference: payload.external_id },
  });

  if (webhook.processed) return NextResponse.json({ ok: true });

  const { external_id, status, id: xenditPaymentId } = payload;

  if (status !== "PAID") {
    await prisma.providerWebhook.update({ where: { id: webhook.id }, data: { processed: true, processedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  const transaction = await prisma.transaction.findFirst({
    where: { transactionNumber: external_id, type: "WALLET_FUND" },
    include: { fundingTxn: true },
  });

  if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  // Already successfully processed
  if (transaction.status === TransactionStatus.SUCCESS) {
    await prisma.providerWebhook.update({ where: { id: webhook.id }, data: { processed: true, processedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  // Allow recovery of CANCELLED transactions — QRPH can settle after we cancelled
  if (!([TransactionStatus.PENDING, TransactionStatus.CANCELLED] as string[]).includes(transaction.status)) {
    await prisma.providerWebhook.update({ where: { id: webhook.id }, data: { processed: true, processedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: transaction.userId } });

  await prisma.$transaction(async (tx: any) => {
    await tx.transaction.update({ where: { id: transaction.id }, data: { status: TransactionStatus.SUCCESS, completedAt: new Date(), providerReference: xenditPaymentId } });
    await tx.fundingTransaction.update({ where: { transactionId: transaction.id }, data: { xenditPaymentId, paidAt: new Date() } });
    await tx.providerWebhook.update({ where: { id: webhook.id }, data: { processed: true, processedAt: new Date() } });
  });

  await creditWallet(wallet.id, Number(transaction.grossAmount), "Wallet Funding", transaction.id, external_id);

  await prisma.notification.create({
    data: { userId: transaction.userId, title: "Wallet Funded", message: `₱${Number(transaction.grossAmount).toLocaleString()} has been added to your wallet.`, type: "WALLET_FUND" },
  });

  return NextResponse.json({ ok: true });
}
