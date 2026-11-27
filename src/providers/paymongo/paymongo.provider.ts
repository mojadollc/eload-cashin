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

// ── QR Ph (Dynamic QR) ───────────────────────────────────────────────────────
// PayMongo charges 1.5% per QR Ph transaction — passed through to user
export const QRPH_FEE_RATE = 0.015;

export async function createQRCode(params: { externalId: string; amount: number }) {
  try {
    const { data } = await getClient().post("/sources", {
      data: {
        attributes: {
          amount: Math.round(params.amount * 100),
          currency: "PHP",
          type: "qrph",
          redirect: {
            success: `${process.env.APP_URL}/wallet/fund/return?ref=${params.externalId}`,
            failed: `${process.env.APP_URL}/wallet/fund/return?ref=${params.externalId}&failed=1`,
          },
        },
      },
    });
    return data.data;
  } catch (err: any) {
    const pmError = err?.response?.data?.errors?.[0];
    throw new Error(pmError?.detail || pmError?.code || "PayMongo QR Ph creation failed");
  }
}

export async function getQRCode(sourceId: string) {
  const { data } = await getClient().get(`/sources/${sourceId}`);
  return data.data;
}

// ── Wallet Funding (Checkout Session) ────────────────────────────────────────

export interface CreateCheckoutSessionParams {
  externalId: string;
  amount: number;        // total charge (walletCredit + systemFee + paymongoFee)
  description: string;
  successUrl: string;
  cancelUrl: string;
  // Optional fee breakdown for line items
  walletCredit?: number;
  systemFee?: number;
  paymongoFee?: number;
}

export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
  const lineItems = params.walletCredit !== undefined && params.systemFee !== undefined && params.paymongoFee !== undefined
    ? [
        {
          currency: "PHP",
          amount: Math.round(params.walletCredit * 100),
          name: "Wallet Funding",
          description: `Credit to wallet - ${params.externalId}`,
          quantity: 1,
        },
        ...(params.systemFee > 0 ? [{
          currency: "PHP",
          amount: Math.round(params.systemFee * 100),
          name: "Service Fee",
          description: "CashIn Tap service fee",
          quantity: 1,
        }] : []),
        ...(params.paymongoFee > 0 ? [{
          currency: "PHP",
          amount: Math.round(params.paymongoFee * 100),
          name: "Payment Processing Fee",
          description: "PayMongo processing fee (1.5%)",
          quantity: 1,
        }] : []),
      ]
    : [{
        currency: "PHP",
        amount: Math.round(params.amount * 100),
        description: params.description,
        name: "Wallet Funding",
        quantity: 1,
      }];

  try {
    const { data } = await getClient().post("/checkout_sessions", {
      data: {
        attributes: {
          billing: { name: "CashIn Tap Customer" },
          line_items: lineItems,
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

// ── QR Ph Outbound Send (InstaPay / P2M) ─────────────────────────────────────
// Flat ₱10.00 fee per transfer charged by PayMongo
export const QRPH_SEND_FEE = 10;

export interface SendQRPhParams {
  externalId: string;
  amount: number;       // amount to send (excluding fee)
  qrPayload: string;    // raw QR Ph string scanned by user
  remarks?: string;
}

export async function sendQRPh(params: SendQRPhParams) {
  try {
    const { data } = await getClient().post("/qrph_transfers", {
      data: {
        attributes: {
          amount: Math.round(params.amount * 100),
          currency: "PHP",
          qr_payload: params.qrPayload,
          remarks: params.remarks ?? `CashIn Tap - ${params.externalId}`,
          reference_number: params.externalId,
        },
      },
    });
    return data.data;
  } catch (err: any) {
    const pmError = err?.response?.data?.errors?.[0];
    throw new Error(pmError?.detail || pmError?.code || "PayMongo QR Ph send failed");
  }
}

export async function getQRPhTransfer(transferId: string) {
  const { data } = await getClient().get(`/qrph_transfers/${transferId}`);
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
  // Format: t=<timestamp>,v1=<signature>
  const tPart = sigHeader.split(",").find((p) => p.startsWith("t="));
  const v1Part = sigHeader.split(",").find((p) => p.startsWith("v1="));
  if (!tPart || !v1Part) return false;

  const signature = v1Part.slice(3); // Remove "v1=" prefix to get just the hex signature
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  try {
    // Both are hex strings, compare as buffers
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
