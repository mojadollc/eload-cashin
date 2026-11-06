import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { getCheckoutSession } from "@/providers/paymongo/paymongo.provider";
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
  if (txn.status === TransactionStatus.SUCCESS) return NextResponse.json({ status: "paid", amount: Number(txn.grossAmount) });

  const linkId = txn.fundingTxn?.paymongoLinkId;
  if (!linkId) return NextResponse.json({ status: txn.status.toLowerCase() });

  let session: any;
  try {
    session = await getCheckoutSession(linkId);
  } catch {
    return NextResponse.json({ status: txn.status.toLowerCase() });
  }

  // Checkout session statuses: active | expired | succeeded
  const pmStatus: string = session.attributes?.status || "";

  if (pmStatus === "succeeded") {
    const wallet = await prisma.wallet.findUnique({ where: { userId: txn.userId } });
    if (!wallet) return NextResponse.json({ status: "error" }, { status: 500 });

    const updated = await prisma.transaction.updateMany({
      where: { id: txn.id, status: TransactionStatus.PENDING },
      data: { status: TransactionStatus.SUCCESS, completedAt: new Date(), providerReference: session.id },
    });

    if (updated.count === 0) {
      return NextResponse.json({ status: "paid", amount: Number(txn.grossAmount) });
    }

    await prisma.fundingTransaction.update({
      where: { transactionId: txn.id },
      data: { paymongoPaymentId: session.id, paidAt: new Date() },
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

  if (pmStatus === "expired") {
    await prisma.transaction.update({
      where: { id: txn.id },
      data: { status: TransactionStatus.CANCELLED, failedAt: new Date() },
    });
    return NextResponse.json({ status: "expired" });
  }

  return NextResponse.json({ status: "pending", pmStatus });
});
