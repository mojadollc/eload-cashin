import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { z } from "zod";

const schema = z.object({
  category: z.enum(["WALLET", "ELOAD", "CASHOUT", "ACCOUNT", "OTHER"]),
  subject: z.string().min(5).max(100),
  message: z.string().min(10).max(2000),
});

function generateTicketNumber() {
  return `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export const GET = requireAuth(async (_req: NextRequest, payload: JwtPayload) => {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: payload.userId },
    include: { replies: { orderBy: { createdAt: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ tickets });
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { category, subject, message } = parsed.data;

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: generateTicketNumber(),
      userId: payload.userId,
      category,
      subject,
      replies: { create: { userId: payload.userId, message, isAdmin: false } },
    },
    include: { replies: true },
  });

  return NextResponse.json({ ticket }, { status: 201 });
});
