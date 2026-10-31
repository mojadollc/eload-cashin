import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ok, fail } from "@/lib/mobile/response";
import { calculateFee } from "@/services/fees/fee.service";
import { FeeService } from "@/types/enums";

// GET /api/mobile/fees?service=ELOAD&amount=100
export const GET = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  const { searchParams } = new URL(req.url);
  const service = searchParams.get("service") as FeeService;
  const amount = Number(searchParams.get("amount") || 0);

  if (!service || !Object.values(FeeService).includes(service))
    return fail("Invalid service. Valid values: " + Object.values(FeeService).join(", "), 400);

  if (!amount || amount <= 0) return fail("amount must be a positive number", 400);

  const fee = await calculateFee(service, amount);
  const total = service === FeeService.CASHOUT ? amount + fee + 10 : amount + fee;

  return ok({ service, amount, fee, total });
});
