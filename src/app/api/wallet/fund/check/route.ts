import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { getCheckoutSession } from "@/providers/paymongo/paymongo.provider";
import { TransactionStatus } from "@/types/enums";

// No auth required — transactionNumber is an unguessable reference.
// Only returns status + gross amount, no sensitive user data.
export async function POST(req: NextRequest) {
  const { transactionNumber } = await req.json();
  if (!transactionNumber) return NextResponse.json({ error: "Missing transactionNumber" }, { status: 400 });

  const txn = await prisma.transaction.findFirst({
    where: { transactionNumber, type: "WALLET_FUND" },
    include: { fundingTxn: true },
  });

  if (!txn) return NextResponse.json({ status: "not_found" }, { status: 404 });

  if (txn.status === TransactionStatus.SUCCESS) {
    return NextResponse.json({ status: "paid", amount: Number(txn.grossAmount) });
  }
  if (txn.status === TransactionStatus.CANCELLED) {
    return NextResponse.json({ status: "expired" });
  }

  const sessionId = txn.fundingTxn?.paymongoLinkId;
  if (!sessionId) return NextResponse.json({ status: "pending" });

  try {
    const session = await getCheckoutSession(sessionId);
    const pmStatus: string = session.attributes?.status || "";

    if (pmStatus === "succeeded") {
      return NextResponse.json({ status: "paid", amount: Number(txn.grossAmount) });
    }
    if (pmStatus === "expired") {
      await prisma.transaction.update({
        where: { id: txn.id },
        data: { status: TransactionStatus.CANCELLED, failedAt: new Date() },
      });
      return NextResponse.json({ status: "expired" });
    }
  } catch {
    // PayMongo unreachable — keep polling
  }

  return NextResponse.json({ status: "pending" });
}
