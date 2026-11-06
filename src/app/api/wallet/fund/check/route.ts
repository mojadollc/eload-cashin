import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { TransactionStatus } from "@/types/enums";

// Used by dashboard pending banner to check if a transaction was credited.
// No auth required — transactionNumber is unguessable.
export async function POST(req: NextRequest) {
  const { transactionNumber } = await req.json();
  if (!transactionNumber) return NextResponse.json({ error: "Missing transactionNumber" }, { status: 400 });

  const txn = await prisma.transaction.findFirst({
    where: { transactionNumber, type: "WALLET_FUND" },
  });

  if (!txn) return NextResponse.json({ status: "not_found" }, { status: 404 });

  if (txn.status === TransactionStatus.SUCCESS) {
    return NextResponse.json({ status: "paid", amount: Number(txn.grossAmount) });
  }
  if (txn.status === TransactionStatus.CANCELLED) {
    return NextResponse.json({ status: "expired" });
  }

  return NextResponse.json({ status: "pending" });
}
