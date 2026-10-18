import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { z } from "zod";
import { initiateCashout } from "@/services/cashout/cashout.service";
import { calculateFee } from "@/services/fees/fee.service";
import { FeeService } from "@/types/enums";

const schema = z.object({
  amount: z.number().min(5),
  channel: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { amount, channel, accountNumber, accountName } = parsed.data;

  // Block if wallet has zero or no balance
  const walletCheck = await prisma.wallet.findUnique({ where: { userId: payload.userId } });
  if (!walletCheck || walletCheck.status !== "ACTIVE") return NextResponse.json({ error: "Your wallet is not active" }, { status: 403 });
  if (Number(walletCheck.availableBalance) <= 0) return NextResponse.json({ error: "Insufficient balance. Please fund your wallet first." }, { status: 403 });

  try {
    const transaction = await initiateCashout(payload.userId, amount, channel, accountNumber, accountName);
    const markupFee = await calculateFee(FeeService.CASHOUT, amount);
    const fee = markupFee + 10;
    return NextResponse.json({ transactionNumber: transaction.transactionNumber, status: transaction.status, fee, totalDeducted: amount + fee });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});
