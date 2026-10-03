import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { calculateFee } from "@/services/fees/fee.service";
import { FeeService } from "@/types/enums";

export const GET = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  const { searchParams } = new URL(req.url);
  const service = searchParams.get("service") as FeeService;
  const amount = Number(searchParams.get("amount") || 1000);

  if (!service || !Object.values(FeeService).includes(service)) {
    return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  }

  const fee = await calculateFee(service, amount);
  return NextResponse.json({ fee });
});
