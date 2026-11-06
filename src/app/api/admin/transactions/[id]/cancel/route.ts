import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ADMIN_ROLES } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { prisma } from "@/lib/database/prisma";

export const POST = requireAuth(async (_req: NextRequest, _payload: JwtPayload, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const txn = await prisma.transaction.findUnique({ where: { id } });
  if (!txn) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  if (txn.status !== "PENDING" && txn.status !== "PROCESSING")
    return NextResponse.json({ error: "Only PENDING or PROCESSING transactions can be cancelled" }, { status: 400 });

  await prisma.$transaction(async (tx: any) => {
    await tx.transaction.update({
      where: { id },
      data: { status: "CANCELLED", completedAt: new Date() },
    });

    // Release any active holds
    await tx.walletHold.updateMany({
      where: { transactionId: id, status: "ACTIVE" },
      data: { status: "RELEASED" },
    });
  });

  return NextResponse.json({ ok: true });
}, ADMIN_ROLES);
