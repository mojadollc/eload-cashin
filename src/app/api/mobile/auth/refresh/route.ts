import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { verifyRefreshToken, signAccessToken } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import { rateLimit } from "@/lib/mobile/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed } = await rateLimit(`refresh:${ip}`, 10, 60);
  if (!allowed) return fail("Too many requests", 429, "RATE_LIMITED");

  const { refreshToken } = await req.json().catch(() => ({}));
  if (!refreshToken) return fail("Refresh token required", 400);

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return fail("Invalid or expired refresh token", 401, "TOKEN_INVALID");
  }

  const session = await prisma.session.findUnique({ where: { token: refreshToken } });
  if (!session || session.expiresAt < new Date()) {
    return fail("Session expired. Please login again.", 401, "SESSION_EXPIRED");
  }

  const accessToken = signAccessToken({ userId: payload.userId, role: payload.role });
  return ok({ accessToken });
}
