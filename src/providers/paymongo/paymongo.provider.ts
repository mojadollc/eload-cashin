import axios from "axios";
import crypto from "crypto";

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

function getClient() {
  return axios.create({
    baseURL: "https://api.paymongo.com/v1",
    auth: { username: process.env.PAYMONGO_SECRET_KEY!, password: "" },
    headers: { "Content-Type": "application/json" },
  });
}

// ── Wallet Funding ────────────────────────────────────────────────────────────

export interface CreateCheckoutSessionParams {
  externalId: string;
  amount: number;
  description: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
  try {
    const { data } = await getClient().post("/checkout_sessions", {
      data: {
        attributes: {
          billing: { name: "CashIn Tap Customer" },
          line_items: [{
            currency: "PHP",
            amount: Math.round(params.amount * 100),
            description: params.description,
            name: "Wallet Funding",
            quantity: 1,
          }],
          payment_method_types: ["card", "gcash", "grab_pay", "paymaya", "dob", "dob_ubp", "billease", "qrph"],
          success_url: params.successUrl,
          cancel_url: params.cancelUrl,
          reference_number: params.externalId,
          metadata: { transaction_number: params.externalId },
        },
      },
    });
    return data.data;
  } catch (err: any) {
    const pmError = err?.response?.data?.errors?.[0];
    throw new Error(pmError?.detail || pmError?.code || "PayMongo checkout session creation failed");
  }
}

export async function getCheckoutSession(sessionId: string) {
  const { data } = await getClient().get(`/checkout_sessions/${sessionId}`);
  return data.data;
}

// ── Bank Disbursements ────────────────────────────────────────────────────────

export interface CreatePayMongoDisbursementParams {
  externalId: string;
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export async function createPayMongoDisbursement(params: CreatePayMongoDisbursementParams) {
  const bankCode = PAYMONGO_BANK_CODES[params.bankCode.toUpperCase()];
  if (!bankCode) throw new Error(`Unsupported bank channel: ${params.bankCode}`);

  try {
    const { data } = await getClient().post("/disbursements", {
      data: {
        attributes: {
          amount: Math.round(params.amount * 100),
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
  const { data } = await getClient().get(`/disbursements/${disbursementId}`);
  return data.data;
}

// ── Webhook Verification ──────────────────────────────────────────────────────

export function verifyPayMongoWebhook(rawBody: string, sigHeader: string, secret: string): boolean {
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
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
