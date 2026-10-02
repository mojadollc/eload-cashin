// Re-export Prisma enums for use across the app
export { $Enums } from "@prisma/client";

export const EntryType = { CREDIT: "CREDIT", DEBIT: "DEBIT" } as const;
export type EntryType = "CREDIT" | "DEBIT";

export const TransactionType = {
  WALLET_FUND: "WALLET_FUND",
  ELOAD: "ELOAD",
  CASHOUT: "CASHOUT",
  REFUND: "REFUND",
  REVERSAL: "REVERSAL",
  ADMIN_ADJUSTMENT: "ADMIN_ADJUSTMENT",
  FEE: "FEE",
} as const;
export type TransactionType = keyof typeof TransactionType;

export const TransactionStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REVERSED: "REVERSED",
  REFUNDED: "REFUNDED",
} as const;
export type TransactionStatus = keyof typeof TransactionStatus;

export const Provider = { XENDIT: "XENDIT", GBITS: "GBITS", SYSTEM: "SYSTEM" } as const;
export type Provider = keyof typeof Provider;

export const FeeService = { WALLET_FUND: "WALLET_FUND", ELOAD: "ELOAD", CASHOUT: "CASHOUT" } as const;
export type FeeService = keyof typeof FeeService;

export const FeeType = { FIXED: "FIXED", PERCENTAGE: "PERCENTAGE" } as const;
export type FeeType = keyof typeof FeeType;

export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  FINANCE: "FINANCE",
  SUPPORT: "SUPPORT",
  USER: "USER",
} as const;
export type UserRole = keyof typeof UserRole;
