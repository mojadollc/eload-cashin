import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { z } from "zod";
import { initiateEload } from "@/services/eload/eload.service";
import { calculateFee } from "@/services/fees/fee.service";
import { FeeService } from "@/types/enums";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  mobileNumber: z.string().min(10),
  promoId: z.number().optional(),
  productCode: z.string(),
  network: z.string(),
  loadAmount: z.number().positive(),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { mobileNumber, promoId, productCode, network, loadAmount } = parsed.data;

  // Block if wallet has insufficient balance
  const wallet = await prisma.wallet.findUnique({ where: { userId: payload.userId } });
  if (!wallet || wallet.status !== "ACTIVE") return NextResponse.json({ error: "Your wallet is not active." }, { status: 403 });

  const fee = await calculateFee(FeeService.ELOAD, loadAmount);
  const totalRequired = loadAmount + fee;
  if (Number(wallet.availableBalance) < totalRequired)
    return NextResponse.json({ error: `Insufficient balance. You need ${formatCurrency(totalRequired)} but only have ${formatCurrency(Number(wallet.availableBalance))}.` }, { status: 403 });

  try {
    const transaction = await initiateEload(payload.userId, mobileNumber, productCode, network, loadAmount, promoId);
    return NextResponse.json({ transactionNumber: transaction.transactionNumber, status: transaction.status, fee, total: totalRequired });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});
