"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/shared/auth-context";
import { useApi } from "@/components/shared/use-api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Eye, EyeOff, Copy, Check, Plus,
  Smartphone, SendHorizonal, ArrowLeftRight, Receipt,
  Wallet, TrendingUp, TrendingDown, ArrowRight,
} from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
      {copied ? <Check size={13} className="text-green-300" /> : <Copy size={13} />}
    </button>
  );
}

const TX_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  ELOAD:       { label: "E-Load",      icon: Smartphone,    color: "text-blue-600",   bg: "bg-blue-50" },
  WALLET_FUND: { label: "Wallet Fund", icon: TrendingUp,    color: "text-green-600",  bg: "bg-green-50" },
  CASHOUT:     { label: "Send Money",  icon: SendHorizonal, color: "text-purple-600", bg: "bg-purple-50" },
  REFUND:      { label: "Refund",      icon: TrendingUp,    color: "text-teal-600",   bg: "bg-teal-50" },
  REVERSAL:    { label: "Reversal",    icon: TrendingDown,  color: "text-orange-600", bg: "bg-orange-50" },
};

function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-10 bg-gray-200 rounded-2xl w-1/2" />
      <div className="h-44 bg-gray-200 rounded-3xl" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="h-56 bg-gray-200 rounded-2xl" />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const api = useApi();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);
  const [pendingFund, setPendingFund] = useState<{ transactionNumber: string; amount: number } | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/api/wallet"),
      api.get("/api/transactions?limit=5"),
      api.post("/api/wallet/fund/cancel-stale", {}),
      api.get("/api/wallet/fund/pending"),
    ]).then(([w, d, , p]) => {
      setWallet(w);
      setTransactions(d?.transactions || []);
      if (p?.transactionNumber) {
        fetch("/api/wallet/fund/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionNumber: p.transactionNumber }),
        })
          .then(r => r.json())
          .then(res => { if (res?.status === "pending") setPendingFund(p); })
          .catch(() => {});
      }
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const quickActions = [
    { href: "/eload",        icon: Smartphone,    label: "E-Load",   color: "text-blue-600",   bg: "bg-blue-50" },
    { href: "/cashout",      icon: SendHorizonal, label: "Send",     color: "text-purple-600", bg: "bg-purple-50" },
    { href: "/transfer",     icon: ArrowLeftRight,label: "Transfer", color: "text-teal-600",   bg: "bg-teal-50" },
    { href: "/transactions", icon: Receipt,       label: "History",  color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();

  if (loading) return <SkeletonCard />;

  return (
    <div className="w-full max-w-lg mx-auto lg:max-w-2xl lg:p-8">

      {/* Greeting row */}
      <div className="flex items-center justify-between px-4 pt-5 pb-2 lg:px-0 lg:pt-0">
        <div>
          <p className="text-xs text-gray-400 font-medium">{greeting},</p>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">{user?.firstName} {user?.lastName}</h1>
        </div>
        <Link href="/profile">
          <div className="w-10 h-10 rounded-full bg-[#038E80] flex items-center justify-center text-white text-sm font-bold shadow-md shadow-[#038E80]/30 shrink-0">
            {initials || <Wallet size={18} />}
          </div>
        </Link>
      </div>

      {/* Pending Fund Banner */}
      {pendingFund && (
        <div className="mx-4 lg:mx-0 mt-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-yellow-800">Payment in progress</p>
            <p className="text-xs text-yellow-600 truncate">₱{pendingFund.amount.toLocaleString()} — tap to check status</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/wallet/fund/return?ref=${pendingFund.transactionNumber}`}
              className="text-xs font-bold bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-3 py-1.5 rounded-xl transition-all"
            >
              Check
            </Link>
            <button onClick={() => setPendingFund(null)} className="text-yellow-400 hover:text-yellow-600 text-lg leading-none">&times;</button>
          </div>
        </div>
      )}

      {/* Wallet Card */}
      <div className="mx-4 lg:mx-0 mt-3 relative rounded-3xl overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #038E80 0%, #026b62 50%, #025a52 100%)" }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 w-36 h-36 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-12 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="min-w-0 flex-1 pr-3">
              <p className="text-white/60 text-[10px] font-medium uppercase tracking-widest mb-1">Available Balance</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                  {showBalance ? formatCurrency(wallet?.availableBalance || 0) : "₱ ••••••"}
                </span>
                <button onClick={() => setShowBalance(b => !b)}
                  className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 shrink-0">
                  {showBalance ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {wallet?.pendingBalance > 0 && (
                <p className="text-white/50 text-xs mt-0.5">+ {formatCurrency(wallet.pendingBalance)} pending</p>
              )}
            </div>
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Wallet size={16} className="text-white" />
            </div>
          </div>
          {wallet?.accountNumber && (
            <div className="flex items-center gap-2 mb-4">
              <p className="text-white/70 text-xs font-semibold tracking-[0.15em] truncate">
                {wallet.accountNumber.replace(/(.{4})/g, "$1 ").trim()}
              </p>
              <CopyButton text={wallet.accountNumber} />
            </div>
          )}
          <Link href="/wallet/fund"
            className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 transition-all text-white text-xs font-semibold px-3 py-2 rounded-xl">
            <Plus size={13} /> Fund Wallet
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mx-4 lg:mx-0 mt-4">
        {quickActions.map(({ href, icon: Icon, label, color, bg }) => (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform">
            <div className={`w-full aspect-square max-w-[60px] rounded-2xl flex items-center justify-center ${bg} transition-all`}>
              <Icon size={20} className={color} strokeWidth={2} />
            </div>
            <span className="text-[10px] sm:text-xs font-semibold text-gray-600 text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="mx-4 lg:mx-0 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-50">
          <p className="text-sm font-bold text-gray-800">Recent Transactions</p>
          <Link href="/transactions" className="flex items-center gap-1 text-xs font-semibold text-[#038E80]">
            See all <ArrowRight size={12} />
          </Link>
        </div>
        {transactions.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Receipt size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-400">No transactions yet</p>
            <p className="text-xs text-gray-300 mt-0.5">Your activity will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((txn: any) => {
              const meta = TX_META[txn.type] || { label: txn.type.replace(/_/g, " "), icon: Receipt, color: "text-gray-500", bg: "bg-gray-100" };
              const Icon = meta.icon;
              const isCredit = txn.type === "WALLET_FUND" || txn.type === "REFUND";
              return (
                <div key={txn.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                      <Icon size={16} className={meta.color} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{meta.label}</p>
                      <p className="text-[10px] text-gray-400 truncate">{formatDate(txn.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={`text-sm font-bold ${isCredit ? "text-green-600" : "text-gray-800"}`}>
                      {isCredit ? "+" : "-"}{formatCurrency(txn.grossAmount)}
                    </p>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                      txn.status === "SUCCESS" ? "bg-green-50 text-green-600" :
                      txn.status === "PENDING" ? "bg-yellow-50 text-yellow-600" :
                      txn.status === "FAILED"  ? "bg-red-50 text-red-500" :
                      "bg-gray-100 text-gray-400"
                    }`}>
                      {txn.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom spacer for lg */}
      <div className="h-4 lg:h-8" />
    </div>
  );
}
