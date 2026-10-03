import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { TransactionStatus } from "@/types/enums";

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const { transactionNumber } = await req.json();
  if (!transactionNumber) return NextResponse.json({ error: "Missing transactionNumber" }, { status: 400 });

  const txn = await prisma.transaction.findFirst({
    where: { transactionNumber, userId: payload.userId, type: "WALLET_FUND" },
  });

  if (!txn) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (txn.status !== TransactionStatus.PENDING) return NextResponse.json({ ok: true }); // already resolved

  await prisma.transaction.update({
    where: { id: txn.id },
    data: { status: TransactionStatus.CANCELLED },
  });

  return NextResponse.json({ ok: true });
});
