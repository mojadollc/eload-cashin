import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok } from "@/lib/mobile/response";

export const POST = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  const { refreshToken } = await req.json().catch(() => ({}));
  if (refreshToken) {
    await prisma.session.deleteMany({ where: { token: refreshToken } });
  }
  return ok({ message: "Logged out successfully" });
});
