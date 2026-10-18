import axios from "axios";
import crypto from "crypto";

// Our channel key → PayMongo bank code
export const PAYMONGO_BANK_CODES: Record<string, string> = {
  BDO: "bdo",
  BPI: "bpi",
  UBP: "ubp",
  METROBANK: "metrobank",
  LANDBANK: "landbank",
  PNB: "pnb",
  RCBC: "rcbc",
  CHINABANK: "chinabank",
  EASTWEST: "eastwest",
  PSBANK: "psbank",
};

export const PAYMONGO_CHANNELS = new Set(Object.keys(PAYMONGO_BANK_CODES));

const client = axios.create({
  baseURL: "https://api.paymongo.com/v1",
  auth: { username: process.env.PAYMONGO_SECRET_KEY!, password: "" },
  headers: { "Content-Type": "application/json" },
});

// ── Wallet Funding (Payment Links) ──────────────────────────────────────────

export interface CreatePaymentLinkParams {
  externalId: string;
  amount: number; // PHP
  description: string;
  successUrl?: string;
  failureUrl?: string;
}

export async function createPaymentLink(params: CreatePaymentLinkParams) {
  try {
    const { data } = await client.post("/links", {
      data: {
        attributes: {
          amount: Math.round(params.amount * 100), // centavos
          description: params.description,
          remarks: params.externalId,
        },
      },
    });
    return data.data;
  } catch (err: any) {
    const pmError = err?.response?.data?.errors?.[0];
    throw new Error(pmError?.detail || pmError?.code || "PayMongo payment link creation failed");
  }
}

export async function getPaymentLink(linkId: string) {
  const { data } = await client.get(`/links/${linkId}`);
  return data.data;
}

// ── Bank Disbursements (Send Funds) ──────────────────────────────────────────

export interface CreatePayMongoDisbursementParams {
  externalId: string;
  amount: number; // PHP
  bankCode: string; // our channel key e.g. "BPI"
  accountNumber: string;
  accountName: string;
}

export async function createPayMongoDisbursement(params: CreatePayMongoDisbursementParams) {
  const bankCode = PAYMONGO_BANK_CODES[params.bankCode.toUpperCase()];
  if (!bankCode) throw new Error(`Unsupported bank channel: ${params.bankCode}`);

  try {
    const { data } = await client.post("/disbursements", {
      data: {
        attributes: {
          amount: Math.round(params.amount * 100), // centavos
          bank_code: bankCode,
          account_number: params.accountNumber,
          account_name: params.accountName,
          remarks: `CashIn Tap - ${params.externalId}`,
          reference_number: params.externalId,
        },
      },
    });
    return data.data;
  } catch (err: any) {
    const pmError = err?.response?.data?.errors?.[0];
    throw new Error(pmError?.detail || pmError?.code || "PayMongo disbursement failed");
  }
}

export async function getPayMongoDisbursement(disbursementId: string) {
  const { data } = await client.get(`/disbursements/${disbursementId}`);
  return data.data;
}

// ── Webhook Management ───────────────────────────────────────────────────────

export async function createPayMongoWebhook(url: string) {
  try {
    const { data } = await client.post("/webhooks", {
      data: {
        attributes: {
          url,
          events: [
            "payment.paid",
            "payment.failed",
            "link.payment.paid",
            "disbursement.paid",
            "disbursement.failed",
          ],
        },
      },
    });
    return data.data;
  } catch (err: any) {
    const pmError = err?.response?.data?.errors?.[0];
    throw new Error(pmError?.detail || pmError?.code || "Failed to create PayMongo webhook");
  }
}

export async function listPayMongoWebhooks() {
  try {
    const { data } = await client.get("/webhooks");
    return data.data as any[];
  } catch (err: any) {
    const pmError = err?.response?.data?.errors?.[0];
    throw new Error(pmError?.detail || pmError?.code || "Failed to list PayMongo webhooks");
  }
}

export async function deletePayMongoWebhook(webhookId: string) {
  try {
    const { data } = await client.delete(`/webhooks/${webhookId}`);
    return data.data;
  } catch (err: any) {
    const pmError = err?.response?.data?.errors?.[0];
    throw new Error(pmError?.detail || pmError?.code || "Failed to delete PayMongo webhook");
  }
}

export async function enablePayMongoWebhook(webhookId: string) {
  try {
    const { data } = await client.post(`/webhooks/${webhookId}/enable`);
    return data.data;
  } catch (err: any) {
    const pmError = err?.response?.data?.errors?.[0];
    throw new Error(pmError?.detail || pmError?.code || "Failed to enable PayMongo webhook");
  }
}

