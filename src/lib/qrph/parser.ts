// QRPh / EMVCo QR Code parser
// Parses TLV (Tag-Length-Value) format used by GCash, Maya, and all BSP-compliant QR codes

export interface QRPhData {
  accountName: string;
  accountNumber: string;
  channel: string;
  amount?: number;
  merchantName?: string;
  city?: string;
  raw: string;
}

function parseTLV(data: string): Map<string, string> {
  const map = new Map<string, string>();
  let i = 0;
  while (i < data.length) {
    if (i + 4 > data.length) break;
    const tag = data.slice(i, i + 2);
    const len = parseInt(data.slice(i + 2, i + 4), 10);
    if (isNaN(len)) break;
    const value = data.slice(i + 4, i + 4 + len);
    map.set(tag, value);
    i += 4 + len;
  }
  return map;
}

function detectChannel(raw: string, merchantInfo: string): string {
  const upper = (raw + merchantInfo).toUpperCase();
  if (upper.includes("GCASH") || upper.includes("A000000632010109")) return "GCASH";
  if (upper.includes("MAYA") || upper.includes("PAYMAYA") || upper.includes("A000000632010105")) return "PAYMAYA";
  if (upper.includes("GRABPAY") || upper.includes("A000000632010108")) return "GRABPAY";
  if (upper.includes("SHOPEEPAY") || upper.includes("A000000632010107")) return "SHOPEEPAY";
  if (upper.includes("BPI") || upper.includes("A000000632010103")) return "BPI";
  if (upper.includes("BDO") || upper.includes("A000000632010102")) return "BDO";
  if (upper.includes("UNIONBANK") || upper.includes("UBP") || upper.includes("A000000632010106")) return "UNIONBANK";
  if (upper.includes("METROBANK") || upper.includes("A000000632010104")) return "METROBANK";
  if (upper.includes("LANDBANK") || upper.includes("A000000632010110")) return "LANDBANK";
  if (upper.includes("PNB") || upper.includes("A000000632010111")) return "PNB";
  return "INSTAPAY";
}

function extractAccountNumber(merchantInfo: string): string {
  const sub = parseTLV(merchantInfo);
  const acct = sub.get("02") || sub.get("03") || sub.get("04") || "";
  return acct.replace(/^\+63/, "0").trim();
}

export function parseQRPh(raw: string): QRPhData | null {
  try {
    const data = raw.trim();
    const tlv = parseTLV(data);

    let merchantInfo = "";
    let channel = "INSTAPAY";
    let accountNumber = "";

    for (let tag = 26; tag <= 51; tag++) {
      const tagStr = tag.toString().padStart(2, "0");
      const val = tlv.get(tagStr);
      if (val) {
        merchantInfo = val;
        channel = detectChannel(data, val);
        accountNumber = extractAccountNumber(val);
        if (accountNumber) break;
      }
    }

    const amountStr = tlv.get("54");
    const amount = amountStr ? parseFloat(amountStr) : undefined;
    const merchantName = tlv.get("59")?.trim() || "";
    const city = tlv.get("60")?.trim() || "";

    if (!accountNumber) {
      const mobileMatch = data.match(/(?:0|\+63)(9\d{9})/);
      if (mobileMatch) accountNumber = "0" + mobileMatch[1];
    }

    if (!accountNumber && !merchantName) return null;

    return { accountName: merchantName, accountNumber, channel, amount, merchantName, city, raw };
  } catch {
    return null;
  }
}

export const CHANNEL_LABELS: Record<string, string> = {
  GCASH: "GCash", PAYMAYA: "Maya", GRABPAY: "GrabPay", SHOPEEPAY: "ShopeePay",
  BPI: "BPI", BDO: "BDO", UNIONBANK: "UnionBank", METROBANK: "Metrobank",
  LANDBANK: "Landbank", PNB: "PNB", INSTAPAY: "InstaPay",
};

export const CHANNEL_COLORS: Record<string, string> = {
  GCASH: "#007DFE", PAYMAYA: "#6366F1", GRABPAY: "#00B14F", SHOPEEPAY: "#EE4D2D",
  BPI: "#CC0000", BDO: "#003087", UNIONBANK: "#E31837", METROBANK: "#003087",
  LANDBANK: "#006400", PNB: "#003087", INSTAPAY: "#038E80",
};
