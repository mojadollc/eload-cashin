import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import { debitWallet, creditWallet } from "@/services/wallet/wallet.service";
import { TransactionType, TransactionStatus, Provider } from "@/types/enums";
import { generateTransactionNumber, generateIdempotencyKey } from "@/lib/security/generators";
import { rateLimit } from "@/lib/mobile/rate-limit";
import Decimal from "decimal.js";
import { z } from "zod";
import crypto from "crypto";

const schema = z.object({
  qrData: z.object({
    accountNumber: z.string(),
    accountName: z.string(),
    currency: z.string(),
    issuedAt: z.number(),
  }),
  signature: z.string(),
  amount: z.number().positive(),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const { allowed } = await rateLimit(`qrpay:${payload.userId}`, 5, 60);
  if (!allowed) return fail("Too many requests", 429, "RATE_LIMITED");

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Invalid QR data", 400);

  const { qrData, signature, amount } = parsed.data;

  // Verify QR signature
  const expected = crypto
    .createHmac("sha256", process.env.JWT_SECRET!)
    .update(JSON.stringify(qrData))
    .digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return fail("Invalid or tampered QR code", 400, "QR_INVALID");
  }

  // QR codes expire after 10 minutes
  if (Date.now() - qrData.issuedAt > 10 * 60 * 1000) {
    return fail("QR code has expired. Ask the recipient to generate a new one.", 400, "QR_EXPIRED");
  }

  const senderWallet = await prisma.wallet.findUnique({
    where: { userId: payload.userId },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  if (!senderWallet) return fail("Wallet not found", 404);
  if (senderWallet.status !== "ACTIVE") return fail("Your wallet is not active", 403);
  if (senderWallet.accountNumber === qrData.accountNumber) return fail("Cannot pay yourself", 400);

  if (new Decimal(senderWallet.availableBalance.toString()).lt(amount)) {
    return fail("Insufficient balance", 400, "INSUFFICIENT_BALANCE");
  }

  const recipientWallet = await prisma.wallet.findUnique({
    where: { accountNumber: qrData.accountNumber },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  if (!recipientWallet) return fail("Recipient wallet not found", 404);
  if (recipientWallet.status !== "ACTIVE") return fail("Recipient wallet is not active", 400);

  const txnNumber = generateTransactionNumber("TRANSFER");

  const txn = await prisma.$transaction(async (tx: any) => {
    const created = await tx.transaction.create({
      data: {
        transactionNumber: txnNumber,
        userId: payload.userId,
        type: TransactionType.CASHOUT,
        status: TransactionStatus.SUCCESS,
        grossAmount: amount,
        feeAmount: 0,
        netAmount: amount,
        provider: Provider.SYSTEM,
        idempotencyKey: generateIdempotencyKey(),
        completedAt: new Date(),
        metadata: { qrPay: true, recipientAccount: qrData.accountNumber, recipientName: qrData.accountName },
      },
    });
    await tx.cashoutTransaction.create({
      data: {
        transactionId: created.id,
        channel: "QR_PAY",
        accountNumber: qrData.accountNumber,
        accountName: qrData.accountName,
      },
    });
    return created;
  });

  await debitWallet(senderWallet.id, amount, `QR Pay to ${qrData.accountNumber}`, txn.id, txnNumber);
  await creditWallet(recipientWallet.id, amount, `QR Pay from ${senderWallet.accountNumber}`, txn.id, txnNumber);

  await prisma.notification.create({
    data: {
      userId: recipientWallet.userId,
      title: "Payment Received",
      message: `₱${amount.toLocaleString()} received via QR from ${senderWallet.user.firstName} ${senderWallet.user.lastName}.`,
      type: "WALLET_FUND",
    },
  });

  return ok({
    transactionNumber: txnNumber,
    recipientName: qrData.accountName,
    amount,
  });
});
