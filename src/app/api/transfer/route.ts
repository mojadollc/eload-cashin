import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { z } from "zod";
import { debitWallet, creditWallet } from "@/services/wallet/wallet.service";
import { TransactionType, TransactionStatus, Provider } from "@/types/enums";
import { generateTransactionNumber, generateIdempotencyKey } from "@/lib/security/generators";
import Decimal from "decimal.js";

const schema = z.object({
  accountNumber: z.string().min(1),
  amount: z.number().min(1),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { accountNumber, amount } = parsed.data;

  const senderWallet = await prisma.wallet.findUnique({ where: { userId: payload.userId }, include: { user: true } });
  if (!senderWallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  if (senderWallet.status !== "ACTIVE") return NextResponse.json({ error: "Your wallet is not active" }, { status: 403 });
  if (Number(senderWallet.availableBalance) <= 0) return NextResponse.json({ error: "Insufficient balance. Please fund your wallet first." }, { status: 403 });

  if (senderWallet.accountNumber === accountNumber)
    return NextResponse.json({ error: "Cannot transfer to your own wallet" }, { status: 400 });

  const recipientWallet = await prisma.wallet.findUnique({ where: { accountNumber }, include: { user: true } });
  if (!recipientWallet) return NextResponse.json({ error: "Recipient wallet not found. Check the account number." }, { status: 404 });
  if (recipientWallet.status !== "ACTIVE") return NextResponse.json({ error: "Recipient wallet is not active" }, { status: 400 });

  if (new Decimal(senderWallet.availableBalance.toString()).lt(amount))
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

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
        metadata: { transferTo: accountNumber, recipientName: `${recipientWallet.user.firstName} ${recipientWallet.user.lastName}` },
      },
    });
    await tx.cashoutTransaction.create({
      data: { transactionId: created.id, channel: "CASHIN_TAP", accountNumber, accountName: `${recipientWallet.user.firstName} ${recipientWallet.user.lastName}` },
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

  return NextResponse.json({
    transactionNumber: txnNumber,
    recipientName: `${recipientWallet.user.firstName} ${recipientWallet.user.lastName}`,
    amount,
  });
});
