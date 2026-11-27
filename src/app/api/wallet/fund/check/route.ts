import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { TransactionStatus } from "@/types/enums";

export async function POST(req: NextRequest) {
  const { transactionNumber } = await req.json();
  if (!transactionNumber) return NextResponse.json({ error: "Missing transactionNumber" }, { status: 400 });

  const txn = await prisma.transaction.findFirst({
    where: { transactionNumber, type: "WALLET_FUND" },
    include: { fundingTxn: true },
  });

  if (!txn) return NextResponse.json({ status: "not_found" }, { status: 404 });

  const qrData = txn.fundingTxn?.checkoutUrl || "";
  const sourceId = txn.fundingTxn?.paymongoLinkId || "";

  if (txn.status === TransactionStatus.SUCCESS) {
    return NextResponse.json({ status: "paid", amount: Number(txn.grossAmount), qrData, sourceId });
  }
  if (txn.status === TransactionStatus.CANCELLED) {
    return NextResponse.json({ status: "expired", qrData, sourceId });
  }

  return NextResponse.json({ status: "pending", qrData, sourceId });
}
