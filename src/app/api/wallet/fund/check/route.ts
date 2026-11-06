import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { getCheckoutSession } from "@/providers/paymongo/paymongo.provider";
import { TransactionStatus } from "@/types/enums";

// This route only READS status — crediting is done exclusively by the webhook.
export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const { transactionNumber } = await req.json();
  if (!transactionNumber) return NextResponse.json({ error: "Missing transactionNumber" }, { status: 400 });

  const txn = await prisma.transaction.findFirst({
    where: { transactionNumber, userId: payload.userId, type: "WALLET_FUND" },
    include: { fundingTxn: true },
  });

  if (!txn) return NextResponse.json({ status: "not_found" }, { status: 404 });

  // Webhook already processed it — return immediately
  if (txn.status === TransactionStatus.SUCCESS) {
    return NextResponse.json({ status: "paid", amount: Number(txn.grossAmount) });
  }
  if (txn.status === TransactionStatus.CANCELLED) {
    return NextResponse.json({ status: "expired" });
  }

  // Still pending — check PayMongo directly
  const sessionId = txn.fundingTxn?.paymongoLinkId;
  if (!sessionId) return NextResponse.json({ status: "pending" });

  try {
    const session = await getCheckoutSession(sessionId);
    const pmStatus: string = session.attributes?.status || "";

    if (pmStatus === "succeeded") {
      // Webhook will credit the wallet — we just tell the frontend it's paid
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
});
