import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import { z } from "zod";
import { debitWallet, creditWallet } from "@/services/wallet/wallet.service";
import { TransactionType, TransactionStatus, Provider } from "@/types/enums";
import { generateTransactionNumber, generateIdempotencyKey } from "@/lib/security/generators";
import { rateLimit } from "@/lib/mobile/rate-limit";
import Decimal from "decimal.js";

const schema = z.object({
  accountNumber: z.string().min(1),
  amount: z.number().min(1),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const { allowed } = await rateLimit(`transfer:${payload.userId}`, 10, 60);
  if (!allowed) return fail("Too many requests. Try again later.", 429, "RATE_LIMITED");

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0].message, 400);

  const { accountNumber, amount } = parsed.data;

  const senderWallet = await prisma.wallet.findUnique({ where: { userId: payload.userId }, include: { user: true } });
  if (!senderWallet) return fail("Wallet not found", 404);
  if (senderWallet.status !== "ACTIVE") return fail("Your wallet is not active", 403);
  if (senderWallet.accountNumber === accountNumber) return fail("Cannot transfer to your own wallet", 400);

  if (new Decimal(senderWallet.availableBalance.toString()).lt(amount))
    return fail("Insufficient balance", 400, "INSUFFICIENT_BALANCE");

  const recipientWallet = await prisma.wallet.findUnique({ where: { accountNumber }, include: { user: true } });
  if (!recipientWallet) return fail("Recipient wallet not found. Check the account number.", 404);
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
        metadata: {
          transferTo: accountNumber,
          recipientName: `${recipientWallet.user.firstName} ${recipientWallet.user.lastName}`,
        },
      },
    });
    await tx.cashoutTransaction.create({
      data: {
        transactionId: created.id,
        channel: "CASHIN_TAP",
        accountNumber,
        accountName: `${recipientWallet.user.firstName} ${recipientWallet.user.lastName}`,
      },
    });
    return created;
  });

  await debitWallet(senderWallet.id, amount, `Transfer to ${accountNumber}`, txn.id, txnNumber);
  await creditWallet(recipientWallet.id, amount, `Transfer from ${senderWallet.accountNumber}`, txn.id, txnNumber);

  await prisma.notification.create({
    data: {
      userId: recipientWallet.userId,
      title: "Money Received",
      message: `₱${amount.toLocaleString()} received from ${senderWallet.user.firstName} ${senderWallet.user.lastName}.`,
      type: "WALLET_FUND",
    },
  });

  return ok({
    transactionNumber: txnNumber,
    recipientName: `${recipientWallet.user.firstName} ${recipientWallet.user.lastName}`,
    amount,
    fee: 0,
  });
});
