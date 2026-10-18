import { NextRequest, NextResponse } from "next/server";
import { requireAuth, ADMIN_ROLES } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { getProducts, getGbitsBalance, getGbitsTransactions } from "@/providers/gbits/gbits.provider";
import { prisma } from "@/lib/database/prisma";

export const GET = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view"); // "transactions" for txn-only fetch

    if (view === "transactions") {
      const page = Number(searchParams.get("page") || 1);
      const result = await getGbitsTransactions(page, 20);
      return NextResponse.json(result || { transactions: [], total: 0 });
    }

    const [skus, balanceResult, txnResult] = await Promise.allSettled([
      getProducts(true),
      getGbitsBalance(),
      getGbitsTransactions(1, 5),
    ]);

    if (skus.status === "rejected") {
      return NextResponse.json({ error: skus.reason?.message || "Failed to fetch SKUs" }, { status: 502 });
    }

    const allSkus = skus.value.map((s: any) => ({
      promoId: s.promoId,
      name: s.name,
      network: s.network,
      service: s.service,
      category: s.category,
      amount: s.amount,
      description: s.description,
      validity: s.validity,
      addressType: s.addressType,
      addressMin: s.addressMin,
      addressMax: s.addressMax,
      isActive: s.isActive ?? true,
    }));

    const active = allSkus.filter((s: any) => s.isActive);
    const inactive = allSkus.filter((s: any) => !s.isActive);
    const networks = [...new Set(allSkus.map((s: any) => s.network))] as string[];
    const byNetwork = networks.map(net => ({
      network: net,
      active: allSkus.filter((s: any) => s.network === net && s.isActive).length,
      inactive: allSkus.filter((s: any) => s.network === net && !s.isActive).length,
      total: allSkus.filter((s: any) => s.network === net).length,
    })).sort((a, b) => b.total - a.total);

    const balanceInfo = balanceResult.status === "fulfilled" ? balanceResult.value : null;
    const recentTxns = txnResult.status === "fulfilled" ? txnResult.value?.transactions || [] : [];

    return NextResponse.json({
      skus: allSkus,
      stats: {
        total: allSkus.length,
        active: active.length,
        inactive: inactive.length,
        networks: networks.length,
        balance: balanceInfo?.balance ?? null,
        currency: balanceInfo?.currency || "PHP",
        fetchedAt: new Date().toISOString(),
      },
      byNetwork,
      recentTransactions: recentTxns,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "GBits API error" }, { status: 500 });
  }
}, ADMIN_ROLES);
