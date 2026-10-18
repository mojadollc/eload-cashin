import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import { z } from "zod";

export const GET = requireAuth(async (_req: NextRequest, payload: JwtPayload) => {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      userId: true,
      firstName: true,
      lastName: true,
      mobile: true,
      email: true,
      role: true,
      status: true,
      kycStatus: true,
      referralCode: true,
      mobileVerified: true,
      twoFaEnabled: true,
      createdAt: true,
      wallet: {
        select: {
          walletId: true,
          accountNumber: true,
          availableBalance: true,
          pendingBalance: true,
          currency: true,
          status: true,
        },
      },
    },
  });
  if (!user) return fail("User not found", 404);
  return ok(user);
});

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export const PATCH = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.flatten().fieldErrors as any, 400);

  if (parsed.data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: parsed.data.email, NOT: { id: payload.userId } },
    });
    if (existing) return fail("Email already in use", 409);
  }

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data: parsed.data,
    select: { userId: true, firstName: true, lastName: true, email: true, mobile: true },
  });
  return ok(user);
});
