import { prisma } from "@/lib/database/prisma";
import { TransactionType, TransactionStatus, Provider, FeeService } from "@/types/enums";
import { generateTransactionNumber, generateIdempotencyKey } from "@/lib/security/generators";
import { reserveFunds, releaseHold, consumeHold } from "@/services/wallet/wallet.service";
import { calculateFee } from "@/services/fees/fee.service";
import { purchaseLoad } from "@/providers/gbits/gbits.provider";
import { eloadQueue } from "@/workers/queues";

export async function initiateEload(userId: string, mobileNumber: string, productCode: string, network: string, loadAmount: number, promoId?: number) {
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
  const fee = await calculateFee(FeeService.ELOAD, loadAmount);
  const totalAmount = loadAmount + fee;

  const transaction = await prisma.$transaction(async (tx: any) => {
    const txn = await tx.transaction.create({
      data: {
        transactionNumber: generateTransactionNumber("ELOAD"),
        userId,
        type: TransactionType.ELOAD,
        status: TransactionStatus.PENDING,
        grossAmount: loadAmount,
        feeAmount: fee,
        netAmount: totalAmount,
        provider: Provider.GBITS,
        idempotencyKey: generateIdempotencyKey(),
        metadata: { mobileNumber, productCode, network, promoId },
      },
    });
    await tx.eloadTransaction.create({ data: { transactionId: txn.id, mobileNumber, network, productCode, loadAmount } });
    await tx.providerTransaction.create({ data: { transactionId: txn.id, provider: Provider.GBITS } });
    return txn;
  });

  let hold;
  try {
    hold = await reserveFunds(wallet.id, totalAmount, transaction.id);
  } catch (err: any) {
    await prisma.transaction.update({ where: { id: transaction.id }, data: { status: TransactionStatus.CANCELLED, failedAt: new Date() } });
    throw new Error(err.message || "Insufficient balance");
  }
  await eloadQueue.add("process-eload", { transactionId: transaction.id, holdId: hold.id });
  return transaction;
}

export async function processEload(transactionId: string, holdId: string) {
  const txn = await prisma.transaction.findUniqueOrThrow({ where: { id: transactionId }, include: { eloadTxn: true } });
  if (!txn.eloadTxn) throw new Error("Eload transaction not found");

  await prisma.transaction.update({ where: { id: transactionId }, data: { status: TransactionStatus.PROCESSING } });

  try {
    const result = await purchaseLoad({ promoId: (txn.metadata as any)?.promoId, mobileNumber: txn.eloadTxn.mobileNumber, productCode: txn.eloadTxn.productCode, amount: Number(txn.eloadTxn.loadAmount), externalReference: txn.transactionNumber });

    await prisma.$transaction(async (tx: any) => {
      await tx.providerTransaction.update({ where: { transactionId }, data: { providerTransactionId: result.transaction_id, responsePayload: result, status: result.status, attemptCount: { increment: 1 }, lastAttemptAt: new Date() } });
      await tx.eloadTransaction.update({ where: { transactionId }, data: { providerRef: result.transaction_id, providerStatus: result.status } });
      await tx.transaction.update({ where: { id: transactionId }, data: { status: TransactionStatus.SUCCESS, completedAt: new Date(), providerReference: result.transaction_id } });
    });

    await consumeHold(holdId, transactionId, `E-load: ${txn.eloadTxn.network} ₱${txn.eloadTxn.loadAmount}`);
    return { success: true };
  } catch (error) {
    await releaseHold(holdId);
    await prisma.transaction.update({ where: { id: transactionId }, data: { status: TransactionStatus.FAILED, failedAt: new Date() } });
    return { success: false, error };
  }
}
