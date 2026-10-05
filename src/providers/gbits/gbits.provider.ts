const GBITS_API_URL = process.env.GBITS_API_URL || "https://api.gbits.ph";
const GBITS_BUSINESS_ID = process.env.GBITS_BUSINESS_ID!;
const GBITS_BUSINESS_CODE = process.env.GBITS_BUSINESS_CODE!;
const GBITS_USERNAME = process.env.GBITS_USERNAME!;
const GBITS_PASSWORD = process.env.GBITS_PASSWORD!;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

function getTokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    return (payload.exp || 0) * 1000;
  } catch {
    return 0;
  }
}

function isTokenValid(): boolean {
  if (!cachedToken) return false;
  return Date.now() < tokenExpiresAt - 5 * 60 * 1000;
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
  if (!isTokenValid()) await authenticate();
  return cachedToken!;
}

async function gbitsGet(path: string): Promise<any> {
  const token = await getToken();
  const r = await fetch(`${GBITS_API_URL}${path}`, {
    headers: { Authorization: token, Accept: "application/json", "User-Agent": UA },
  });
  if (r.status === 401) {
    cachedToken = null;
    const freshToken = await authenticate();
    const retry = await fetch(`${GBITS_API_URL}${path}`, {
      headers: { Authorization: freshToken, Accept: "application/json", "User-Agent": UA },
    });
    return retry.json();
  }
  return r.json();
}

export interface EloadProduct {
  promoId: number;
  productCode: string;
  network: string;
  service: string;
  name: string;
  amount: number;
  category: string;
  description: string;
  validity: string;
  addressType: string;
  addressMin: number;
  addressMax: number;
}

export interface PurchaseLoadParams {
  promoId?: number;
  mobileNumber: string;
  amount: number;
  externalReference: string;
}

// In-memory SKU cache — refreshed every 5 min or on demand
let skuCache: { products: EloadProduct[]; at: number } | null = null;
const SKU_CACHE_TTL = 5 * 60 * 1000;

function mapSkus(skus: any[]): EloadProduct[] {
  const active = skus.filter(s => s.skuStatus === true);
  return active
    .map(s => ({
      promoId: s.promoId,
      productCode: String(s.promoId),
      network: s.serviceGroup,
      service: s.service,
      name: s.skuName,
      amount: Number(s.amount),
      category: s.category || "Telco",
      description: s.description || "",
      validity: s.validity || "",
      addressType: s.addressType || "PN",
      addressMin: s.addressMin || 11,
      addressMax: s.addressMax || 11,
    }))
    .sort((a, b) => a.amount - b.amount);
}

export async function getProducts(force = false): Promise<EloadProduct[]> {
  if (!force && skuCache && Date.now() - skuCache.at < SKU_CACHE_TTL) {
    return skuCache.products;
  }
  const data = await gbitsGet(`/eload/sku/${GBITS_BUSINESS_ID}`);
  if (data.errorCode !== 0) {
    if (skuCache) return skuCache.products; // return stale on error
    throw new Error(data.message || `GBits errorCode ${data.errorCode}`);
  }
  const products = mapSkus(data.content || []);
  skuCache = { products, at: Date.now() };
  return products;
}

export async function refreshSkuCache(): Promise<{ count: number; refreshedAt: string }> {
  skuCache = null;
  const products = await getProducts(true);
  const refreshedAt = new Date().toISOString();
  return { count: products.length, refreshedAt };
}

export async function purchaseLoad(params: PurchaseLoadParams) {
  const token = await getToken();
  const txnId = `${GBITS_BUSINESS_CODE}${new Date().toISOString().slice(0, 10).replace(/-/g, "")}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const query = new URLSearchParams({ address: params.mobileNumber, transactionId: txnId });
  if (params.promoId) {
    query.append("promoId", String(params.promoId));
  } else {
    query.append("amount", String(params.amount));
  }

  let r = await fetch(`${GBITS_API_URL}/eload/buy?${query.toString()}`, {
    method: "POST",
    headers: { Authorization: token, Accept: "application/json", "User-Agent": UA },
  });
  if (r.status === 401) {
    cachedToken = null;
    const freshToken = await authenticate();
    r = await fetch(`${GBITS_API_URL}/eload/buy?${query.toString()}`, {
      method: "POST",
      headers: { Authorization: freshToken, Accept: "application/json", "User-Agent": UA },
    });
  }
  const result = await r.json();

  if (result.errorCode === 0) {
    return { status: "completed", transaction_id: result.content?.transactionId || txnId, balance: result.content?.balance ?? null };
  }
  if (result.errorCode === 105) {
    return { status: "pending", transaction_id: result.content?.transactionId || txnId, balance: result.content?.balance ?? null };
  }
  throw new Error(result.content?.description || result.message || `GBits error ${result.errorCode}`);
}

export async function checkTransaction(reference: string) {
  const data = await gbitsGet(`/eload/status/${reference}`);
  const raw = (data.content?.status || "").toLowerCase();
  if (["success", "completed", "successful"].includes(raw)) return { status: "completed", txnId: reference };
  if (["failed", "failure", "cancelled", "canceled", "rejected"].includes(raw)) return { status: "failed", error: data.content?.description || data.message };
  return { status: "pending", txnId: reference };
}
