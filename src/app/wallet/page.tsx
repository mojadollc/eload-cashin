"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, ArrowUpRight, ArrowDownLeft, Copy, Check, Eye, EyeOff, Smartphone, SendHorizonal, Wallet, RotateCcw, Receipt } from "lucide-react";

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

const FILTERS = ["All", "WALLET_FUND", "ELOAD", "CASHOUT", "REFUND"];

function WalletContent() {
  const api = useApi();
  const searchParams = useSearchParams();
  const [wallet, setWallet] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [showBalance, setShowBalance] = useState(true);
  const [banner, setBanner] = useState<"funded" | "cancelled" | "pending" | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const funded = searchParams.get("funded");
    const failed = searchParams.get("failed");
    const ref = searchParams.get("ref");

    const load = () => {
      api.get("/api/wallet").then(setWallet);
      api.get("/api/wallet/transactions").then(d => setEntries(d?.entries || []));
    };

    load();

    if (funded === "1") { setBanner("funded"); return; }

    if (ref) {
      // Check Xendit invoice status — covers QRPH delayed settlement
      setChecking(true);
      setBanner("pending");
      api.post("/api/wallet/fund/check", { transactionNumber: ref }).then((res: any) => {
        setChecking(false);
        if (res?.status === "paid") {
          setBanner("funded");
          load(); // refresh balance
        } else if (res?.status === "expired" || failed === "1") {
          setBanner("cancelled");
        } else {
          // Still pending on Xendit (QRPH not yet settled)
          setBanner("pending");
        }
      });
      return;
    }

    // Cancel stale only on normal wallet visit (no ref)
    api.post("/api/wallet/fund/cancel-stale", {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Wallet</h1>

      {banner === "funded" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium">✅ Wallet funded successfully!</div>
      )}
      {banner === "pending" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 font-medium flex items-center gap-2">
          {checking ? "⏳ Checking payment status..." : "🕐 Payment is pending settlement. Your balance will update once confirmed by the payment provider."}
        </div>
      )}
      {banner === "cancelled" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 font-medium">❌ Payment expired or cancelled.</div>
      )}

      {/* Wallet Card — uniform style */}
      <div className="relative rounded-3xl overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #038E80 0%, #026b62 50%, #025a52 100%)" }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 w-36 h-36 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-12 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-5">
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
            <div className="flex items-center gap-1.5 mb-5">
              <p className="text-white/50 text-[11px] font-mono tracking-[0.2em]">
                {wallet.accountNumber.replace(/(.{4})/g, "$1 ").trim()}
              </p>
              <CopyButton text={wallet.accountNumber} />
            </div>
          )}
          <Link href="/wallet/fund"
            className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-all text-white text-sm font-semibold px-4 py-2 rounded-xl">
            <Plus size={15} /> Fund Wallet
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Transaction History</p>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filter === f ? "bg-[#038E80] text-white" : "bg-gray-100 text-gray-600"}`}>
                {f === "All" ? "All" : f.replace("_", " ")}
              </button>
            ))}
          </div>
          {entries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {entries.map((e: any) => {
                const txType = e.description?.includes("E-Load") ? "ELOAD" : e.description?.includes("Cashout") || e.description?.includes("Send") ? "CASHOUT" : e.description?.includes("Refund") ? "REFUND" : e.entryType === "CREDIT" ? "WALLET_FUND" : "CASHOUT";
                const meta = TX_ICON[txType] || (e.entryType === "CREDIT" ? TX_ICON.WALLET_FUND : TX_ICON.CASHOUT);
                const Icon = meta.icon;
                return (
                <div key={e.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${meta.bg}`}>
                      <Icon size={17} className={meta.color} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{e.description || "Transaction"}</p>
                      <p className="text-xs text-gray-400">{formatDate(e.createdAt)}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${e.entryType === "CREDIT" ? "text-green-600" : "text-gray-800"}`}>
                    {e.entryType === "CREDIT" ? "+" : "-"}{formatCurrency(e.amount)}
                  </p>
                </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function WalletPage() {
  return <Suspense><WalletContent /></Suspense>;
}
