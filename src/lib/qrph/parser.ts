// QRPh / EMVCo TLV parser
// EMVCo spec: Tag(2) + Length(2) + Value
// Tags 26-51: Merchant Account Info (each contains sub-TLVs)
//   Sub-tag 00: GUID / AID
//   Sub-tag 01: Merchant ID (sometimes account number)
//   Sub-tag 02: Account number / mobile number
//   Sub-tag 03: Account number (alternate)
// Tag 54: Transaction Amount
// Tag 58: Country Code
// Tag 59: Merchant Name
// Tag 60: Merchant City

export interface QRPhData {
  accountName: string;
  accountNumber: string;
  channel: string;
  amount?: number;
  merchantName?: string;
  city?: string;
  raw: string;
}

// Known GUIDs from BSP QRPh spec
const AID_MAP: Record<string, string> = {
  "A000000632010109": "GCASH",
  "A000000632010105": "PAYMAYA",
  "A000000632010108": "GRABPAY",
  "A000000632010107": "SHOPEEPAY",
  "A000000632010103": "BPI",
  "A000000632010102": "BDO",
  "A000000632010106": "UBP",
  "A000000632010104": "RCBC",
  "A000000632010110": "LANDBANK",
  "A000000632010111": "PNB",
};

function parseTLV(data: string): Map<string, string> {
  const map = new Map<string, string>();
  let i = 0;
  while (i + 4 <= data.length) {
    const tag = data.slice(i, i + 2);
    const len = parseInt(data.slice(i + 2, i + 4), 10);
    if (isNaN(len) || i + 4 + len > data.length) break;
    const value = data.slice(i + 4, i + 4 + len);
    map.set(tag, value);
    i += 4 + len;
  }
  return map;
}

function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/\s+/g, "").trim();
  // +639XXXXXXXXX → 09XXXXXXXXX
  if (cleaned.startsWith("+63") && cleaned.length === 13) {
    return "0" + cleaned.slice(3);
  }
  // 639XXXXXXXXX → 09XXXXXXXXX
  if (cleaned.startsWith("63") && cleaned.length === 12) {
    return "0" + cleaned.slice(2);
  }
  return cleaned;
}

function isPhoneNumber(val: string): boolean {
  const n = normalizePhone(val);
  return /^09\d{9}$/.test(n);
}

function extractFromSubTLV(merchantInfo: string): { channel: string; accountNumber: string } {
  const sub = parseTLV(merchantInfo);

  // Detect channel from sub-tag 00 (GUID/AID)
  const guid = (sub.get("00") || "").toUpperCase();
  let channel = "";
  for (const [aid, ch] of Object.entries(AID_MAP)) {
    if (guid.includes(aid)) { channel = ch; break; }
  }

  // Try sub-tags 02, 03, 01 for account number in order
  const candidates = [
    sub.get("02") || "",
    sub.get("03") || "",
    sub.get("01") || "",
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = normalizePhone(candidate);
    if (isPhoneNumber(normalized)) {
      return { channel, accountNumber: normalized };
    }
    // Non-phone account number (bank account)
    if (candidate.length >= 8 && /^\d+$/.test(candidate.trim())) {
      return { channel, accountNumber: candidate.trim() };
    }
  }

  return { channel, accountNumber: "" };
}

function detectChannelFromRaw(raw: string): string {
  const upper = raw.toUpperCase();
  if (upper.includes("GCASH")) return "GCASH";
  if (upper.includes("PAYMAYA") || upper.includes("MAYA")) return "PAYMAYA";
  if (upper.includes("GRABPAY")) return "GRABPAY";
  if (upper.includes("SHOPEEPAY")) return "SHOPEEPAY";
  if (upper.includes("BPI")) return "BPI";
  if (upper.includes("BDO")) return "BDO";
  if (upper.includes("UNIONBANK") || upper.includes("UBP")) return "UBP";
  if (upper.includes("RCBC")) return "RCBC";
  if (upper.includes("LANDBANK")) return "LANDBANK";
  if (upper.includes("PNB")) return "PNB";
  return "";
}

export function parseQRPh(raw: string): QRPhData | null {
  try {
    const data = raw.trim();
    const tlv = parseTLV(data);

    let channel = "";
    let accountNumber = "";

    // Scan merchant account info tags 26–51
    for (let tag = 26; tag <= 51; tag++) {
      const tagStr = tag.toString().padStart(2, "0");
      const val = tlv.get(tagStr);
      if (!val) continue;

      const extracted = extractFromSubTLV(val);
      if (extracted.channel) channel = extracted.channel;
      if (extracted.accountNumber && !accountNumber) accountNumber = extracted.accountNumber;

      // Once we have both, stop
      if (channel && accountNumber) break;
    }

    // Fallback: detect channel from raw string keywords
    if (!channel) channel = detectChannelFromRaw(data);

    // Fallback: extract phone number from raw string
    if (!accountNumber) {
      const match = data.match(/(?:\+63|63|0)(9\d{9})/);
      if (match) accountNumber = "0" + match[1];
    }

    const amountStr = tlv.get("54");
    const amount = amountStr ? parseFloat(amountStr) : undefined;
    const merchantName = tlv.get("59")?.trim() || "";
    const city = tlv.get("60")?.trim() || "";

    if (!accountNumber && !merchantName) return null;

    return {
      accountName: merchantName,
      accountNumber,
      channel: channel || "GCASH",
      amount,
      merchantName,
      city,
      raw,
    };
  } catch {
    return null;
  }
}

export const CHANNEL_LABELS: Record<string, string> = {
  GCASH: "GCash", PAYMAYA: "Maya", GRABPAY: "GrabPay", SHOPEEPAY: "ShopeePay",
  BPI: "BPI", BDO: "BDO", UBP: "UnionBank", RCBC: "RCBC",
  METROBANK: "Metrobank", LANDBANK: "Landbank", PNB: "PNB", INSTAPAY: "InstaPay",
};

export const CHANNEL_COLORS: Record<string, string> = {
  GCASH: "#007DFE", PAYMAYA: "#6366F1", GRABPAY: "#00B14F", SHOPEEPAY: "#EE4D2D",
  BPI: "#CC0000", BDO: "#003087", UBP: "#E31837", RCBC: "#FFD700",
  METROBANK: "#003087", LANDBANK: "#006400", PNB: "#003087", INSTAPAY: "#038E80",
};
