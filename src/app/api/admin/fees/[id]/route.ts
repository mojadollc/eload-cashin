import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth, ADMIN_ROLES } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";

export const PUT = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  const id = req.url.split("/").pop()!;
  const body = await req.json();
  const rule = await prisma.feeRule.update({
    where: { id },
    data: {
      feeType: body.feeType,
      amount: body.amount ?? null,
      rate: body.rate ?? null,
      minimum: body.minimum ?? null,
      maximum: body.maximum ?? null,
      isActive: body.isActive ?? true,
    },
  });
  return NextResponse.json(rule);
}, ADMIN_ROLES);

export const DELETE = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  const id = req.url.split("/").pop()!;
  await prisma.feeRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}, ADMIN_ROLES);
