import axios from "axios";

const gbitsClient = axios.create({
  baseURL: process.env.GBITS_API_URL,
  headers: { "Content-Type": "application/json" },
});

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const { data } = await gbitsClient.post("/api/login", {
    business_id: process.env.GBITS_BUSINESS_ID,
    business_code: process.env.GBITS_BUSINESS_CODE,
    username: process.env.GBITS_USERNAME,
    password: process.env.GBITS_PASSWORD,
  });

  cachedToken = data.token || data.access_token || data.data?.token;
  tokenExpiry = Date.now() + 50 * 60 * 1000; // 50 min
  return cachedToken!;
}

async function authHeaders() {
  const token = await getToken();
  return { Authorization: `Bearer ${token}` };
}

export interface EloadProduct {
  productCode: string;
  network: string;
  name: string;
  amount: number;
  category?: string;
  description?: string;
}

export interface PurchaseLoadParams {
  mobileNumber: string;
  productCode: string;
  externalReference: string;
}

export async function getProducts(): Promise<EloadProduct[]> {
  const headers = await authHeaders();
  const { data } = await gbitsClient.get("/api/products", { headers });
  const raw = data.products || data.data || data || [];
  return raw.map((p: any) => ({
    productCode: p.product_code || p.productCode || p.code,
    network: p.network || p.telco || p.provider,
    name: p.name || p.product_name,
    amount: Number(p.amount || p.price || p.face_value),
    category: p.category || "Telco",
    description: p.description || p.validity || "",
  }));
}

export async function purchaseLoad(params: PurchaseLoadParams) {
  const headers = await authHeaders();
  const { data } = await gbitsClient.post("/api/load/purchase", {
    business_id: process.env.GBITS_BUSINESS_ID,
    mobile: params.mobileNumber,
    product_code: params.productCode,
    reference: params.externalReference,
  }, { headers });
  return data;
}

export async function checkTransaction(reference: string) {
  const headers = await authHeaders();
  const { data } = await gbitsClient.get(`/api/transactions/${reference}`, { headers });
  return data;
}

export async function getBalance() {
  const headers = await authHeaders();
  const { data } = await gbitsClient.get("/api/balance", { headers });
  return data;
}
