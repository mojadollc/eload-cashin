import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 400);

  await prisma.deviceToken.upsert({
    where: { token: parsed.data.token },
    update: { userId: payload.userId, platform: parsed.data.platform },
    create: { userId: payload.userId, token: parsed.data.token, platform: parsed.data.platform },
  });

  return ok({ message: "Device token registered" });
});

export const DELETE = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const { token } = await req.json().catch(() => ({}));
  if (!token) return fail("Token required", 400);

  await prisma.deviceToken.deleteMany({ where: { token, userId: payload.userId } });
  return ok({ message: "Device token removed" });
});
