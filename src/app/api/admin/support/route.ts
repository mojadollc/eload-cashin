import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth, ADMIN_ROLES } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";

export const GET = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const category = searchParams.get("category") || undefined;

  const tickets = await prisma.supportTicket.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(category ? { category: category as any } : {}),
    },
    include: {
      user: { select: { firstName: true, lastName: true, mobile: true, userId: true } },
      replies: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ tickets });
}, ADMIN_ROLES);
