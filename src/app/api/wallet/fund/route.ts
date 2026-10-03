import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { z } from "zod";
import { TransactionType, TransactionStatus, Provider, FeeService } from "@/types/enums";
import { generateTransactionNumber, generateIdempotencyKey } from "@/lib/security/generators";
import { calculateFee } from "@/services/fees/fee.service";
import { createInvoice } from "@/providers/xendit/xendit.provider";

const schema = z.object({ amount: z.number().min(100).max(50000), paymentMethod: z.string().optional() });

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { amount } = parsed.data;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.userId } });
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
        provider: Provider.XENDIT,
        idempotencyKey: generateIdempotencyKey(),
      },
    });
    await tx.fundingTransaction.create({ data: { transactionId: txn.id, paymentMethod: parsed.data.paymentMethod || "" } });
    await tx.providerTransaction.create({ data: { transactionId: txn.id, provider: Provider.XENDIT } });
    return txn;
  });

  let invoice;
  try {
    invoice = await createInvoice({ externalId: txnNumber, amount: totalAmount, description: `Wallet Funding - ${txnNumber}`, payerEmail: user.email ?? undefined });
  } catch (err: any) {
    await prisma.transaction.update({ where: { id: transaction.id }, data: { status: TransactionStatus.FAILED } });
    return NextResponse.json({ error: err.message || "Payment provider error" }, { status: 502 });
  }

  await prisma.fundingTransaction.update({ where: { transactionId: transaction.id }, data: { xenditInvoiceId: invoice.id, checkoutUrl: invoice.invoice_url, paymentMethod: parsed.data.paymentMethod || "" } });

  return NextResponse.json({ checkoutUrl: invoice.invoice_url, transactionNumber: txnNumber, amount, fee, total: totalAmount });
});
