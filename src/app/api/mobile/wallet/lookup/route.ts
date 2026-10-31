import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";

// GET /api/mobile/wallet/lookup?accountNumber=XXXX
export const GET = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const accountNumber = new URL(req.url).searchParams.get("accountNumber");
  if (!accountNumber) return fail("accountNumber is required", 400);

  const wallet = await prisma.wallet.findUnique({
    where: { accountNumber },
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  if (!wallet || wallet.status !== "ACTIVE") return fail("Wallet not found or inactive", 404);

  // Don't reveal if it's the caller's own wallet — just return the name
  return ok({
    accountNumber: wallet.accountNumber,
    accountName: `${wallet.user.firstName} ${wallet.user.lastName}`,
    currency: wallet.currency,
  });
});
