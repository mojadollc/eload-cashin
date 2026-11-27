import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { calculateFee } from "@/services/fees/fee.service";
import { FeeService } from "@/types/enums";

export const GET = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  const { searchParams } = new URL(req.url);
  const service = searchParams.get("service") as FeeService | null;
  const amount = Number(searchParams.get("amount") || 0);

  // If service + amount provided, return calculated fee
  if (service && amount > 0) {
    if (!Object.values(FeeService).includes(service)) {
      return NextResponse.json({ error: "Invalid service" }, { status: 400 });
    }
    const fee = await calculateFee(service, amount);
    return NextResponse.json({ fee, service, amount });
  }

  // Otherwise return all active fee rules grouped by service
  const rules = await prisma.feeRule.findMany({
    where: { isActive: true },
    orderBy: [{ service: "asc" }, { feeType: "asc" }],
  });

  const grouped = Object.values(FeeService).reduce((acc, svc) => {
    acc[svc] = rules.filter(r => r.service === svc);
    return acc;
  }, {} as Record<string, typeof rules>);

  return NextResponse.json({ rules, grouped });
});
