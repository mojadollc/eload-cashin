import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { z } from "zod";
import { TransactionType, TransactionStatus, Provider, FeeService } from "@/types/enums";
import { generateTransactionNumber, generateIdempotencyKey } from "@/lib/security/generators";
import { calculateFee } from "@/services/fees/fee.service";
import { createQRCode, QRPH_FEE_RATE } from "@/providers/paymongo/paymongo.provider";

const schema = z.object({ amount: z.number().min(100).max(50000) });

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const wallet = await prisma.wallet.findUnique({ where: { userId: payload.userId } });
  if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  if (wallet.status !== "ACTIVE") return NextResponse.json({ error: "Your wallet is not active" }, { status: 403 });

  const { amount } = parsed.data;

  // App service fee (from fee rules)
  const appFee = await calculateFee(FeeService.WALLET_FUND, amount);

  // PayMongo QR Ph fee: 1.5% of the amount the user wants credited
  const qrphFee = Math.ceil(amount * QRPH_FEE_RATE * 100) / 100;

  // Total fee charged to user = app fee + QR Ph provider fee
  const totalFee = appFee + qrphFee;

  // Total user pays = desired credit amount + all fees
  const totalCharge = amount + totalFee;

  const txnNumber = generateTransactionNumber("WALLET_FUND");

  const transaction = await prisma.$transaction(async (tx: any) => {
    const txn = await tx.transaction.create({
      data: {
        transactionNumber: txnNumber,
        userId: payload.userId,
        type: TransactionType.WALLET_FUND,
        status: TransactionStatus.PENDING,
        grossAmount: amount,       // amount credited to wallet on success
        feeAmount: totalFee,       // total fee (app + qrph)
        netAmount: totalCharge,    // what user actually pays
        provider: Provider.PAYMONGO,
        idempotencyKey: generateIdempotencyKey(),
        metadata: { qrphFee, appFee },
      },
    });
    await tx.fundingTransaction.create({ data: { transactionId: txn.id, paymentMethod: "qrph" } });
    await tx.providerTransaction.create({ data: { transactionId: txn.id, provider: Provider.PAYMONGO } });
    return txn;
  });

  let source: any;
  try {
    // QR is generated for totalCharge — what the user scans and pays
    source = await createQRCode({ externalId: txnNumber, amount: totalCharge });
  } catch (err: any) {
    await prisma.transaction.update({ where: { id: transaction.id }, data: { status: TransactionStatus.FAILED } });
    return NextResponse.json({ error: err.message || "Payment provider error" }, { status: 502 });
  }

  const qrData: string = source.attributes?.qr_code_url || source.attributes?.qr_image || "";
  const sourceId: string = source.id || "";

  await prisma.fundingTransaction.update({
    where: { transactionId: transaction.id },
    data: {
      paymongoLinkId: sourceId,   // reuse field for QR source ID
      checkoutUrl: qrData,        // reuse field for QR image/data URL
      paymentMethod: "qrph",
    },
  });

  return NextResponse.json({
    transactionNumber: txnNumber,
    qrData,
    sourceId,
    amount,
    appFee,
    qrphFee,
    totalFee,
    totalCharge,
  });
});
