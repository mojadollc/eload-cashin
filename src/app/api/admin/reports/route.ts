import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth, ADMIN_ROLES } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";

export const GET = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "today";
  const now = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const from =
    range === "today" ? startOf(now) :
    range === "week" ? new Date(now.getTime() - 7 * 86400000) :
    range === "month" ? new Date(now.getFullYear(), now.getMonth(), 1) :
    new Date(searchParams.get("from") || now);

  const [totalUsers, activeUsers, pendingTxns, failedTxns, volumeData, revenueData] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.count({ where: { status: "PENDING" } }),
    prisma.transaction.count({ where: { status: "FAILED", createdAt: { gte: from } } }),
    prisma.transaction.aggregate({
      where: { status: "SUCCESS", createdAt: { gte: from } },
      _sum: { grossAmount: true, netAmount: true },
      _count: true,
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { status: "SUCCESS", createdAt: { gte: from } },
      _sum: { feeAmount: true, grossAmount: true },
    }),
  ]);

  const totalRevenue = revenueData.reduce((sum: number, r: any) => sum + Number(r._sum?.feeAmount || 0), 0);

  return NextResponse.json({
    totalUsers, activeUsers, pendingTxns, failedTxns,
    totalVolume: volumeData._sum.grossAmount || 0,
    totalTransactions: volumeData._count,
    revenueByType: revenueData,
    totalRevenue,
  });
}, ADMIN_ROLES);
