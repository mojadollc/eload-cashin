import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export function generateUserId(sequence: number) {
  return `USR-${String(sequence).padStart(7, "0")}`;
}

export function generateWalletId(sequence: number) {
  return `WAL-${String(sequence).padStart(7, "0")}`;
}

export function generateAccountNumber() {
  return `88${Math.floor(10000000 + Math.random() * 90000000)}`;
}

export function generateReferralCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export function generateTransactionNumber(type: string) {
  const prefix: Record<string, string> = {
    WALLET_FUND: "WF",
    ELOAD: "EL",
    CASHOUT: "CO",
    REFUND: "RF",
    REVERSAL: "RV",
    ADMIN_ADJUSTMENT: "AA",
    FEE: "FE",
  };
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const seq = String(Math.floor(Math.random() * 999999)).padStart(6, "0");
  return `${prefix[type] || "TX"}-${date}-${seq}`;
}

export function generateIdempotencyKey() {
  return uuidv4();
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
