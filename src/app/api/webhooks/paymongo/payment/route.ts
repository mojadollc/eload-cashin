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

  if (!["payment.paid", "link.payment.paid"].includes(eventType)) {
    return NextResponse.json({ ok: true });
  }

  // ── Extract IDs from payload ──────────────────────────────────────────────
  // PayMongo sends different shapes for payment.paid vs link.payment.paid:
  //   payment.paid      → data.attributes.data = payment object
  //   link.payment.paid → data.attributes.data = link object (payments nested inside)
  const eventData = payload?.data?.attributes?.data;
  if (!eventData) return NextResponse.json({ ok: true });

  let paymongoPaymentId = "";
  let paymongoLinkId = "";
  let txnNumber = "";

  if (eventType === "link.payment.paid") {
    // eventData is the LINK object
    paymongoLinkId = eventData.id || "";
    // remarks on the link = the externalId we set (e.g. WF-20261031-123)
    const remarks: string = eventData.attributes?.remarks || eventData.attributes?.description || "";
    const match = remarks.match(/WF-[\w-]+/);
    txnNumber = match ? match[0] : remarks.trim();
    // payment id is inside payments array
    const payments: any[] = eventData.attributes?.payments || [];
    paymongoPaymentId = payments[0]?.id || "";
  } else {
    // payment.paid — eventData is the PAYMENT object
    paymongoPaymentId = eventData.id || "";
    // source.id on a payment = the link that generated it
    paymongoLinkId = eventData.attributes?.source?.id || "";
    const remarks: string = eventData.attributes?.remarks || eventData.attributes?.description || "";
    const match = remarks.match(/WF-[\w-]+/);
    txnNumber = match ? match[0] : "";
  }

  // ── Idempotency: store webhook ────────────────────────────────────────────
  const webhook = await prisma.providerWebhook.create({
    data: {
      provider: "PAYMONGO",
      eventType,
      payload,
      reference: txnNumber || paymongoLinkId || paymongoPaymentId,
    },
  });

  // ── Look up our transaction ───────────────────────────────────────────────
  // Priority: txnNumber → paymongoLinkId (most reliable since we store it)
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
    await prisma.providerWebhook.update({ where: { id: webhook.id }, data: { processed: true, processedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: transaction.userId } });

  // ── Credit wallet ─────────────────────────────────────────────────────────
  await prisma.$transaction(async (tx: any) => {
    await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.SUCCESS,
        completedAt: new Date(),
        providerReference: paymongoPaymentId || paymongoLinkId,
      },
    });
    await tx.fundingTransaction.update({
      where: { transactionId: transaction.id },
      data: {
        paymongoPaymentId: paymongoPaymentId || null,
        paidAt: new Date(),
      },
    });
    await tx.providerWebhook.update({
      where: { id: webhook.id },
      data: { processed: true, processedAt: new Date() },
    });
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
