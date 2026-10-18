import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import crypto from "crypto";

export const GET = requireAuth(async (_req: NextRequest, payload: JwtPayload) => {
  const wallet = await prisma.wallet.findUnique({
    where: { userId: payload.userId },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  if (!wallet) return fail("Wallet not found", 404);
  if (wallet.status !== "ACTIVE") return fail("Wallet is not active", 403);

  const qrData = {
    accountNumber: wallet.accountNumber,
    accountName: `${wallet.user.firstName} ${wallet.user.lastName}`,
    currency: wallet.currency,
    issuedAt: Date.now(),
  };

  // HMAC signature so the receiver can verify the QR wasn't tampered with
  const signature = crypto
    .createHmac("sha256", process.env.JWT_SECRET!)
    .update(JSON.stringify(qrData))
    .digest("hex");

  return ok({ qrData, signature });
});
