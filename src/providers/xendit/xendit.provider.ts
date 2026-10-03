import axios from "axios";
import crypto from "crypto";

const xenditClient = axios.create({
  baseURL: "https://api.xendit.co",
  auth: { username: process.env.XENDIT_SECRET_KEY!, password: "" },
  headers: { "Content-Type": "application/json" },
});

export interface CreateInvoiceParams {
  externalId: string;
  amount: number;
  description: string;
  payerEmail?: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
}

export async function createInvoice(params: CreateInvoiceParams) {
  const { data } = await xenditClient.post("/v2/invoices", {
    external_id: params.externalId,
    amount: params.amount,
    description: params.description,
    payer_email: params.payerEmail,
    success_redirect_url: params.successRedirectUrl || `${process.env.APP_URL}/wallet?funded=1`,
    failure_redirect_url: params.failureRedirectUrl || `${process.env.APP_URL}/wallet?failed=1`,
    currency: "PHP",
    payment_methods: [
      "GCASH", "PAYMAYA", "GRABPAY", "SHOPEEPAY",
      "BDO", "BPI", "UNIONBANK", "METROBANK", "CHINABANK", "RCBC", "SECURITY_BANK",
      "7ELEVEN", "CEBUANA", "MLHUILLIER", "PALAWAN", "DP_ECPAY_LOAN",
      "CREDIT_CARD", "DEBIT_CARD",
    ],
  });
  return data;
}

export interface CreateDisbursementParams {
  externalId: string;
  amount: number;
  bankCode: string;
  accountHolderName: string;
  accountNumber: string;
  description: string;
}

export async function createDisbursement(params: CreateDisbursementParams) {
  const { data } = await xenditClient.post("/disbursements", {
    external_id: params.externalId,
    amount: params.amount,
    bank_code: params.bankCode,
    account_holder_name: params.accountHolderName,
    account_number: params.accountNumber,
    description: params.description,
  });
  return data;
}

export async function getDisbursement(disbursementId: string) {
  const { data } = await xenditClient.get(`/disbursements/${disbursementId}`);
  return data;
}

export function verifyXenditWebhook(token: string): boolean {
  return token === process.env.XENDIT_WEBHOOK_TOKEN;
}

export async function getInvoice(invoiceId: string) {
  const { data } = await xenditClient.get(`/v2/invoices/${invoiceId}`);
  return data;
}
