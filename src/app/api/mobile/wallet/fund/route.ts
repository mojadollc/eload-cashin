import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import { z } from "zod";
import { TransactionType, TransactionStatus, Provider, FeeService } from "@/types/enums";
import { generateTransactionNumber, generateIdempotencyKey } from "@/lib/security/generators";
import { calculateFee } from "@/services/fees/fee.service";
import { createCheckoutSession } from "@/providers/paymongo/paymongo.provider";

// PayMongo QR Ph / card rate: 1.5008% (1.5% + 0.0008% rounding buffer)
// Formula: totalCentavos = ceil(((amount + systemFee) / (1 - 0.015008)) * 100)
// This ensures PayMongo receives enough to cover their fee and we still credit `amount` to wallet.
const PM_RATE = 0.015008;

function calcPaymongoFee(walletCredit: number, systemFee: number): { paymongoFee: number; totalCharge: number } {
  const totalCentavos = Math.ceil(((walletCredit + systemFee) / (1 - PM_RATE)) * 100);
  const totalCharge = totalCentavos / 100;
  const paymongoFee = Math.round((totalCharge - walletCredit - systemFee) * 100) / 100;
  return { paymongoFee, totalCharge };
}

const schema = z.object({
  amount: z.number().min(100).max(50000),
  paymentMethod: z.string().optional(),
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

  // Server-side fee calculation — never trust client-sent fees
  const systemFee = await calculateFee(FeeService.WALLET_FUND, amount);
  const { paymongoFee, totalCharge } = calcPaymongoFee(amount, systemFee);
  const totalFee = systemFee + paymongoFee;

  const txnNumber = generateTransactionNumber("WALLET_FUND");

  const transaction = await prisma.$transaction(async (tx: any) => {
    const txn = await tx.transaction.create({
      data: {
        transactionNumber: txnNumber,
        userId: payload.userId,
        type: TransactionType.WALLET_FUND,
        status: TransactionStatus.PENDING,
        grossAmount: amount,        // credited to wallet on success
        feeAmount: totalFee,        // systemFee + paymongoFee
        netAmount: totalCharge,     // what PayMongo actually charges
        provider: Provider.PAYMONGO,
        idempotencyKey: generateIdempotencyKey(),
        metadata: { systemFee, paymongoFee },
      },
    });
    await tx.fundingTransaction.create({ data: { transactionId: txn.id, paymentMethod: paymentMethod || "" } });
    await tx.providerTransaction.create({ data: { transactionId: txn.id, provider: Provider.PAYMONGO } });
    return txn;
  });

  let session;
  try {
    session = await createCheckoutSession({
      externalId: txnNumber,
      amount: totalCharge,
      description: `CashIn Tap Wallet Funding - ${txnNumber}`,
      // Pass fee breakdown so PayMongo shows it as a separate line item
      systemFee,
      paymongoFee,
      walletCredit: amount,
      successUrl: successUrl ?? `${process.env.APP_URL}/wallet/fund/return?ref=${txnNumber}`,
      cancelUrl: failureUrl ?? `${process.env.APP_URL}/wallet/fund/return?ref=${txnNumber}&failed=1`,
    });
  } catch (err: any) {
    await prisma.transaction.update({ where: { id: transaction.id }, data: { status: TransactionStatus.FAILED } });
    return fail(err.message || "Payment provider error", 502);
  }

  const checkoutUrl = session.attributes?.checkout_url;
  await prisma.fundingTransaction.update({
    where: { transactionId: transaction.id },
    data: { paymongoLinkId: session.id, checkoutUrl, paymentMethod: paymentMethod || "" },
  });

  return ok({
    checkoutUrl,
    transactionNumber: txnNumber,
    amount,           // wallet credit
    systemFee,
    paymongoFee,
    totalFee,
    totalCharge,      // what PayMongo charges
  });
});
