import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import { z } from "zod";
import { QRPH_SEND_FEE } from "@/providers/paymongo/paymongo.provider";
import { calculateFee } from "@/services/fees/fee.service";
import { FeeService } from "@/types/enums";
import { initiateQRPhSend } from "@/services/qrph-send/qrph-send.service";

const schema = z.object({
  amount: z.number().min(1).max(50000),
  qrPayload: z.string().min(1),   // raw QR Ph string scanned from merchant/bank QR
  recipientName: z.string().min(1),
  recipientBank: z.string().min(1),
  recipientAccount: z.string().min(1),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0].message, 400);

  const { amount, qrPayload, recipientName, recipientBank, recipientAccount } = parsed.data;

  const wallet = await prisma.wallet.findUnique({ where: { userId: payload.userId } });
  if (!wallet) return fail("Wallet not found", 404);
  if (wallet.status !== "ACTIVE") return fail("Your wallet is not active", 403);

  // Return fee preview if amount provided but no confirmation yet — mobile can call this
  // to show fee breakdown before user confirms. Actual deduction happens on confirm=true.
  const markupFee = await calculateFee(FeeService.QRPH_SEND, amount);
  const providerFee = QRPH_SEND_FEE;
  const totalFee = markupFee + providerFee;
  const totalDeduction = amount + totalFee;

  try {
    const { transaction } = await initiateQRPhSend(
      payload.userId,
      amount,
      qrPayload,
      recipientName,
      recipientBank,
      recipientAccount
    );

    return ok({
      transactionNumber: transaction.transactionNumber,
      status: transaction.status,
      amount,
      markupFee,
      providerFee,
      totalFee,
      totalDeduction,
    });
  } catch (err: any) {
    return fail(err.message, 400);
  }
});
