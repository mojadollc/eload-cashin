import { NextRequest } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok } from "@/lib/mobile/response";

export const GET = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "1";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));

  const where: any = {
    userId: payload.userId,
    ...(unreadOnly ? { read: false } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: payload.userId, read: false } }),
  ]);

  return ok({ notifications, total, page, pages: Math.ceil(total / limit), limit, unreadCount });
});
