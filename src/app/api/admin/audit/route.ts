import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth, ADMIN_ROLES } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";

export const GET = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || undefined;
  const adminId = searchParams.get("adminId") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const where = {
    ...(action ? { action: { contains: action } } : {}),
    ...(adminId ? { adminId } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { userId: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) });
}, ADMIN_ROLES);
