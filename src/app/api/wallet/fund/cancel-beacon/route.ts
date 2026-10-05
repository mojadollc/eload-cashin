import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { TransactionStatus } from "@/types/enums";
import { getTokenFromRequest } from "@/lib/auth/middleware";
import { verifyAccessToken } from "@/lib/auth/jwt";

// Called by navigator.sendBeacon — no Authorization header support,
// so we accept the token in the request body alongside transactionNumber.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactionNumber, accessToken: bodyToken } = body;
    if (!transactionNumber) return NextResponse.json({ ok: false }, { status: 400 });

    // Try header token first, fall back to body token
    const rawToken = getTokenFromRequest(req) || bodyToken;
    if (!rawToken) return NextResponse.json({ ok: false }, { status: 401 });

    let userId: string;
    try {
      const payload = verifyAccessToken(rawToken);
      userId = payload.userId;
    } catch {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const txn = await prisma.transaction.findFirst({
      where: { transactionNumber, userId, type: "WALLET_FUND", status: TransactionStatus.PENDING },
    });

    if (!txn) return NextResponse.json({ ok: true }); // already resolved or not found

    await prisma.transaction.update({
      where: { id: txn.id },
      data: { status: TransactionStatus.CANCELLED, failedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
