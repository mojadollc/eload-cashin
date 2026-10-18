import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import { rateLimit } from "@/lib/mobile/rate-limit";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain uppercase, lowercase, and a number"
  ),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed } = await rateLimit(`chgpwd:${ip}:${payload.userId}`, 5, 300);
  if (!allowed) return fail("Too many attempts. Try again later.", 429, "RATE_LIMITED");

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0].message, 400);

  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { passwordHash: true } });
  if (!user) return fail("User not found", 404);

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return fail("Current password is incorrect", 401);

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: payload.userId }, data: { passwordHash } });

  // Invalidate all sessions to force re-login on other devices
  await prisma.session.deleteMany({ where: { userId: payload.userId } });

  return ok({ message: "Password changed successfully. Please login again on other devices." });
});
