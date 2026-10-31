import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import { z } from "zod";
import { initiateEload } from "@/services/eload/eload.service";
import { calculateFee } from "@/services/fees/fee.service";
import { FeeService } from "@/types/enums";
import { rateLimit } from "@/lib/mobile/rate-limit";

const schema = z.object({
  mobileNumber: z.string().min(10),
  productCode: z.string(),
  network: z.string(),
  loadAmount: z.number().positive(),
  promoId: z.number().optional(),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const { allowed } = await rateLimit(`eload:${payload.userId}`, 10, 60);
  if (!allowed) return fail("Too many requests. Try again later.", 429, "RATE_LIMITED");

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0].message, 400);

  const { mobileNumber, productCode, network, loadAmount, promoId } = parsed.data;

  const wallet = await prisma.wallet.findUnique({ where: { userId: payload.userId } });
  if (!wallet || wallet.status !== "ACTIVE") return fail("Your wallet is not active", 403);
  if (Number(wallet.availableBalance) <= 0) return fail("Insufficient balance", 400, "INSUFFICIENT_BALANCE");

  try {
    const transaction = await initiateEload(payload.userId, mobileNumber, productCode, network, loadAmount, promoId);
    const fee = await calculateFee(FeeService.ELOAD, loadAmount);
    return ok({ transactionNumber: transaction.transactionNumber, status: transaction.status, fee, total: loadAmount + fee });
  } catch (err: any) {
    return fail(err.message, 400);
  }
});
