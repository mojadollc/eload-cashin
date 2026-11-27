import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { verifyPayMongoWebhook } from "@/providers/paymongo/paymongo.provider";
import { creditWallet } from "@/services/wallet/wallet.service";
import { TransactionStatus } from "@/types/enums";
import axios from "axios";

function getPayMongoClient() {
  return axios.create({
    baseURL: "https://api.paymongo.com/v1",
    auth: { username: process.env.PAYMONGO_SECRET_KEY!, password: "" },
    headers: { "Content-Type": "application/json" },
  });
}

async function chargeQRSource(sourceId: string, amount: number, txnNumber: string) {
  const { data } = await getPayMongoClient().post("/payments", {
    data: {
      attributes: {
        amount: Math.round(amount * 100),
        currency: "PHP",
        source: { id: sourceId, type: "source" },
        description: `CashIn Tap Wallet Funding - ${txnNumber}`,
      },
    },
  });
  return data.data;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sigHeader = req.headers.get("paymongo-signature") || "";

  const sigValid = verifyPayMongoWebhook(rawBody, sigHeader, process.env.PAYMONGO_PAYMENT_WEBHOOK_SECRET!);

  let payload: any;
  try { payload = JSON.parse(rawBody); } catch { return NextResponse.json({ ok: true }); }

  const eventType: string = payload?.data?.attributes?.type || "";

  if (!sigValid) {
    await prisma.providerWebhook.create({
      data: {
        provider: "PAYMONGO", eventType: `SIG_FAIL:${eventType}`, payload,
        reference: `sig_fail_${Date.now()}`, processed: true, processedAt: new Date(),
        error: "Signature verification failed",
      },
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  // ── QR Ph: source became chargeable — we must POST /payments to capture it ──
  if (eventType === "source.chargeable") {
    const sourceData = payload?.data?.attributes?.data;
    const sourceId: string = sourceData?.id || payload?.data?.id || "";
    const amountCents: number = sourceData?.attributes?.amount || 0;
    const amount = amountCents / 100;

    // Find transaction by source ID stored in paymongoLinkId
    const funding = await prisma.fundingTransaction.findFirst({ where: { paymongoLinkId: sourceId } });
    if (!funding) return NextResponse.json({ ok: true });

    const txn = await prisma.transaction.findUnique({
      where: { id: funding.transactionId },
      include: { fundingTxn: true },
    });
    if (!txn || txn.status !== TransactionStatus.PENDING) return NextResponse.json({ ok: true });

    try {
      await chargeQRSource(sourceId, amount, txn.transactionNumber);
      // payment.paid webhook will handle the actual credit
    } catch (err: any) {
      console.error("[webhook/qrph] charge failed:", err?.response?.data || err?.message);
      await prisma.transaction.update({
        where: { id: txn.id },
        data: { status: TransactionStatus.FAILED, failedAt: new Date() },
      });
    }
    return NextResponse.json({ ok: true });
  }

  // ── payment.paid / checkout_session.payment.paid / link.payment.paid ──
  if (!["payment.paid", "link.payment.paid", "checkout_session.payment.paid"].includes(eventType)) {
    return NextResponse.json({ ok: true });
  }

  try {
    const isCheckoutEvent = eventType === "checkout_session.payment.paid";
    const checkoutSession = isCheckoutEvent ? payload?.data?.attributes?.data : null;
    const paymentData = isCheckoutEvent
      ? checkoutSession?.attributes?.payments?.[0]
      : payload?.data?.attributes?.data;

    const paymongoPaymentId: string = paymentData?.id || checkoutSession?.id || "";

    // For QR Ph payment.paid, source ID is in payment.attributes.source.id
    const sourceId: string = isCheckoutEvent
      ? (checkoutSession?.id || "")
      : (paymentData?.attributes?.source?.id || "");

    const remarks: string = isCheckoutEvent
      ? (checkoutSession?.attributes?.reference_number || "")
      : (paymentData?.attributes?.remarks || paymentData?.attributes?.description || "");

    const txnMatch = remarks.match(/WF-[\w-]+/);
    const txnNumber: string = txnMatch ? txnMatch[0] : remarks.trim();

    if (!paymongoPaymentId) return NextResponse.json({ ok: true });

    const alreadyProcessed = await prisma.providerWebhook.findFirst({
      where: { reference: paymongoPaymentId, processed: true },
    });
    if (alreadyProcessed) return NextResponse.json({ ok: true });

    const webhook = await prisma.providerWebhook.create({
      data: { provider: "PAYMONGO", eventType, payload, reference: paymongoPaymentId },
    });

    let transaction: any = null;

    // Try by transaction number first
    if (txnNumber) {
      transaction = await prisma.transaction.findFirst({
        where: { transactionNumber: txnNumber, type: "WALLET_FUND" },
        include: { fundingTxn: true },
      });
    }

    // Fallback: match by QR source ID stored in paymongoLinkId
    if (!transaction && sourceId) {
      const funding = await prisma.fundingTransaction.findFirst({ where: { paymongoLinkId: sourceId } });
      if (funding) {
        transaction = await prisma.transaction.findUnique({
          where: { id: funding.transactionId },
          include: { fundingTxn: true },
        });
      }
    }

    // Fallback: match by checkout link ID
    if (!transaction && sourceId) {
      const funding = await prisma.fundingTransaction.findFirst({ where: { paymongoLinkId: sourceId } });
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

    if (transaction.status === TransactionStatus.SUCCESS) {
      await prisma.providerWebhook.update({ where: { id: webhook.id }, data: { processed: true, processedAt: new Date() } });
      return NextResponse.json({ ok: true });
    }

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: transaction.userId } });

    const updated = await prisma.transaction.updateMany({
      where: { id: transaction.id, status: TransactionStatus.PENDING },
      data: { status: TransactionStatus.SUCCESS, completedAt: new Date(), providerReference: paymongoPaymentId },
    });

    await prisma.providerWebhook.update({ where: { id: webhook.id }, data: { processed: true, processedAt: new Date() } });

    if (updated.count === 0) return NextResponse.json({ ok: true });

    await prisma.fundingTransaction.update({
      where: { transactionId: transaction.id },
      data: { paymongoPaymentId, paidAt: new Date() },
    });

    // Credit wallet with grossAmount (what user wanted to load, fees already separated)
    await creditWallet(
      wallet.id,
      Number(transaction.grossAmount),
      "Wallet Funding via QR Ph",
      transaction.id,
      transaction.transactionNumber
    );

    const feeAmt = Number(transaction.feeAmount);
    await prisma.notification.create({
      data: {
        userId: transaction.userId,
        title: "Wallet Funded",
        message: `\u20b1${Number(transaction.grossAmount).toLocaleString("en-PH", { minimumFractionDigits: 2 })} has been added to your wallet.${
          feeAmt > 0
            ? ` (Fee of \u20b1${feeAmt.toLocaleString("en-PH", { minimumFractionDigits: 2 })} was charged.)`
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
