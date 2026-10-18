import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok } from "@/lib/mobile/response";

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const { ids } = await req.json().catch(() => ({}));

  await prisma.notification.updateMany({
    where: {
      userId: payload.userId,
      ...(Array.isArray(ids) && ids.length ? { id: { in: ids } } : {}),
    },
    data: { read: true },
  });

  return ok({ message: "Notifications marked as read" });
});
