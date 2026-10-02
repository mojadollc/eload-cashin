import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { z } from "zod";
import { initiateEload } from "@/services/eload/eload.service";
import { calculateFee } from "@/services/fees/fee.service";
import { FeeService } from "@/types/enums";
import { prisma } from "@/lib/database/prisma";

const schema = z.object({
  mobileNumber: z.string().regex(/^09\d{9}$/),
  productCode: z.string(),
  network: z.string(),
  loadAmount: z.number().positive(),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { mobileNumber, productCode, network, loadAmount } = parsed.data;
  const product = await prisma.eloadProduct.findFirst({ where: { productCode, isActive: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  try {
    const transaction = await initiateEload(payload.userId, mobileNumber, productCode, network, loadAmount);
    const fee = await calculateFee(FeeService.ELOAD, loadAmount);
    return NextResponse.json({ transactionNumber: transaction.transactionNumber, status: transaction.status, fee, total: loadAmount + fee });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});
