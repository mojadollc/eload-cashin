import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload, signAccessToken } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import { rateLimit } from "@/lib/mobile/rate-limit";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({ pin: z.string().regex(/^\d{6}$/) });

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const { allowed } = await rateLimit(`pin:${payload.userId}`, 5, 60);
  if (!allowed) return fail("Too many PIN attempts. Try again in a minute.", 429, "RATE_LIMITED");

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Invalid PIN format", 400);

  const record = await prisma.userPin.findUnique({ where: { userId: payload.userId } });
  if (!record) return fail("PIN not set. Please set a PIN first.", 404);

  const valid = await bcrypt.compare(parsed.data.pin, record.pinHash);
  if (!valid) return fail("Incorrect PIN", 401, "PIN_INVALID");

  const accessToken = signAccessToken({ userId: payload.userId, role: payload.role });
  return ok({ accessToken, verified: true });
});
