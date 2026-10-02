import { prisma } from "@/lib/database/prisma";
import { EntryType, TransactionType, TransactionStatus, Provider } from "@/types/enums";
import { generateTransactionNumber, generateIdempotencyKey } from "@/lib/security/generators";
import Decimal from "decimal.js";

export async function creditWallet(
  walletId: string,
  amount: number,
  description: string,
  transactionId?: string,
  reference?: string
) {
  return prisma.$transaction(async (tx: any) => {
    const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: walletId } });
    const balanceBefore = new Decimal(wallet.availableBalance.toString());
    const balanceAfter = balanceBefore.add(amount);
    await tx.wallet.update({ where: { id: walletId }, data: { availableBalance: balanceAfter.toNumber() } });
    return tx.walletLedger.create({
      data: { walletId, transactionId, entryType: EntryType.CREDIT, amount, balanceBefore: balanceBefore.toNumber(), balanceAfter: balanceAfter.toNumber(), reference, description },
    });
  });
}

export async function debitWallet(
  walletId: string,
  amount: number,
  description: string,
  transactionId?: string,
  reference?: string
) {
  return prisma.$transaction(async (tx: any) => {
    const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: walletId } });
    const available = new Decimal(wallet.availableBalance.toString());
    if (available.lt(amount)) throw new Error("Insufficient balance");
    const balanceBefore = available;
    const balanceAfter = balanceBefore.sub(amount);
    await tx.wallet.update({ where: { id: walletId }, data: { availableBalance: balanceAfter.toNumber() } });
    return tx.walletLedger.create({
      data: { walletId, transactionId, entryType: EntryType.DEBIT, amount, balanceBefore: balanceBefore.toNumber(), balanceAfter: balanceAfter.toNumber(), reference, description },
    });
  });
}

export async function reserveFunds(walletId: string, amount: number, transactionId: string) {
  return prisma.$transaction(async (tx: any) => {
    const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: walletId } });
    if (new Decimal(wallet.availableBalance.toString()).lt(amount)) throw new Error("Insufficient balance");
    await tx.wallet.update({ where: { id: walletId }, data: { availableBalance: { decrement: amount }, pendingBalance: { increment: amount } } });
    return tx.walletHold.create({ data: { walletId, transactionId, amount, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
  });
}

export async function releaseHold(holdId: string) {
  return prisma.$transaction(async (tx: any) => {
    const hold = await tx.walletHold.findUniqueOrThrow({ where: { id: holdId } });
    if (hold.status !== "ACTIVE") return;
    await tx.walletHold.update({ where: { id: holdId }, data: { status: "RELEASED" } });
    await tx.wallet.update({ where: { id: hold.walletId }, data: { availableBalance: { increment: Number(hold.amount) }, pendingBalance: { decrement: Number(hold.amount) } } });
  });
}

export async function consumeHold(holdId: string, transactionId: string, description: string) {
  return prisma.$transaction(async (tx: any) => {
    const hold = await tx.walletHold.findUniqueOrThrow({ where: { id: holdId } });
    if (hold.status !== "ACTIVE") throw new Error("Hold not active");
    const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: hold.walletId } });
    await tx.walletHold.update({ where: { id: holdId }, data: { status: "CONSUMED" } });
    await tx.wallet.update({ where: { id: hold.walletId }, data: { pendingBalance: { decrement: Number(hold.amount) } } });
    return tx.walletLedger.create({
      data: { walletId: hold.walletId, transactionId, entryType: EntryType.DEBIT, amount: Number(hold.amount), balanceBefore: Number(wallet.availableBalance), balanceAfter: Number(wallet.availableBalance), description },
    });
  });
}

export async function adminAdjustWallet(walletId: string, adminId: string, amount: number, entryType: EntryType, reason: string) {
  return prisma.$transaction(async (tx: any) => {
    const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: walletId } });
    const balanceBefore = new Decimal(wallet.availableBalance.toString());
    const balanceAfter = entryType === EntryType.CREDIT ? balanceBefore.add(amount) : balanceBefore.sub(amount);
    if (balanceAfter.lt(0)) throw new Error("Adjustment would result in negative balance");

    const transaction = await tx.transaction.create({
      data: {
        transactionNumber: generateTransactionNumber("ADMIN_ADJUSTMENT"),
        userId: wallet.userId,
        type: TransactionType.ADMIN_ADJUSTMENT,
        status: TransactionStatus.SUCCESS,
        grossAmount: amount,
        feeAmount: 0,
        netAmount: amount,
        idempotencyKey: generateIdempotencyKey(),
        provider: Provider.SYSTEM,
        completedAt: new Date(),
      },
    });

    await tx.wallet.update({ where: { id: walletId }, data: { availableBalance: balanceAfter.toNumber() } });
    await tx.walletLedger.create({
      data: { walletId, transactionId: transaction.id, entryType, amount, balanceBefore: balanceBefore.toNumber(), balanceAfter: balanceAfter.toNumber(), description: `Admin adjustment: ${reason}` },
    });
    await tx.walletAdjustment.create({ data: { walletId, adminId, amount, entryType, reason } });
    return transaction;
  });
}
