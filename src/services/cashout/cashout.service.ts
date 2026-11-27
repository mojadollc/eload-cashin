import { prisma } from "@/lib/database/prisma";
import { TransactionType, TransactionStatus, Provider, FeeService } from "@/types/enums";
import Decimal from "decimal.js";
import { generateTransactionNumber, generateIdempotencyKey } from "@/lib/security/generators";
import { releaseHold, consumeHold } from "@/services/wallet/wallet.service";
import { calculateFee } from "@/services/fees/fee.service";
import { createPayMongoDisbursement } from "@/providers/paymongo/paymongo.provider";
import { cashoutQueue } from "@/workers/queues";

const PAYMONGO_DISBURSEMENT_FEE = 10;

export async function initiateCashout(userId: string, amount: number, channel: string, accountNumber: string, accountName: string, idempotencyKey?: string) {
  const markupFee = await calculateFee(FeeService.CASHOUT, amount);
  const fee = markupFee + PAYMONGO_DISBURSEMENT_FEE;
  const totalDeduction = amount + fee;
  const provider = Provider.PAYMONGO;
  const txnIdempotencyKey = idempotencyKey ?? generateIdempotencyKey();

  const { transaction, hold } = await prisma.$transaction(async (tx: any) => {
    const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
    if (new Decimal(wallet.availableBalance.toString()).lt(totalDeduction))
      throw new Error("Insufficient balance");

    const txn = await tx.transaction.create({
      data: {
        transactionNumber: generateTransactionNumber("CASHOUT"),
        userId,
        type: TransactionType.CASHOUT,
        status: TransactionStatus.PENDING,
        grossAmount: amount,
        feeAmount: fee,
        netAmount: totalDeduction,
        provider,
        idempotencyKey: txnIdempotencyKey,
      },
    });
    await tx.cashoutTransaction.create({ data: { transactionId: txn.id, channel, accountNumber, accountName } });
    await tx.providerTransaction.create({ data: { transactionId: txn.id, provider } });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { availableBalance: { decrement: totalDeduction }, pendingBalance: { increment: totalDeduction } },
    });
    const h = await tx.walletHold.create({
      data: { walletId: wallet.id, transactionId: txn.id, amount: totalDeduction, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
    });

    return { transaction: txn, hold: h };
  });

  await cashoutQueue.add("process-cashout", { transactionId: transaction.id, holdId: hold.id });
  return { transaction, fee, totalDeduction };
}

export async function processCashout(transactionId: string, holdId: string) {
  const txn = await prisma.transaction.findUniqueOrThrow({ where: { id: transactionId }, include: { cashoutTxn: true } });
  if (!txn.cashoutTxn) throw new Error("Cashout transaction not found");

  await prisma.transaction.update({ where: { id: transactionId }, data: { status: TransactionStatus.PROCESSING } });

  try {
    const result = await createPayMongoDisbursement({
      externalId: txn.transactionNumber,
      amount: Number(txn.grossAmount),
      bankCode: txn.cashoutTxn.channel,
      accountNumber: txn.cashoutTxn.accountNumber,
      accountName: txn.cashoutTxn.accountName,
    });
    const resultId = result.id;
    // PayMongo disbursement status on creation is inside attributes
    const resultStatus = result.attributes?.status || result.status || "PENDING";

    await prisma.$transaction(async (tx: any) => {
      await tx.providerTransaction.update({ where: { transactionId }, data: { providerTransactionId: resultId, responsePayload: result, status: resultStatus, attemptCount: { increment: 1 }, lastAttemptAt: new Date() } });
      await tx.cashoutTransaction.update({ where: { transactionId }, data: { disbursementId: resultId, cashoutStatus: "PROCESSING" } });
      await tx.transaction.update({ where: { id: transactionId }, data: { status: TransactionStatus.PROCESSING, providerReference: resultId } });
    });

    return { success: true, disbursementId: resultId };
  } catch (error) {
    await releaseHold(holdId);
    await prisma.transaction.update({ where: { id: transactionId }, data: { status: TransactionStatus.FAILED, failedAt: new Date() } });
    return { success: false, error };
  }
}

export async function finalizeCashout(disbursementId: string, status: string) {
  const cashoutTxn = await prisma.cashoutTransaction.findFirst({ where: { disbursementId }, include: { transaction: true } });
  if (!cashoutTxn) return;

  const hold = await prisma.walletHold.findFirst({ where: { transactionId: cashoutTxn.transactionId, status: "ACTIVE" } });

  if (status === "COMPLETED" || status === "SUCCESS") {
    if (hold) await consumeHold(hold.id, cashoutTxn.transactionId, "Cash Out completed");
    await prisma.$transaction(async (tx: any) => {
      await tx.cashoutTransaction.update({ where: { transactionId: cashoutTxn.transactionId }, data: { cashoutStatus: "SUCCESS" } });
      await tx.transaction.update({ where: { id: cashoutTxn.transactionId }, data: { status: TransactionStatus.SUCCESS, completedAt: new Date() } });
    });
    await prisma.notification.create({
      data: {
        userId: cashoutTxn.transaction.userId,
        title: "Cash Out Successful",
        message: `₱${Number(cashoutTxn.transaction.grossAmount).toLocaleString("en-PH", { minimumFractionDigits: 2 })} has been sent to ${cashoutTxn.accountName}.`,
        type: "CASHOUT",
      },
    });
  } else if (["FAILED", "REVERSED", "REJECTED"].includes(status)) {
    if (hold) await releaseHold(hold.id);
    await prisma.$transaction(async (tx: any) => {
      await tx.cashoutTransaction.update({ where: { transactionId: cashoutTxn.transactionId }, data: { cashoutStatus: status as any } });
      await tx.transaction.update({ where: { id: cashoutTxn.transactionId }, data: { status: TransactionStatus.FAILED, failedAt: new Date() } });
    });
    await prisma.notification.create({
      data: {
        userId: cashoutTxn.transaction.userId,
        title: "Cash Out Failed",
        message: `Your cash out of ₱${Number(cashoutTxn.transaction.grossAmount).toLocaleString("en-PH", { minimumFractionDigits: 2 })} was ${status.toLowerCase()}. Your funds have been returned.`,
        type: "CASHOUT",
      },
    });
  }
}
