import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";

export const GET = requireAuth(async (_req: NextRequest, payload: JwtPayload) => {
  const wallet = await prisma.wallet.findUnique({
    where: { userId: payload.userId },
    select: {
      walletId: true,
      accountNumber: true,
      availableBalance: true,
      pendingBalance: true,
      currency: true,
      status: true,
    },
  });
  if (!wallet) return fail("Wallet not found", 404);
  return ok({
    ...wallet,
    availableBalance: wallet.availableBalance.toString(),
    pendingBalance: wallet.pendingBalance.toString(),
  });
});
