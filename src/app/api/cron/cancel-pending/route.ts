import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

// Auto-cancel PENDING transactions older than 30 minutes
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (process.env.NODE_ENV === "production" && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 30 * 60 * 1000);

  const result = await prisma.transaction.updateMany({
    where: {
      status: "PENDING",
      createdAt: { lt: cutoff },
      type: { in: ["WALLET_FUND", "CASHOUT", "ELOAD"] },
    },
    data: { status: "CANCELLED", updatedAt: new Date() },
  });

  // Release holds for cancelled transactions
  const cancelled = await prisma.transaction.findMany({
    where: { status: "CANCELLED", type: "CASHOUT" },
    select: { id: true },
  });

  if (cancelled.length > 0) {
    await prisma.walletHold.updateMany({
      where: { transactionId: { in: cancelled.map(t => t.id) }, status: "ACTIVE" },
      data: { status: "RELEASED" },
    });
  }

  return NextResponse.json({ cancelled: result.count, at: new Date().toISOString() });
}
