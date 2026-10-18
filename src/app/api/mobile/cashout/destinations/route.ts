import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import { z } from "zod";

export const GET = requireAuth(async (_req: NextRequest, payload: JwtPayload) => {
  const destinations = await prisma.cashoutDestination.findMany({
    where: { userId: payload.userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return ok(destinations);
});

const schema = z.object({
  channel: z.string().min(1),
  accountNumber: z.string().min(1),
  accountName: z.string().min(1),
  isDefault: z.boolean().optional(),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 400);

  const { channel, accountNumber, accountName, isDefault } = parsed.data;

  // Limit to 10 saved destinations
  const count = await prisma.cashoutDestination.count({ where: { userId: payload.userId } });
  if (count >= 10) return fail("Maximum 10 saved destinations allowed", 400);

  if (isDefault) {
    await prisma.cashoutDestination.updateMany({
      where: { userId: payload.userId },
      data: { isDefault: false },
    });
  }

  const dest = await prisma.cashoutDestination.create({
    data: { userId: payload.userId, channel, accountNumber, accountName, isDefault: isDefault ?? false },
  });
  return ok(dest, 201);
});
