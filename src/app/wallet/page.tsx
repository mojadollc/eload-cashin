"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApi } from "@/components/shared/use-api";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Plus, Copy, Check, Eye, EyeOff,
  Smartphone, SendHorizonal, ArrowLeftRight,
  Wallet, RotateCcw, RefreshCw, ArrowDownLeft, Receipt,
} from "lucide-react";

const TX_ICON: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  ELOAD:       { icon: Smartphone,    color: "text-blue-600",   bg: "bg-blue-50" },
  WALLET_FUND: { icon: ArrowDownLeft, color: "text-green-600",  bg: "bg-green-50" },
  CASHOUT:     { icon: SendHorizonal, color: "text-purple-600", bg: "bg-purple-50" },
  REFUND:      { icon: RotateCcw,     color: "text-teal-600",   bg: "bg-teal-50" },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="text-white/60 hover:text-white transition-colors">
      {copied ? <Check size={14} className="text-green-300" /> : <Copy size={14} />}
    </button>
  );
}

const FILTERS = [
  { key: "All", label: "All" },
  { key: "WALLET_FUND", label: "Funding" },
  { key: "ELOAD", label: "E-Load" },
  { key: "CASHOUT", label: "Cash Out" },
  { key: "REFUND", label: "Refund" },
];

function WalletContent() {
  const api = useApi();
  const searchParams = useSearchParams();
  const [wallet, setWallet] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [showBalance, setShowBalance] = useState(true);
  const [banner, setBanner] = useState<"funded" | "cancelled" | "pending" | null>(null);

  useEffect(() => {
    const funded = searchParams.get("funded");
    const failed = searchParams.get("failed");
    const ref = searchParams.get("ref");

    const load = () => {
      api.get("/api/wallet").then(setWallet);
      api.get("/api/wallet/transactions").then(d => setEntries(d?.entries || []));
    };

    api.post("/api/wallet/fund/reconcile", {}).then(() => load());

    if (funded === "1") { setBanner("funded"); return; }
    if (ref) {
      setBanner("pending");
      api.post("/api/wallet/fund/check", { transactionNumber: ref }).then((res: any) => {
        if (res?.status === "paid") { setBanner("funded"); load(); }
        else if (res?.status === "expired" || failed === "1") setBanner("cancelled");
        else setBanner("pending");
      });
      return;
    }
    api.post("/api/wallet/fund/cancel-stale", {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = filter === "All" ? entries : entries.filter((e: any) => {
    const txType = e.description?.includes("E-Load") ? "ELOAD"
      : e.description?.includes("Cashout") || e.description?.includes("Send") ? "CASHOUT"
      : e.description?.includes("Refund") ? "REFUND"
      : e.entryType === "CREDIT" ? "WALLET_FUND" : "CASHOUT";
    return txType === filter;
  });

  return (
    <div className="min-h-screen bg-[#F7F9FA]">
      {/* Header */}
      <div className="bg-[#038E80] px-4 pt-6 pb-24">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-white text-xl font-bold">My Wallet</h1>
          <Link href="/wallet/fund"
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all">
            <Plus size={13} /> Fund
          </Link>
        </div>
      </div>

      <div className="px-4 -mt-20 space-y-4">
        {/* Wallet Card */}
        <div className="relative rounded-3xl overflow-hidden text-white shadow-xl"
          style={{ background: "linear-gradient(135deg, #038E80 0%, #026b62 50%, #025a52 100%)" }}>
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 w-36 h-36 rounded-full bg-white/5" />
          <div className="absolute top-1/2 right-12 w-20 h-20 rounded-full bg-white/5" />
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">Available Balance</p>
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl font-bold tracking-tight">
                    {showBalance ? formatCurrency(wallet?.availableBalance || 0) : "₱ ••••••"}
                  </span>
                  <button onClick={() => setShowBalance(b => !b)}
                    className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                    {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {wallet?.pendingBalance > 0 && (
                  <p className="text-white/50 text-xs mt-1">+ {formatCurrency(wallet.pendingBalance)} pending</p>
                )}
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                <Wallet size={18} className="text-white" />
              </div>
            </div>
            {wallet?.accountNumber && (
              <div className="flex items-center gap-2">
                <p className="text-white/70 text-sm font-semibold tracking-[0.18em]">
                  {wallet.accountNumber.replace(/(.{4})/g, "$1 ").trim()}
                </p>
                <CopyButton text={wallet.accountNumber} />
              </div>
            )}
          </div>
        </div>

        {/* Banners */}
        {banner === "funded" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-sm text-green-700 font-medium text-center">✅ Wallet funded successfully!</div>
        )}
        {banner === "pending" && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-sm text-blue-700 font-medium text-center">🕐 Payment pending confirmation...</div>
        )}
        {banner === "cancelled" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-600 font-medium text-center">❌ Payment expired or cancelled.</div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/wallet/fund",  icon: Plus,           label: "Fund",     bg: "bg-teal-50",   color: "text-[#038E80]" },
            { href: "/cashout",      icon: SendHorizonal,  label: "Cash Out", bg: "bg-purple-50", color: "text-purple-600" },
            { href: "/transfer",     icon: ArrowLeftRight, label: "Transfer", bg: "bg-blue-50",   color: "text-blue-600" },
          ].map(({ href, icon: Icon, label, bg, color }) => (
            <Link key={href} href={href}
              className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-2 active:scale-95 transition-all">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${bg}`}>
                <Icon size={20} className={color} />
              </div>
              <span className="text-xs font-semibold text-gray-600">{label}</span>
            </Link>
          ))}
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-50">
            <p className="text-sm font-bold text-gray-800 mb-3">Transaction History</p>
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${filter === f.key ? "bg-[#038E80] text-white" : "bg-gray-100 text-gray-500"}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Receipt size={24} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-400">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((e: any) => {
                const txType = e.description?.includes("E-Load") ? "ELOAD"
                  : e.description?.includes("Cashout") || e.description?.includes("Send") ? "CASHOUT"
                  : e.description?.includes("Refund") ? "REFUND"
                  : e.entryType === "CREDIT" ? "WALLET_FUND" : "CASHOUT";
                const meta = TX_ICON[txType] || TX_ICON.WALLET_FUND;
                const Icon = meta.icon;
                return (
                  <div key={e.id} className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                        <Icon size={18} className={meta.color} strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{e.description || "Transaction"}</p>
                        <p className="text-xs text-gray-400">{formatDate(e.createdAt)}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-bold ${e.entryType === "CREDIT" ? "text-green-600" : "text-gray-800"}`}>
                      {e.entryType === "CREDIT" ? "+" : "-"}{formatCurrency(e.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  return <Suspense><WalletContent /></Suspense>;
}
