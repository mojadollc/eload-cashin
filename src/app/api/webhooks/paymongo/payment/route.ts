import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { verifyPayMongoWebhook } from "@/providers/paymongo/paymongo.provider";
import { creditWallet } from "@/services/wallet/wallet.service";
import { TransactionStatus } from "@/types/enums";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sigHeader = req.headers.get("paymongo-signature") || "";

  if (!verifyPayMongoWebhook(rawBody, sigHeader, process.env.PAYMONGO_PAYMENT_WEBHOOK_SECRET!)) {
    console.log("[webhook] signature mismatch — ignoring");
    return NextResponse.json({ ok: true });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const eventType: string = payload?.data?.attributes?.type || "";
  console.log("[webhook] eventType:", eventType);

  if (!["payment.paid", "link.payment.paid", "checkout_session.payment.paid"].includes(eventType)) {
    return NextResponse.json({ ok: true });
  }

  try {
    const isCheckoutEvent = eventType === "checkout_session.payment.paid";

    // For checkout_session events the structure is:
    // payload.data.attributes.data = checkout session object
    // payload.data.attributes.data.attributes.reference_number = our txnNumber
    // payload.data.attributes.data.attributes.payments[0] = payment object (may be absent)
    const checkoutSession = isCheckoutEvent ? payload?.data?.attributes?.data : null;
    const paymentData = isCheckoutEvent
      ? checkoutSession?.attributes?.payments?.[0]
      : payload?.data?.attributes?.data;

    // Use checkout session ID as idempotency key if no payment object yet
    const paymongoPaymentId: string = paymentData?.id || checkoutSession?.id || "";
    const paymongoLinkId: string = isCheckoutEvent
      ? (checkoutSession?.id || "")
      : (paymentData?.attributes?.source?.id || "");

    const remarks: string = isCheckoutEvent
      ? (checkoutSession?.attributes?.reference_number || "")
      : (paymentData?.attributes?.remarks || paymentData?.attributes?.description || "");

    const txnMatch = remarks.match(/WF-[\w-]+/);
    const txnNumber: string = txnMatch ? txnMatch[0] : remarks.trim();

    console.log("[webhook] paymongoPaymentId:", paymongoPaymentId, "| paymongoLinkId:", paymongoLinkId, "| txnNumber:", txnNumber);

    if (!paymongoPaymentId) {
      console.log("[webhook] no payment ID found, skipping");
      return NextResponse.json({ ok: true });
    }

    const alreadyProcessed = await prisma.providerWebhook.findFirst({
      where: { reference: paymongoPaymentId, processed: true },
    });
    if (alreadyProcessed) {
      console.log("[webhook] already processed, skipping");
      return NextResponse.json({ ok: true });
    }

    const webhook = await prisma.providerWebhook.create({
      data: { provider: "PAYMONGO", eventType, payload, reference: paymongoPaymentId },
    });

    let transaction: any = null;

    if (txnNumber) {
      transaction = await prisma.transaction.findFirst({
        where: { transactionNumber: txnNumber, type: "WALLET_FUND" },
        include: { fundingTxn: true },
      });
    }

    if (!transaction && paymongoLinkId) {
      const funding = await prisma.fundingTransaction.findFirst({ where: { paymongoLinkId } });
      if (funding) {
        transaction = await prisma.transaction.findUnique({
          where: { id: funding.transactionId },
          include: { fundingTxn: true },
        });
      }
    }

    console.log("[webhook] transaction found:", transaction?.transactionNumber, "| status:", transaction?.status);

    if (!transaction) {
      await prisma.providerWebhook.update({
        where: { id: webhook.id },
        data: { processed: true, processedAt: new Date(), error: "Transaction not found" },
      });
      return NextResponse.json({ ok: true });
    }

    if (transaction.status === TransactionStatus.SUCCESS) {
      await prisma.providerWebhook.update({
        where: { id: webhook.id },
        data: { processed: true, processedAt: new Date() },
      });
      return NextResponse.json({ ok: true });
    }

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: transaction.userId } });

    const updated = await prisma.transaction.updateMany({
      where: { id: transaction.id, status: TransactionStatus.PENDING },
      data: { status: TransactionStatus.SUCCESS, completedAt: new Date(), providerReference: paymongoPaymentId },
    });

    await prisma.providerWebhook.update({
      where: { id: webhook.id },
      data: { processed: true, processedAt: new Date() },
    });

    if (updated.count === 0) {
      console.log("[webhook] updateMany count=0, already credited");
      return NextResponse.json({ ok: true });
    }

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

    console.log("[webhook] credited wallet", wallet.id, "amount:", transaction.grossAmount);

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
  } catch (err: any) {
    console.error("[webhook/paymongo/payment] ERROR:", err?.message || err);
  }

  return NextResponse.json({ ok: true });
}
