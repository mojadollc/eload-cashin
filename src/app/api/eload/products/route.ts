import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { getProducts, refreshSkuCache } from "@/providers/gbits/gbits.provider";

export const GET = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  const force = new URL(req.url).searchParams.get("action") === "refresh";

  try {
    const products = await getProducts(force);

    // Group by category → network
    const grouped = products.reduce((acc: Record<string, Record<string, typeof products>>, p) => {
      const cat = p.category || "Telco";
      if (!acc[cat]) acc[cat] = {};
      if (!acc[cat][p.network]) acc[cat][p.network] = [];
      acc[cat][p.network].push(p);
      return acc;
    }, {});

    return NextResponse.json({ grouped, flat: products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch products" }, { status: 500 });
  }
});
