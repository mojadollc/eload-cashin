import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { JwtPayload } from "@/lib/auth/jwt";
import { ADMIN_ROLES } from "@/lib/auth/middleware";

const GBITS_API_URL = process.env.GBITS_API_URL || "https://api.gbits.ph";
const GBITS_BUSINESS_ID = process.env.GBITS_BUSINESS_ID!;
const GBITS_USERNAME = process.env.GBITS_USERNAME!;
const GBITS_PASSWORD = process.env.GBITS_PASSWORD!;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

function getTokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    return (payload.exp || 0) * 1000;
  } catch { return 0; }
}

async function authenticate(): Promise<string> {
  const r = await fetch(`${GBITS_API_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": UA },
    body: JSON.stringify({ username: GBITS_USERNAME, password: GBITS_PASSWORD }),
  });
  const data = await r.json();
  if (data.errorCode !== 0) throw new Error(data.message || "GBits auth failed");
  cachedToken = data.content.accessToken;
  tokenExpiresAt = getTokenExpiry(cachedToken!);
  return cachedToken!;
}

async function getToken(): Promise<string> {
  if (!cachedToken || Date.now() >= tokenExpiresAt - 5 * 60 * 1000) await authenticate();
  return cachedToken!;
}

async function gbitsGet(path: string): Promise<any> {
  const token = await getToken();
  const r = await fetch(`${GBITS_API_URL}${path}`, {
    headers: { Authorization: token, Accept: "application/json", "User-Agent": UA },
  });
  if (r.status === 401) {
    cachedToken = null;
    const fresh = await authenticate();
    return (await fetch(`${GBITS_API_URL}${path}`, {
      headers: { Authorization: fresh, Accept: "application/json", "User-Agent": UA },
    })).json();
  }
  return r.json();
}

export const GET = requireAuth(async (req: NextRequest, _payload: JwtPayload) => {
  try {
    const [skuData, balanceData] = await Promise.allSettled([
      gbitsGet(`/eload/sku/${GBITS_BUSINESS_ID}`),
      gbitsGet("/balance"),
    ]);

    if (skuData.status === "rejected") {
      return NextResponse.json({ error: skuData.reason?.message || "Failed to fetch SKUs" }, { status: 502 });
    }

    const raw = skuData.value;
    if (raw.errorCode !== 0) {
      return NextResponse.json({ error: raw.message || `GBits errorCode ${raw.errorCode}` }, { status: 502 });
    }

    const allSkus = raw.content || [];
    const skus = allSkus.map((s: any) => ({
      promoId: s.promoId,
      name: s.skuName,
      network: s.serviceGroup,
      service: s.service,
      category: s.category,
      amount: Number(s.amount),
      description: s.description || "",
      validity: s.validity || "",
      addressType: s.addressType,
      addressMin: s.addressMin,
      addressMax: s.addressMax,
      isActive: s.skuStatus === true,
    }));

    // Stats
    const active = skus.filter((s: any) => s.isActive);
    const inactive = skus.filter((s: any) => !s.isActive);
    const networks = [...new Set(skus.map((s: any) => s.network))] as string[];
    const byNetwork = networks.map(net => ({
      network: net,
      active: skus.filter((s: any) => s.network === net && s.isActive).length,
      inactive: skus.filter((s: any) => s.network === net && !s.isActive).length,
      total: skus.filter((s: any) => s.network === net).length,
    })).sort((a, b) => b.total - a.total);

    const balance = balanceData.status === "fulfilled" && balanceData.value?.errorCode === 0
      ? balanceData.value?.content?.balance ?? null
      : null;

    return NextResponse.json({
      skus,
      stats: {
        total: skus.length,
        active: active.length,
        inactive: inactive.length,
        networks: networks.length,
        balance,
        fetchedAt: new Date().toISOString(),
      },
      byNetwork,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "GBits API error" }, { status: 500 });
  }
}, ADMIN_ROLES);
