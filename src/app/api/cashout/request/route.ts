import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { z } from "zod";
import { initiateCashout } from "@/services/cashout/cashout.service";

const schema = z.object({
  amount: z.number().min(5),
  channel: z.string().min(1),
  accountNumber: z.string().min(1),
  accountName: z.string().min(1),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { amount, channel, accountNumber, accountName } = parsed.data;

  const walletCheck = await prisma.wallet.findUnique({ where: { userId: payload.userId } });
  if (!walletCheck || walletCheck.status !== "ACTIVE")
    return NextResponse.json({ error: "Your wallet is not active" }, { status: 403 });
  if (Number(walletCheck.availableBalance) <= 0)
    return NextResponse.json({ error: "Insufficient balance. Please fund your wallet first." }, { status: 403 });

  try {
    const transaction = await initiateCashout(payload.userId, amount, channel, accountNumber, accountName);
    // feeAmount is set by initiateCashout (markupFee + PAYMONGO_DISBURSEMENT_FEE)
    const fee = Number(transaction.feeAmount);
    return NextResponse.json({
      transactionNumber: transaction.transactionNumber,
      status: transaction.status,
      fee,
      totalDeducted: amount + fee,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});
