import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import { z } from "zod";
import { TransactionType, TransactionStatus, Provider, FeeService } from "@/types/enums";
import { generateTransactionNumber, generateIdempotencyKey } from "@/lib/security/generators";
import { calculateFee } from "@/services/fees/fee.service";
import axios from "axios";

// PayMongo rate: 1.5008% (1.5% + tiny rounding buffer)
const PM_RATE = 0.015008;

function calcPaymongoFee(walletCredit: number, systemFee: number): { paymongoFee: number; totalCharge: number; totalCentavos: number } {
  const totalCentavos = Math.ceil(((walletCredit + systemFee) / (1 - PM_RATE)) * 100);
  const totalCharge = totalCentavos / 100;
  const paymongoFee = Math.round((totalCharge - walletCredit - systemFee) * 100) / 100;
  return { paymongoFee, totalCharge, totalCentavos };
}

function getClient() {
  return axios.create({
    baseURL: "https://api.paymongo.com/v1",
    auth: { username: process.env.PAYMONGO_SECRET_KEY!, password: "" },
    headers: { "Content-Type": "application/json" },
  });
}

const schema = z.object({
  amount: z.number().min(100).max(50000),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0].message, 400);

  const wallet = await prisma.wallet.findUnique({ where: { userId: payload.userId } });
  if (!wallet) return fail("Wallet not found", 404);
  if (wallet.status !== "ACTIVE") return fail("Your wallet is not active", 403);

  const { amount } = parsed.data;

  // Server-side fee calculation
  const systemFee = await calculateFee(FeeService.WALLET_FUND, amount);
  const { paymongoFee, totalCharge, totalCentavos } = calcPaymongoFee(amount, systemFee);
  const totalFee = systemFee + paymongoFee;

  const txnNumber = generateTransactionNumber("WALLET_FUND");
  const idempotencyKey = generateIdempotencyKey();

  // Step 1: Create Payment Intent for QR Ph
  let paymentIntent: any;
  try {
    const { data } = await getClient().post("/payment_intents", {
      data: {
        attributes: {
          amount: totalCentavos,
          currency: "PHP",
          payment_method_allowed: ["qrph"],
          capture_type: "automatic",
          description: `CashIn Tap Wallet Funding - ${txnNumber}`,
          metadata: { transaction_number: txnNumber, wallet_credit: amount },
        },
      },
    }, {
      headers: { "Idempotency-Key": idempotencyKey },
    });
    paymentIntent = data.data;
  } catch (err: any) {
    const pmError = err?.response?.data?.errors?.[0];
    return fail(pmError?.detail || pmError?.code || "Failed to create payment intent", 502);
  }

  // Step 2: Attach QR Ph payment method to get the QR image
  let attachedIntent: any;
  try {
    const { data } = await getClient().post(`/payment_intents/${paymentIntent.id}/attach`, {
      data: {
        attributes: {
          payment_method: "qrph",
          return_url: `${process.env.APP_URL}/wallet/fund/return?ref=${txnNumber}`,
        },
      },
    });
    attachedIntent = data.data;
  } catch (err: any) {
    const pmError = err?.response?.data?.errors?.[0];
    return fail(pmError?.detail || pmError?.code || "Failed to attach QR Ph payment method", 502);
  }

  // QR image URL is in next_action.display_details.qr_image or next_action.code.image_url
  const nextAction = attachedIntent.attributes?.next_action;
  const qrImageUrl: string =
    nextAction?.display_details?.qr_image ||
    nextAction?.code?.image_url ||
    nextAction?.qr_code?.image_url ||
    "";

  if (!qrImageUrl) {
    return fail("QR Ph image URL not returned by PayMongo. Ensure QR Ph is enabled on your account.", 502);
  }

  // Step 3: Persist transaction
  const transaction = await prisma.$transaction(async (tx: any) => {
    const txn = await tx.transaction.create({
      data: {
        transactionNumber: txnNumber,
        userId: payload.userId,
        type: TransactionType.WALLET_FUND,
        status: TransactionStatus.PENDING,
        grossAmount: amount,       // credited to wallet on success
        feeAmount: totalFee,
        netAmount: totalCharge,
        provider: Provider.PAYMONGO,
        idempotencyKey,
        metadata: { systemFee, paymongoFee, paymentIntentId: paymentIntent.id },
      },
    });
    await tx.fundingTransaction.create({
      data: {
        transactionId: txn.id,
        paymentMethod: "qrph",
        paymongoLinkId: paymentIntent.id,   // store payment intent ID
        checkoutUrl: qrImageUrl,            // store QR image URL
      },
    });
    await tx.providerTransaction.create({ data: { transactionId: txn.id, provider: Provider.PAYMONGO } });
    return txn;
  });

  return ok({
    transactionNumber: txnNumber,
    referenceId: paymentIntent.id,
    qrImageUrl,
    amount,           // wallet credit
    systemFee,
    paymongoFee,
    totalFee,
    totalAmount: totalCharge,
  });
});
