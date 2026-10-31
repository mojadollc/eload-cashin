import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import { z } from "zod";
import { TransactionType, TransactionStatus, Provider, FeeService } from "@/types/enums";
import { generateTransactionNumber, generateIdempotencyKey } from "@/lib/security/generators";
import { calculateFee } from "@/services/fees/fee.service";
import { createPaymentLink } from "@/providers/paymongo/paymongo.provider";

const schema = z.object({
  amount: z.number().min(100).max(50000),
  paymentMethod: z.string().optional(),
  // Mobile deep-link URLs for redirect after payment
  successUrl: z.string().url().optional(),
  failureUrl: z.string().url().optional(),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0].message, 400);

  const wallet = await prisma.wallet.findUnique({ where: { userId: payload.userId } });
  if (!wallet) return fail("Wallet not found", 404);
  if (wallet.status !== "ACTIVE") return fail("Your wallet is not active", 403);

  const { amount, paymentMethod, successUrl, failureUrl } = parsed.data;
  const fee = await calculateFee(FeeService.WALLET_FUND, amount);
  const totalAmount = amount + fee;
  const txnNumber = generateTransactionNumber("WALLET_FUND");

  const transaction = await prisma.$transaction(async (tx: any) => {
    const txn = await tx.transaction.create({
      data: {
        transactionNumber: txnNumber,
        userId: payload.userId,
        type: TransactionType.WALLET_FUND,
        status: TransactionStatus.PENDING,
        grossAmount: amount,
        feeAmount: fee,
        netAmount: totalAmount,
        provider: Provider.PAYMONGO,
        idempotencyKey: generateIdempotencyKey(),
      },
    });
    await tx.fundingTransaction.create({ data: { transactionId: txn.id, paymentMethod: paymentMethod || "" } });
    await tx.providerTransaction.create({ data: { transactionId: txn.id, provider: Provider.PAYMONGO } });
    return txn;
  });

  let link;
  try {
    link = await createPaymentLink({
      externalId: txnNumber,
      amount: totalAmount,
      description: fee > 0
        ? `CashIn Tap Wallet Funding - ${txnNumber} (Load: ₱${amount.toFixed(2)} + Fee: ₱${fee.toFixed(2)})`
        : `CashIn Tap Wallet Funding - ${txnNumber}`,
      successUrl: successUrl ?? `${process.env.APP_URL}/wallet/fund/return?ref=${txnNumber}`,
      failureUrl: failureUrl ?? `${process.env.APP_URL}/wallet/fund/return?ref=${txnNumber}&failed=1`,
    });
  } catch (err: any) {
    await prisma.transaction.update({ where: { id: transaction.id }, data: { status: TransactionStatus.FAILED } });
    return fail(err.message || "Payment provider error", 502);
  }

  const checkoutUrl = link.attributes?.checkout_url || link.attributes?.url;
  await prisma.fundingTransaction.update({
    where: { transactionId: transaction.id },
    data: { paymongoLinkId: link.id, checkoutUrl, paymentMethod: paymentMethod || "" },
  });

  return ok({ checkoutUrl, transactionNumber: txnNumber, amount, fee, total: totalAmount });
});
