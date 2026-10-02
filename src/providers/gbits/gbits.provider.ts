import axios from "axios";

const gbitsClient = axios.create({
  baseURL: process.env.GBITS_API_URL,
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.GBITS_API_KEY,
  },
});

export interface EloadProduct {
  productCode: string;
  network: string;
  name: string;
  amount: number;
}

export interface PurchaseLoadParams {
  mobileNumber: string;
  productCode: string;
  externalReference: string;
}

export async function getProducts(): Promise<EloadProduct[]> {
  const { data } = await gbitsClient.get("/products");
  return data.products || [];
}

export async function purchaseLoad(params: PurchaseLoadParams) {
  const { data } = await gbitsClient.post("/load/purchase", {
    mobile: params.mobileNumber,
    product_code: params.productCode,
    reference: params.externalReference,
  });
  return data;
}

export async function checkTransaction(reference: string) {
  const { data } = await gbitsClient.get(`/transactions/${reference}`);
  return data;
}

export async function getBalance() {
  const { data } = await gbitsClient.get("/balance");
  return data;
}
