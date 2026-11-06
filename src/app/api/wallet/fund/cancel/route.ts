import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { TransactionStatus } from "@/types/enums";

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const { transactionNumber } = await req.json();
  if (!transactionNumber) return NextResponse.json({ error: "Missing transactionNumber" }, { status: 400 });

  const txn = await prisma.transaction.findFirst({
    where: { transactionNumber, userId: payload.userId, type: "WALLET_FUND", status: TransactionStatus.PENDING },
    include: { fundingTxn: true },
  });

  if (!txn) return NextResponse.json({ ok: false, reason: "not_found" });

  const linkId = txn.fundingTxn?.paymongoLinkId;

  // Checkout sessions expire on their own — no archive API needed
  // (old payment links used /links/:id/archive, but checkout sessions don't support it)
  void linkId;

  await prisma.transaction.update({
    where: { id: txn.id },
    data: { status: TransactionStatus.CANCELLED, failedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
});
