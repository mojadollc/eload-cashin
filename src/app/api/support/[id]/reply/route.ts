import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { z } from "zod";

const schema = z.object({ message: z.string().min(1).max(2000) });

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload, ctx: any) => {
  const { id } = ctx.params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const ticket = await prisma.supportTicket.findFirst({
    where: { id, userId: payload.userId },
  });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (ticket.status === "CLOSED") return NextResponse.json({ error: "Ticket is closed" }, { status: 400 });

  const [reply] = await prisma.$transaction([
    prisma.ticketReply.create({
      data: { ticketId: id, userId: payload.userId, message: parsed.data.message, isAdmin: false },
    }),
    prisma.supportTicket.update({
      where: { id },
      data: { status: "OPEN", updatedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ reply });
});
