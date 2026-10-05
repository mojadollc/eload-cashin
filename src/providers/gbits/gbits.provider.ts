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

import { prisma } from "@/lib/database/prisma";

function mapSkus(skus: any[]): EloadProduct[] {
  return skus
    .filter(s => s.skuStatus === true)
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

async function syncToDb(products: EloadProduct[]): Promise<void> {
  // Mark all existing GBITS products inactive, then upsert active ones
  await prisma.eloadProduct.updateMany({ where: { provider: "GBITS" }, data: { isActive: false } });
  await Promise.all(
    products.map(p =>
      prisma.eloadProduct.upsert({
        where: { promoId: p.promoId },
        update: {
          network: p.network, service: p.service, name: p.name,
          amount: p.amount, category: p.category, description: p.description,
          validity: p.validity, addressType: p.addressType,
          addressMin: p.addressMin, addressMax: p.addressMax, isActive: true,
        },
        create: {
          provider: "GBITS", promoId: p.promoId, productCode: p.productCode,
          network: p.network, service: p.service, name: p.name,
          amount: p.amount, category: p.category, description: p.description,
          validity: p.validity, addressType: p.addressType,
          addressMin: p.addressMin, addressMax: p.addressMax, isActive: true,
        },
      })
    )
  );
}

function dbToProduct(r: any): EloadProduct {
  return {
    promoId: r.promoId ?? 0,
    productCode: r.productCode,
    network: r.network,
    service: r.service || "",
    name: r.name,
    amount: Number(r.amount),
    category: r.category,
    description: r.description || "",
    validity: r.validity || "",
    addressType: r.addressType || "PN",
    addressMin: r.addressMin || 11,
    addressMax: r.addressMax || 11,
  };
}

export async function getProducts(force = false): Promise<EloadProduct[]> {
  if (!force) {
    const rows = await prisma.eloadProduct.findMany({
      where: { provider: "GBITS", isActive: true },
      orderBy: { amount: "asc" },
    });
    if (rows.length > 0) return rows.map(dbToProduct);
  }
  // DB empty or forced — fetch from GBits and sync
  const data = await gbitsGet(`/eload/sku/${GBITS_BUSINESS_ID}`);
  if (data.errorCode !== 0) {
    // On error fall back to whatever is in DB
    const rows = await prisma.eloadProduct.findMany({
      where: { provider: "GBITS", isActive: true },
      orderBy: { amount: "asc" },
    });
    if (rows.length > 0) return rows.map(dbToProduct);
    throw new Error(data.message || `GBits errorCode ${data.errorCode}`);
  }
  const products = mapSkus(data.content || []);
  await syncToDb(products);
  return products;
}

export async function refreshSkuCache(): Promise<{ count: number; refreshedAt: string }> {
  const products = await getProducts(true);
  return { count: products.length, refreshedAt: new Date().toISOString() };
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
