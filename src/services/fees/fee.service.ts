import { prisma } from "@/lib/database/prisma";
import { FeeService, FeeType } from "@/types/enums";
import Decimal from "decimal.js";

export async function calculateFee(service: FeeService, amount: number, userTier?: string): Promise<number> {
  const rules = await prisma.feeRule.findMany({
    where: {
      service: service as any,
      isActive: true,
      effectiveFrom: { lte: new Date() },
    },
    orderBy: { userTier: "desc" },
  });

  const applicable = rules.filter(r =>
    (!r.userTier || r.userTier === (userTier || null)) &&
    (!r.effectiveUntil || r.effectiveUntil >= new Date())
  );

  let totalFee = new Decimal(0);

  for (const rule of applicable) {
    if (rule.minAmount && amount < Number(rule.minAmount)) continue;
    if (rule.maxAmount && amount > Number(rule.maxAmount)) continue;

    let fee = new Decimal(0);
    if (rule.feeType === FeeType.FIXED && rule.amount) {
      fee = new Decimal(rule.amount.toString());
    } else if (rule.feeType === FeeType.PERCENTAGE && rule.rate) {
      fee = new Decimal(amount).mul(rule.rate.toString());
      if (rule.minimum && fee.lt(rule.minimum.toString())) fee = new Decimal(rule.minimum.toString());
      if (rule.maximum && fee.gt(rule.maximum.toString())) fee = new Decimal(rule.maximum.toString());
    }
    totalFee = totalFee.add(fee);
  }

  return totalFee.toDecimalPlaces(2).toNumber();
}
