import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";

export const GET = requireAuth(async (_req: NextRequest, payload: JwtPayload, ctx: any) => {
  const { id } = await ctx.params;

  const txn = await prisma.transaction.findFirst({
    where: { transactionNumber: id, userId: payload.userId },
    include: { eloadTxn: true, cashoutTxn: true, fundingTxn: true },
  });
  if (!txn) return fail("Transaction not found", 404);

  return ok({
    ...txn,
    grossAmount: txn.grossAmount.toString(),
    feeAmount: txn.feeAmount.toString(),
    netAmount: txn.netAmount.toString(),
  });
});
