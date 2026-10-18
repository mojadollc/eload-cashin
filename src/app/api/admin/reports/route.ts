import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuth, ADMIN_ROLES } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";

const PAYMONGO_DISBURSEMENT_FEE = 10;

export const GET = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "today";

  // Derive current date in PHT (UTC+8)
  const nowUtc = new Date();
  const phtOffset = 8 * 60 * 60 * 1000;
  const now = new Date(nowUtc.getTime() + phtOffset);
  // PHT midnight as UTC
  const phtMidnight = (y: number, m: number, d: number) =>
    new Date(Date.UTC(y, m, d) - phtOffset);

  const from =
    range === "today" ? phtMidnight(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) :
    range === "week"  ? new Date(nowUtc.getTime() - 7 * 86400000) :
    range === "month" ? phtMidnight(now.getUTCFullYear(), now.getUTCMonth(), 1) :
    phtMidnight(now.getUTCFullYear(), 0, 1);

  // Build chart buckets
  const buckets: { label: string; from: Date; to: Date }[] = [];
  if (range === "today") {
    for (let h = 0; h < 24; h++) {
      const f = new Date(phtMidnight(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()).getTime() + h * 3600000);
      const t = new Date(f.getTime() + 3600000);
      buckets.push({ label: `${String(h).padStart(2, "0")}:00`, from: f, to: t });
    }
  } else if (range === "week") {
    for (let d = 6; d >= 0; d--) {
      const dayUtc = new Date(nowUtc.getTime() - d * 86400000);
      const dayPht = new Date(dayUtc.getTime() + phtOffset);
      const f = phtMidnight(dayPht.getUTCFullYear(), dayPht.getUTCMonth(), dayPht.getUTCDate());
      const t = new Date(f.getTime() + 86400000);
      buckets.push({ label: f.toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric" }), from: f, to: t });
    }
  } else if (range === "month") {
    const days = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
    for (let d = 1; d <= days; d++) {
      const f = phtMidnight(now.getUTCFullYear(), now.getUTCMonth(), d);
      const t = new Date(f.getTime() + 86400000);
      buckets.push({ label: `${d}`, from: f, to: t });
    }
  } else {
    for (let m = 0; m < 12; m++) {
      const f = phtMidnight(now.getUTCFullYear(), m, 1);
      const t = phtMidnight(now.getUTCFullYear(), m + 1, 1);
      buckets.push({ label: f.toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short" }), from: f, to: t });
    }
  }

  // Fetch all SUCCESS transactions in range with type + amounts
  const txnsForChart = await prisma.transaction.findMany({
    where: { status: "SUCCESS", createdAt: { gte: from } },
    select: { type: true, grossAmount: true, feeAmount: true, createdAt: true },
  });

  const chartData = buckets.map(({ label, from: bf, to: bt }) => {
    const slice = txnsForChart.filter(t => t.createdAt >= bf && t.createdAt < bt);
    const fundFee    = slice.filter(t => t.type === "WALLET_FUND").reduce((s, t) => s + Number(t.feeAmount), 0);
    const eloadFee   = slice.filter(t => t.type === "ELOAD").reduce((s, t) => s + Number(t.feeAmount), 0);
    const cashoutTxns = slice.filter(t => t.type === "CASHOUT");
    const cashoutGrossFee = cashoutTxns.reduce((s, t) => s + Number(t.feeAmount), 0);
    const cashoutNet = Math.max(0, cashoutGrossFee - cashoutTxns.length * PAYMONGO_DISBURSEMENT_FEE);
    const revenue = fundFee + eloadFee + cashoutNet;
    const volume  = slice.reduce((s, t) => s + Number(t.grossAmount), 0);
    const count   = slice.length;
    return { label, revenue, volume, count };
  });

  const [
    totalUsers,
    activeUsers,
    pendingTxns,
    failedTxns,
    byType,
    transferCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.count({ where: { status: "PENDING" } }),
    prisma.transaction.count({ where: { status: "FAILED", createdAt: { gte: from } } }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { status: "SUCCESS", createdAt: { gte: from } },
      _sum: { feeAmount: true, grossAmount: true },
      _count: { id: true },
    }),
    // Free wallet-to-wallet transfers (CASHIN_TAP channel)
    prisma.cashoutTransaction.count({
      where: { channel: "CASHIN_TAP", transaction: { status: "SUCCESS", createdAt: { gte: from } } },
    }),
  ]);

  // Build per-type breakdown
  const typeMap: Record<string, { volume: number; fee: number; count: number }> = {};
  for (const r of byType) {
    typeMap[r.type] = {
      volume: Number(r._sum?.grossAmount || 0),
      fee: Number(r._sum?.feeAmount || 0),
      count: r._count.id,
    };
  }

  const walletFundVolume  = typeMap["WALLET_FUND"]?.volume ?? 0;
  const walletFundFee     = typeMap["WALLET_FUND"]?.fee ?? 0;
  const walletFundCount   = typeMap["WALLET_FUND"]?.count ?? 0;

  const eloadVolume       = typeMap["ELOAD"]?.volume ?? 0;
  const eloadFee          = typeMap["ELOAD"]?.fee ?? 0;
  const eloadCount        = typeMap["ELOAD"]?.count ?? 0;

  const cashoutVolume     = typeMap["CASHOUT"]?.volume ?? 0;
  const cashoutFee        = typeMap["CASHOUT"]?.fee ?? 0;
  const cashoutCount      = (typeMap["CASHOUT"]?.count ?? 0) - transferCount; // exclude free transfers
  const cashoutRevenue    = Math.max(0, cashoutFee - (cashoutCount * PAYMONGO_DISBURSEMENT_FEE));

  const totalVolume       = walletFundVolume + eloadVolume + cashoutVolume;
  const totalTransactions = walletFundCount + eloadCount + cashoutCount + transferCount;

  // Revenue = what we actually earn (after provider costs)
  const totalRevenue = walletFundFee + eloadFee + cashoutRevenue;

  const revenueByType = [
    { type: "WALLET_FUND", volume: walletFundVolume, fee: walletFundFee, revenue: walletFundFee, count: walletFundCount },
    { type: "ELOAD",       volume: eloadVolume,      fee: eloadFee,      revenue: eloadFee,      count: eloadCount },
    { type: "CASHOUT",     volume: cashoutVolume,    fee: cashoutFee,    revenue: cashoutRevenue, count: cashoutCount,
      providerCost: cashoutCount * PAYMONGO_DISBURSEMENT_FEE },
    { type: "TRANSFER",    volume: typeMap["CASHOUT"]?.volume ? 0 : 0, fee: 0, revenue: 0, count: transferCount },
  ].filter(r => r.count > 0 || r.type === "WALLET_FUND");

  return NextResponse.json({
    totalUsers,
    activeUsers,
    pendingTxns,
    failedTxns,
    totalVolume,
    totalTransactions,
    totalRevenue,
    walletFundVolume, walletFundFee, walletFundCount,
    eloadVolume, eloadFee, eloadCount,
    cashoutVolume, cashoutFee, cashoutRevenue, cashoutCount,
    transferCount,
    revenueByType,
    chartData,
  });
}, ADMIN_ROLES);
