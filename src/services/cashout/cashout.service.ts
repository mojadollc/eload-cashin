import { prisma } from "@/lib/database/prisma";
import { TransactionType, TransactionStatus, Provider, FeeService } from "@/types/enums";
import { generateTransactionNumber, generateIdempotencyKey } from "@/lib/security/generators";
import { reserveFunds, releaseHold, consumeHold } from "@/services/wallet/wallet.service";
import { calculateFee } from "@/services/fees/fee.service";
import { createDisbursement } from "@/providers/xendit/xendit.provider";
import { cashoutQueue } from "@/workers/queues";

export async function initiateCashout(userId: string, amount: number, channel: string, accountNumber: string, accountName: string) {
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
  const fee = await calculateFee(FeeService.CASHOUT, amount);
  const totalDeduction = amount + fee;

  const transaction = await prisma.$transaction(async (tx: any) => {
    const txn = await tx.transaction.create({
      data: {
        transactionNumber: generateTransactionNumber("CASHOUT"),
        userId,
        type: TransactionType.CASHOUT,
        status: TransactionStatus.PENDING,
        grossAmount: amount,
        feeAmount: fee,
        netAmount: totalDeduction,
        provider: Provider.XENDIT,
        idempotencyKey: generateIdempotencyKey(),
      },
    });
    await tx.cashoutTransaction.create({ data: { transactionId: txn.id, channel, accountNumber, accountName } });
    await tx.providerTransaction.create({ data: { transactionId: txn.id, provider: Provider.XENDIT } });
    return txn;
  });

  const hold = await reserveFunds(wallet.id, totalDeduction, transaction.id);
  await cashoutQueue.add("process-cashout", { transactionId: transaction.id, holdId: hold.id });
  return transaction;
}

export async function processCashout(transactionId: string, holdId: string) {
  const txn = await prisma.transaction.findUniqueOrThrow({ where: { id: transactionId }, include: { cashoutTxn: true } });
  if (!txn.cashoutTxn) throw new Error("Cashout transaction not found");

  await prisma.transaction.update({ where: { id: transactionId }, data: { status: TransactionStatus.PROCESSING } });

  try {
    const result = await createDisbursement({
      externalId: txn.transactionNumber,
      amount: Number(txn.grossAmount),
      bankCode: txn.cashoutTxn.channel,
      accountHolderName: txn.cashoutTxn.accountName,
      accountNumber: txn.cashoutTxn.accountNumber,
      description: `CashIn Tap Cash Out - ${txn.transactionNumber}`,
    });

    await prisma.$transaction(async (tx: any) => {
      await tx.providerTransaction.update({ where: { transactionId }, data: { providerTransactionId: result.id, responsePayload: result, status: result.status, attemptCount: { increment: 1 }, lastAttemptAt: new Date() } });
      await tx.cashoutTransaction.update({ where: { transactionId }, data: { disbursementId: result.id, cashoutStatus: "PROCESSING" } });
      await tx.transaction.update({ where: { id: transactionId }, data: { status: TransactionStatus.PROCESSING, providerReference: result.id } });
    });

    return { success: true, disbursementId: result.id };
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

  if (status === "COMPLETED") {
    if (hold) await consumeHold(hold.id, cashoutTxn.transactionId, "Cash Out completed");
    await prisma.$transaction(async (tx: any) => {
      await tx.cashoutTransaction.update({ where: { transactionId: cashoutTxn.transactionId }, data: { cashoutStatus: "SUCCESS" } });
      await tx.transaction.update({ where: { id: cashoutTxn.transactionId }, data: { status: TransactionStatus.SUCCESS, completedAt: new Date() } });
    });
  } else if (["FAILED", "REVERSED", "REJECTED"].includes(status)) {
    if (hold) await releaseHold(hold.id);
    await prisma.$transaction(async (tx: any) => {
      await tx.cashoutTransaction.update({ where: { transactionId: cashoutTxn.transactionId }, data: { cashoutStatus: status as any } });
      await tx.transaction.update({ where: { id: cashoutTxn.transactionId }, data: { status: TransactionStatus.FAILED, failedAt: new Date() } });
    });
  }
}
