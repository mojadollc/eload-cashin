import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";

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
  if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  return NextResponse.json(wallet);
});
