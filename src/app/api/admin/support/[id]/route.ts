import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth, ADMIN_ROLES } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { z } from "zod";

const schema = z.object({
  message: z.string().min(1).max(2000).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload, ctx: any) => {
  const { id } = ctx.params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const { message, status } = parsed.data;

  await prisma.$transaction(async (tx: any) => {
    if (message) {
      await tx.ticketReply.create({
        data: { ticketId: id, userId: payload.userId, message, isAdmin: true },
      });
    }
    await tx.supportTicket.update({
      where: { id },
      data: {
        status: status ?? (message ? "IN_PROGRESS" : undefined),
        updatedAt: new Date(),
      },
    });
  });

  // Notify user
  if (message) {
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        title: "Support Reply",
        message: `Your ticket "${ticket.subject}" has a new reply from support.`,
        type: "SUPPORT",
      },
    });
  }

  return NextResponse.json({ ok: true });
}, ADMIN_ROLES);
