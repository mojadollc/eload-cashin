import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  pin: z.string().regex(/^\d{6}$/, "PIN must be 6 digits"),
  currentPin: z.string().regex(/^\d{6}$/).optional(),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0].message, 400);

  const existing = await prisma.userPin.findUnique({ where: { userId: payload.userId } });

  if (existing) {
    if (!parsed.data.currentPin) return fail("Current PIN required to change PIN", 400);
    const valid = await bcrypt.compare(parsed.data.currentPin, existing.pinHash);
    if (!valid) return fail("Current PIN is incorrect", 401);
  }

  const pinHash = await bcrypt.hash(parsed.data.pin, 10);

  await prisma.userPin.upsert({
    where: { userId: payload.userId },
    update: { pinHash },
    create: { userId: payload.userId, pinHash },
  });

  return ok({ message: existing ? "PIN updated successfully" : "PIN set successfully" });
});
