"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/shared/auth-context";
import { useApi } from "@/components/shared/use-api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Eye, EyeOff, Copy, Check, Plus,
  Smartphone, SendHorizonal, ArrowLeftRight, Receipt,
  Wallet, TrendingUp, TrendingDown, ArrowRight, Sparkles,
} from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="text-white/40 hover:text-white/80 transition-colors p-1 rounded-lg hover:bg-white/10">
      {copied ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
    </button>
  );
}

const TX_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  ELOAD:       { label: "E-Load",      icon: Smartphone,    color: "text-blue-600",   bg: "bg-blue-50" },
  WALLET_FUND: { label: "Wallet Fund", icon: TrendingUp,    color: "text-emerald-600", bg: "bg-emerald-50" },
  CASHOUT:     { label: "Send Money",  icon: SendHorizonal, color: "text-violet-600", bg: "bg-violet-50" },
  REFUND:      { label: "Refund",      icon: TrendingUp,    color: "text-teal-600",   bg: "bg-teal-50" },
  REVERSAL:    { label: "Reversal",    icon: TrendingDown,  color: "text-orange-600", bg: "bg-orange-50" },
};

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-8 bg-slate-200 rounded-xl w-2/5" />
      <div className="h-48 bg-slate-200 rounded-3xl" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-200 rounded-2xl" />)}
      </div>
      <div className="h-56 bg-slate-200 rounded-2xl" />
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

  useEffect(() => {
    Promise.all([
      api.get("/api/wallet"),
      api.get("/api/transactions?limit=5"),
    ]).then(([w, d]) => {
      setWallet(w);
      setTransactions(d?.transactions || []);
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const quickActions = [
    { href: "/eload",        icon: Smartphone,    label: "E-Load",   color: "text-blue-600",   bg: "bg-blue-50",   ring: "ring-blue-100" },
    { href: "/cashout",      icon: SendHorizonal, label: "Send",     color: "text-violet-600", bg: "bg-violet-50", ring: "ring-violet-100" },
    { href: "/transfer",     icon: ArrowLeftRight,label: "Transfer", color: "text-teal-600",   bg: "bg-teal-50",   ring: "ring-teal-100" },
    { href: "/transactions", icon: Receipt,       label: "History",  color: "text-orange-600", bg: "bg-orange-50", ring: "ring-orange-100" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();

  if (loading) return <Skeleton />;

  return (
    <div className="w-full max-w-lg mx-auto lg:max-w-2xl lg:p-8 page-enter">

      {/* Greeting */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 lg:px-0 lg:pt-0">
        <div>
          <p className="text-[12px] text-slate-400 font-medium">{greeting} 👋</p>
          <h1 className="text-[18px] font-bold text-slate-900 leading-tight mt-0.5">{user?.firstName} {user?.lastName}</h1>
        </div>
        <Link href="/profile">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-[13px] font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, #038E80, #0ea5e9)", boxShadow: "0 4px 12px -2px rgba(3,142,128,0.4)" }}>
            {initials || <Wallet size={16} />}
          </div>
        </Link>
      </div>

      {/* Wallet Card */}
      <div className="mx-4 lg:mx-0 mt-2 relative rounded-3xl overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #038E80 0%, #026b62 55%, #025a52 100%)", boxShadow: "0 16px 40px -8px rgba(3,142,128,0.45)" }}>
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/[0.06]" />
        <div className="absolute -bottom-12 -left-8 w-44 h-44 rounded-full bg-white/[0.04]" />
        <div className="absolute top-1/2 right-16 w-24 h-24 rounded-full bg-white/[0.04]" />
        <div className="absolute top-4 left-1/2 w-16 h-16 rounded-full bg-white/[0.03]" />

        <div className="relative p-5 pb-6">
          <div className="flex items-start justify-between mb-5">
            <div className="min-w-0 flex-1 pr-3">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-[0.18em] mb-1.5">Available Balance</p>
              <div className="flex items-center gap-2.5">
                <span className="text-[28px] sm:text-[32px] font-bold tracking-tight truncate leading-none">
                  {showBalance ? formatCurrency(wallet?.availableBalance || 0) : "₱ ••••••"}
                </span>
                <button onClick={() => setShowBalance(b => !b)}
                  className="text-white/40 hover:text-white/80 transition-colors p-1.5 rounded-xl hover:bg-white/10 shrink-0">
                  {showBalance ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {wallet?.pendingBalance > 0 && (
                <p className="text-white/40 text-[11px] mt-1.5 flex items-center gap-1">
                  <Sparkles size={10} /> {formatCurrency(wallet.pendingBalance)} pending
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
              <Wallet size={17} className="text-white/80" />
            </div>
          </div>

          {wallet?.accountNumber && (
            <div className="flex items-center gap-2 mb-5">
              <p className="text-white/50 text-[11px] font-mono tracking-[0.2em]">
                {wallet.accountNumber.replace(/(.{4})/g, "$1 ").trim()}
              </p>
              <CopyButton text={wallet.accountNumber} />
            </div>
          )}

          <Link href="/wallet/fund"
            className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/22 active:bg-white/30 border border-white/20 transition-all text-white text-[12px] font-semibold px-4 py-2 rounded-xl">
            <Plus size={13} /> Fund Wallet
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2.5 mx-4 lg:mx-0 mt-5">
        {quickActions.map(({ href, icon: Icon, label, color, bg }) => (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
            <div className={`w-full aspect-square max-w-[58px] rounded-2xl flex items-center justify-center ${bg} transition-all group-hover:scale-105`}>
              <Icon size={20} className={color} strokeWidth={2} />
            </div>
            <span className="text-[11px] font-semibold text-slate-500 text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="mx-4 lg:mx-0 mt-5 bg-white rounded-2xl border border-slate-100 overflow-hidden"
        style={{ boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)" }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-50">
          <p className="text-[14px] font-bold text-slate-800">Recent Transactions</p>
          <Link href="/transactions" className="flex items-center gap-1 text-[12px] font-semibold text-[#038E80] hover:underline">
            See all <ArrowRight size={12} />
          </Link>
        </div>
        {transactions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Receipt size={20} className="text-slate-300" />
            </div>
            <p className="text-[13px] font-semibold text-slate-400">No transactions yet</p>
            <p className="text-[12px] text-slate-300 mt-0.5">Your activity will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {transactions.map((txn: any) => {
              const meta = TX_META[txn.type] || { label: txn.type.replace(/_/g, " "), icon: Receipt, color: "text-slate-500", bg: "bg-slate-100" };
              const Icon = meta.icon;
              const isCredit = txn.type === "WALLET_FUND" || txn.type === "REFUND";
              return (
                <div key={txn.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                      <Icon size={15} className={meta.color} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{meta.label}</p>
                      <p className="text-[11px] text-slate-400 truncate">{formatDate(txn.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-[13px] font-bold ${isCredit ? "text-emerald-600" : "text-slate-800"}`}>
                      {isCredit ? "+" : "-"}{formatCurrency(txn.grossAmount)}
                    </p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block ${
                      txn.status === "SUCCESS"    ? "bg-emerald-50 text-emerald-600" :
                      txn.status === "PENDING"    ? "bg-amber-50 text-amber-600" :
                      txn.status === "FAILED"     ? "bg-red-50 text-red-500" :
                      "bg-slate-100 text-slate-400"
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

      <div className="h-6 lg:h-10" />
    </div>
  );
}