// ── Webhook Verification ─────────────────────────────────────────────────────

export function verifyPayMongoWebhook(rawBody: string, sigHeader: string): boolean {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET!;
  const tPart = sigHeader.split(",").find((p) => p.startsWith("t="));
  const v1Part = sigHeader.split(",").find((p) => p.startsWith("v1="));
  if (!tPart || !v1Part) return false;

  const timestamp = tPart.slice(2);
  const signature = v1Part.slice(3);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

// Our channel key → PayMongo bank code
export const PAYMONGO_BANK_CODES: Record<string, string> = {
  BDO: "bdo",
  BPI: "bpi",
  UBP: "ubp",
  METROBANK: "metrobank",
  LANDBANK: "landbank",
  PNB: "pnb",
  RCBC: "rcbc",
  CHINABANK: "chinabank",
  EASTWEST: "eastwest",
  PSBANK: "psbank",
};

export const PAYMONGO_CHANNELS = new Set(Object.keys(PAYMONGO_BANK_CODES));

const client = axios.create({
  baseURL: "https://api.paymongo.com/v1",
  auth: { username: process.env.PAYMONGO_SECRET_KEY!, password: "" },
  headers: { "Content-Type": "application/json" },
});

export interface CreatePayMongoDisbursementParams {
  externalId: string;
  amount: number; // PHP
  bankCode: string; // our channel key e.g. "BPI"
  accountNumber: string;
  accountName: string;
}

export async function createPayMongoDisbursement(params: CreatePayMongoDisbursementParams) {
  const bankCode = PAYMONGO_BANK_CODES[params.bankCode.toUpperCase()];
  if (!bankCode) throw new Error(`Unsupported bank channel: ${params.bankCode}`);

  try {
    const { data } = await client.post("/disbursements", {
      data: {
        attributes: {
          amount: Math.round(params.amount * 100), // centavos
          bank_code: bankCode,
          account_number: params.accountNumber,
          account_name: params.accountName,
          remarks: `CashIn Tap - ${params.externalId}`,
          reference_number: params.externalId,
        },
      },
    });
    return data.data;
  } catch (err: any) {
    const pmError = err?.response?.data?.errors?.[0];
    throw new Error(pmError?.detail || pmError?.code || "PayMongo disbursement failed");
  }
}

export async function getPayMongoDisbursement(disbursementId: string) {
  const { data } = await client.get(`/disbursements/${disbursementId}`);
  return data.data;
}

export async function createPayMongoWebhook(url: string) {
  try {
    const { data } = await client.post("/webhooks", {
      data: {
        attributes: {
          url,
          events: [
            "disbursement.paid",
            "disbursement.failed",
          ],
        },
      },
    });
    return data.data;
  } catch (err: any) {
    const pmError = err?.response?.data?.errors?.[0];
    throw new Error(pmError?.detail || pmError?.code || "Failed to create PayMongo webhook");
  }
}

export async function listPayMongoWebhooks() {
  try {
    const { data } = await client.get("/webhooks");
    return data.data as any[];
  } catch (err: any) {
    const pmError = err?.response?.data?.errors?.[0];
    throw new Error(pmError?.detail || pmError?.code || "Failed to list PayMongo webhooks");
  }
}

export async function deletePayMongoWebhook(webhookId: string) {
  try {
    const { data } = await client.delete(`/webhooks/${webhookId}`);
    return data.data;
  } catch (err: any) {
    const pmError = err?.response?.data?.errors?.[0];
    throw new Error(pmError?.detail || pmError?.code || "Failed to delete PayMongo webhook");
  }
}

export async function enablePayMongoWebhook(webhookId: string) {
  try {
    const { data } = await client.post(`/webhooks/${webhookId}/enable`);
    return data.data;
  } catch (err: any) {
    const pmError = err?.response?.data?.errors?.[0];
    throw new Error(pmError?.detail || pmError?.code || "Failed to enable PayMongo webhook");
  }
}

export function verifyPayMongoWebhook(rawBody: string, sigHeader: string): boolean {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET!;
  const tPart = sigHeader.split(",").find((p) => p.startsWith("t="));
  const v1Part = sigHeader.split(",").find((p) => p.startsWith("v1="));
  if (!tPart || !v1Part) return false;

  const timestamp = tPart.slice(2);
  const signature = v1Part.slice(3);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}
