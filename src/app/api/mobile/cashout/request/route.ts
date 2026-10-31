import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import { z } from "zod";
import { initiateCashout } from "@/services/cashout/cashout.service";
import { calculateFee } from "@/services/fees/fee.service";
import { FeeService } from "@/types/enums";
import { rateLimit } from "@/lib/mobile/rate-limit";

const schema = z.object({
  amount: z.number().min(5),
  channel: z.string().min(1),
  accountNumber: z.string().min(1),
  accountName: z.string().min(1),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const { allowed } = await rateLimit(`cashout:${payload.userId}`, 5, 60);
  if (!allowed) return fail("Too many requests. Try again later.", 429, "RATE_LIMITED");

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0].message, 400);

  const { amount, channel, accountNumber, accountName } = parsed.data;

  const wallet = await prisma.wallet.findUnique({ where: { userId: payload.userId } });
  if (!wallet || wallet.status !== "ACTIVE") return fail("Your wallet is not active", 403);
  if (Number(wallet.availableBalance) <= 0) return fail("Insufficient balance", 400, "INSUFFICIENT_BALANCE");

  try {
    const transaction = await initiateCashout(payload.userId, amount, channel, accountNumber, accountName);
    const markupFee = await calculateFee(FeeService.CASHOUT, amount);
    const fee = markupFee + 10;
    return ok({ transactionNumber: transaction.transactionNumber, status: transaction.status, fee, totalDeducted: amount + fee });
  } catch (err: any) {
    return fail(err.message, 400);
  }
});
