import { prisma } from "@/lib/database/prisma";
import { TransactionType, TransactionStatus, Provider, FeeService } from "@/types/enums";
import { generateTransactionNumber, generateIdempotencyKey } from "@/lib/security/generators";
import { reserveFunds, releaseHold, consumeHold } from "@/services/wallet/wallet.service";
import { calculateFee } from "@/services/fees/fee.service";
import { sendQRPh, getQRPhTransfer, QRPH_SEND_FEE } from "@/providers/paymongo/paymongo.provider";
import { qrphSendQueue } from "@/workers/queues";

export async function initiateQRPhSend(
  userId: string,
  amount: number,
  qrPayload: string,
  recipientName: string,
  recipientBank: string,
  recipientAccount: string
) {
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
  const markupFee = await calculateFee(FeeService.QRPH_SEND, amount);
  const fee = markupFee + QRPH_SEND_FEE;
  const totalDeduction = amount + fee;

  const transaction = await prisma.$transaction(async (tx: any) => {
    const txn = await tx.transaction.create({
      data: {
        transactionNumber: generateTransactionNumber("QRPH_SEND"),
        userId,
        type: TransactionType.QRPH_SEND,
        status: TransactionStatus.PENDING,
        grossAmount: amount,
        feeAmount: fee,
        netAmount: totalDeduction,
        provider: Provider.PAYMONGO,
        idempotencyKey: generateIdempotencyKey(),
        metadata: { markupFee, providerFee: QRPH_SEND_FEE },
      },
    });
    await tx.qrphSendTransaction.create({
      data: { transactionId: txn.id, qrPayload, recipientName, recipientBank, recipientAccount },
    });
    await tx.providerTransaction.create({ data: { transactionId: txn.id, provider: Provider.PAYMONGO } });
    return txn;
  });

  let hold;
  try {
    hold = await reserveFunds(wallet.id, totalDeduction, transaction.id);
  } catch (err: any) {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: TransactionStatus.CANCELLED, failedAt: new Date() },
    });
    throw new Error(err.message || "Insufficient balance");
  }

  await qrphSendQueue.add("process-qrph-send", { transactionId: transaction.id, holdId: hold.id });
  return { transaction, fee, totalDeduction };
}

export async function processQRPhSend(transactionId: string, holdId: string) {
  const txn = await prisma.transaction.findUniqueOrThrow({
    where: { id: transactionId },
    include: { qrphSendTxn: true },
  });
  if (!txn.qrphSendTxn) throw new Error("QR Ph send transaction not found");

  await prisma.transaction.update({ where: { id: transactionId }, data: { status: TransactionStatus.PROCESSING } });

  try {
    const result = await sendQRPh({
      externalId: txn.transactionNumber,
      amount: Number(txn.grossAmount),
      qrPayload: txn.qrphSendTxn.qrPayload,
    });
    const transferId = result.id;
    const transferStatus = result.attributes?.status || "PENDING";

    await prisma.$transaction(async (tx: any) => {
      await tx.providerTransaction.update({
        where: { transactionId },
        data: { providerTransactionId: transferId, responsePayload: result, status: transferStatus, attemptCount: { increment: 1 }, lastAttemptAt: new Date() },
      });
      await tx.qrphSendTransaction.update({
        where: { transactionId },
        data: { transferId, transferStatus },
      });
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.PROCESSING, providerReference: transferId },
      });
    });

    return { success: true, transferId };
  } catch (error) {
    await releaseHold(holdId);
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.FAILED, failedAt: new Date() },
    });
    return { success: false, error };
  }
}

export async function finalizeQRPhSend(transferId: string, status: string) {
  const qrphTxn = await prisma.qrphSendTransaction.findFirst({
    where: { transferId },
    include: { transaction: true },
  });
  if (!qrphTxn) return;

  const hold = await prisma.walletHold.findFirst({
    where: { transactionId: qrphTxn.transactionId, status: "ACTIVE" },
  });

  if (status === "COMPLETED" || status === "SUCCESS") {
    if (hold) await consumeHold(hold.id, qrphTxn.transactionId, "QR Ph send completed");
    await prisma.$transaction(async (tx: any) => {
      await tx.qrphSendTransaction.update({ where: { transactionId: qrphTxn.transactionId }, data: { transferStatus: "SUCCESS" } });
      await tx.transaction.update({ where: { id: qrphTxn.transactionId }, data: { status: TransactionStatus.SUCCESS, completedAt: new Date() } });
    });
    await prisma.notification.create({
      data: {
        userId: qrphTxn.transaction.userId,
        title: "QR Ph Transfer Successful",
        message: `₱${Number(qrphTxn.transaction.grossAmount).toLocaleString("en-PH", { minimumFractionDigits: 2 })} sent to ${qrphTxn.recipientName} via QR Ph.`,
        type: "CASHOUT",
      },
    });
  } else if (["FAILED", "REVERSED", "REJECTED"].includes(status)) {
    if (hold) await releaseHold(hold.id);
    await prisma.$transaction(async (tx: any) => {
      await tx.qrphSendTransaction.update({ where: { transactionId: qrphTxn.transactionId }, data: { transferStatus: status } });
      await tx.transaction.update({ where: { id: qrphTxn.transactionId }, data: { status: TransactionStatus.FAILED, failedAt: new Date() } });
    });
    await prisma.notification.create({
      data: {
        userId: qrphTxn.transaction.userId,
        title: "QR Ph Transfer Failed",
        message: `Your QR Ph transfer of ₱${Number(qrphTxn.transaction.grossAmount).toLocaleString("en-PH", { minimumFractionDigits: 2 })} to ${qrphTxn.recipientName} was ${status.toLowerCase()}. Your funds have been returned.`,
        type: "CASHOUT",
      },
    });
  }
}
