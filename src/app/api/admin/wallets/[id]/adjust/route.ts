import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ADMIN_ROLES } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { z } from "zod";
import { adminAdjustWallet } from "@/services/wallet/wallet.service";
import { EntryType } from "@/types/enums";

const schema = z.object({
  amount: z.number().positive(),
  entryType: z.enum(["CREDIT", "DEBIT"]),
  reason: z.string().min(5),
});

export const POST = requireAuth(async (req: NextRequest, payload: JwtPayload) => {
  const walletId = req.url.split("/api/admin/wallets/")[1].split("/adjust")[0];
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const txn = await adminAdjustWallet(walletId, payload.userId, parsed.data.amount, parsed.data.entryType as EntryType, parsed.data.reason);
    return NextResponse.json(txn);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}, ADMIN_ROLES);
