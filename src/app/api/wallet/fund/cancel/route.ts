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

  // Archive the PayMongo link so it can't be paid later
  if (linkId) {
    try {
      const key = Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString("base64");
      await fetch(`https://api.paymongo.com/v1/links/${linkId}/archive`, {
        method: "POST",
        headers: { Authorization: `Basic ${key}`, "Content-Type": "application/json" },
      });
    } catch {
      // Best-effort — still cancel in DB
    }
  }

  await prisma.transaction.update({
    where: { id: txn.id },
    data: { status: TransactionStatus.CANCELLED, failedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
});
