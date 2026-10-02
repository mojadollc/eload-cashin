import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth, ADMIN_ROLES } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { z } from "zod";

export const GET = requireAuth(async (_req: NextRequest, _payload: JwtPayload) => {
  const rules = await prisma.feeRule.findMany({ orderBy: [{ service: "asc" }, { feeType: "asc" }] });
  return NextResponse.json(rules);
}, ADMIN_ROLES);

const schema = z.object({
  service: z.enum(["WALLET_FUND", "ELOAD", "CASHOUT"]),
  feeType: z.enum(["FIXED", "PERCENTAGE"]),
  amount: z.number().optional(),
  rate: z.number().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  userTier: z.string().optional(),
});

export const POST = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const rule = await prisma.feeRule.create({ data: parsed.data as any });
  return NextResponse.json(rule);
}, ADMIN_ROLES);
