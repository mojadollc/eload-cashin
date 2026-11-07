export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `₱${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function maskAccountNumber(account: string): string {
  if (account.length <= 4) return account;
  return "•".repeat(account.length - 4) + account.slice(-4);
}

export function getTransactionIcon(type: string): string {
  const icons: Record<string, string> = {
    WALLET_FUND: "arrow-down-circle",
    ELOAD: "phone-portrait",
    CASHOUT: "arrow-up-circle",
    REFUND: "refresh-circle",
    REVERSAL: "return-up-back",
    ADMIN_ADJUSTMENT: "settings",
    FEE: "receipt",
  };
  return icons[type] || "swap-horizontal";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    SUCCESS: "#34C759",
    PENDING: "#FF9500",
    PROCESSING: "#0066FF",
    FAILED: "#FF3B30",
    REVERSED: "#6B7280",
    REFUNDED: "#00C896",
    CANCELLED: "#6B7280",
  };
  return colors[status] || "#6B7280";
}

export function getNetworkLogo(network: string): string {
  const logos: Record<string, string> = {
    GLOBE: "globe",
    SMART: "smart",
    DITO: "dito",
    TM: "tm",
    TNT: "tnt",
    SUN: "sun",
  };
  return logos[network.toUpperCase()] || "phone-portrait";
}
