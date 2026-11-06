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

  if (!["payment.paid", "link.payment.paid", "checkout_session.payment.paid"].includes(eventType)) {
    return NextResponse.json({ ok: true });
  }

  // For checkout_session.payment.paid, data is the checkout session object
  // For payment.paid / link.payment.paid, data is the payment object
  const isCheckoutEvent = eventType === "checkout_session.payment.paid";
  const paymentData = isCheckoutEvent
    ? payload?.data?.attributes?.data?.attributes?.payments?.[0]
    : payload?.data?.attributes?.data;
  if (!paymentData) return NextResponse.json({ ok: true });

  const paymongoPaymentId: string = paymentData.id || "";
  const paymongoLinkId: string = isCheckoutEvent
    ? (payload?.data?.attributes?.data?.id || "")
    : (paymentData.attributes?.source?.id || "");
  const remarks: string = isCheckoutEvent
    ? (payload?.data?.attributes?.data?.attributes?.reference_number || "")
    : (paymentData.attributes?.remarks || paymentData.attributes?.description || "");
  const txnMatch = remarks.match(/WF-[\w-]+/);
  const txnNumber: string = txnMatch ? txnMatch[0] : remarks.trim();

  // ── Idempotency: skip if this payment was already processed ──────────────
  const alreadyProcessed = await prisma.providerWebhook.findFirst({
    where: { reference: paymongoPaymentId, processed: true },
  });
  if (alreadyProcessed) return NextResponse.json({ ok: true });

  const webhook = await prisma.providerWebhook.create({
    data: {
      provider: "PAYMONGO",
      eventType,
      payload,
      reference: paymongoPaymentId,
    },
  });

  // ── Look up transaction: txnNumber first, then paymongoLinkId ────────────
  let transaction: any = null;

  if (txnNumber) {
    transaction = await prisma.transaction.findFirst({
      where: { transactionNumber: txnNumber, type: "WALLET_FUND" },
      include: { fundingTxn: true },
    });
  }

  if (!transaction && paymongoLinkId) {
    const funding = await prisma.fundingTransaction.findFirst({
      where: { paymongoLinkId },
    });
    if (funding) {
      transaction = await prisma.transaction.findUnique({
        where: { id: funding.transactionId },
        include: { fundingTxn: true },
      });
    }
  }

  if (!transaction) {
    await prisma.providerWebhook.update({
      where: { id: webhook.id },
      data: { processed: true, processedAt: new Date(), error: "Transaction not found" },
    });
    return NextResponse.json({ ok: true });
  }

  // Already credited — idempotent
  if (transaction.status === TransactionStatus.SUCCESS) {
    await prisma.providerWebhook.update({
      where: { id: webhook.id },
      data: { processed: true, processedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: transaction.userId } });

  // Atomic guard: only update if still PENDING to prevent double-credit with /check polling
  const updated = await prisma.transaction.updateMany({
    where: { id: transaction.id, status: TransactionStatus.PENDING },
    data: { status: TransactionStatus.SUCCESS, completedAt: new Date(), providerReference: paymongoPaymentId },
  });

  await prisma.providerWebhook.update({
    where: { id: webhook.id },
    data: { processed: true, processedAt: new Date() },
  });

  if (updated.count === 0) return NextResponse.json({ ok: true }); // already credited

  await prisma.fundingTransaction.update({
    where: { transactionId: transaction.id },
    data: { paymongoPaymentId, paidAt: new Date() },
  });

  await creditWallet(
    wallet.id,
    Number(transaction.grossAmount),
    "Wallet Funding",
    transaction.id,
    transaction.transactionNumber
  );

  await prisma.notification.create({
    data: {
      userId: transaction.userId,
      title: "Wallet Funded",
      message: `₱${Number(transaction.grossAmount).toLocaleString("en-PH", { minimumFractionDigits: 2 })} has been added to your wallet.${
        Number(transaction.feeAmount) > 0
          ? ` (Service fee of ₱${Number(transaction.feeAmount).toLocaleString("en-PH", { minimumFractionDigits: 2 })} was charged.)`
          : ""
      }`,
      type: "WALLET_FUND",
    },
  });

  return NextResponse.json({ ok: true });
}
