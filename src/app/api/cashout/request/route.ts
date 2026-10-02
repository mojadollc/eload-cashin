import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { z } from "zod";
import { initiateCashout } from "@/services/cashout/cashout.service";
import { calculateFee } from "@/services/fees/fee.service";
import { FeeService } from "@/types/enums";

const schema = z.object({
  amount: z.number().min(100),
  channel: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { amount, channel, accountNumber, accountName } = parsed.data;
  try {
    const transaction = await initiateCashout(payload.userId, amount, channel, accountNumber, accountName);
    const fee = await calculateFee(FeeService.CASHOUT, amount);
    return NextResponse.json({ transactionNumber: transaction.transactionNumber, status: transaction.status, fee, totalDeducted: amount + fee });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});
