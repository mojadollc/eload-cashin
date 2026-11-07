import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth, ADMIN_ROLES } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";

export const GET = requireAuth(async (_req: NextRequest, _payload: JwtPayload, ctx: any) => {
  const { id } = await ctx.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      wallet: {
        include: {
          ledgerEntries: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      },
      transactions: {
        include: { eloadTxn: true, cashoutTxn: true, fundingTxn: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      kycDocuments: { orderBy: { createdAt: "desc" } },
      sessions: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { transactions: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Strip sensitive fields
  const { passwordHash, twoFaSecret, ...safeUser } = user as any;
  return NextResponse.json({ user: safeUser });
}, ADMIN_ROLES);

export const PATCH = requireAuth(async (req: NextRequest, payload: JwtPayload, ctx: any) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const { status, kycStatus } = body;

  const data: any = {};
  if (status) data.status = status;
  if (kycStatus) data.kycStatus = kycStatus;

  if (!Object.keys(data).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const user = await prisma.user.update({ where: { id }, data });

  await prisma.auditLog.create({
    data: {
      adminId: payload.userId,
      action: "UPDATE_USER",
      entity: "User",
      entityId: id,
      details: data,
    },
  });

  return NextResponse.json({ user });
}, ADMIN_ROLES);
