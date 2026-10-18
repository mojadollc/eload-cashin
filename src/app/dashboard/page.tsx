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
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
      {copied ? <Check size={13} className="text-green-300" /> : <Copy size={13} />}
    </button>
  );
}

const TX_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  ELOAD:       { label: "E-Load",       icon: Smartphone,    color: "text-blue-600",   bg: "bg-blue-50" },
  WALLET_FUND: { label: "Wallet Fund",  icon: TrendingUp,    color: "text-green-600",  bg: "bg-green-50" },
  CASHOUT:     { label: "Send Money",   icon: SendHorizonal, color: "text-purple-600", bg: "bg-purple-50" },
  REFUND:      { label: "Refund",       icon: TrendingUp,    color: "text-teal-600",   bg: "bg-teal-50" },
  REVERSAL:    { label: "Reversal",     icon: TrendingDown,  color: "text-orange-600", bg: "bg-orange-50" },
};

function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-48 bg-gray-200 rounded-3xl" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-2xl" />
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
    { href: "/eload",    icon: Smartphone,   label: "E-Load",   color: "text-blue-600",   bg: "bg-blue-50",   ring: "ring-blue-100" },
    { href: "/cashout",  icon: SendHorizonal, label: "Send",     color: "text-purple-600", bg: "bg-purple-50", ring: "ring-purple-100" },
    { href: "/transfer", icon: ArrowLeftRight,label: "Transfer", color: "text-teal-600",   bg: "bg-teal-50",   ring: "ring-teal-100" },
    { href: "/transactions", icon: Receipt,  label: "History",  color: "text-orange-600", bg: "bg-orange-50", ring: "ring-orange-100" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();

  if (loading) return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto">
      <SkeletonCard />
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-lg mx-auto pb-28 lg:pb-8 space-y-5">

      {/* Greeting */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-sm text-gray-400 font-medium">{greeting},</p>
          <h1 className="text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h1>
        </div>
        <Link href="/profile">
          <div className="w-10 h-10 rounded-full bg-[#038E80] flex items-center justify-center text-white text-sm font-bold shadow-md shadow-[#038E80]/30">
            {initials || <Wallet size={18} />}
          </div>
        </Link>
      </div>

      {/* Wallet Card */}
      <div className="relative rounded-3xl overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #038E80 0%, #026b62 50%, #025a52 100%)" }}>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 w-36 h-36 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-12 w-20 h-20 rounded-full bg-white/5" />

        <div className="relative p-6">
          {/* Top row */}
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
                <p className="text-white/50 text-xs mt-1">
                  + {formatCurrency(wallet.pendingBalance)} pending
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              <Wallet size={18} className="text-white" />
            </div>
          </div>

          {/* Account number */}
          {wallet?.accountNumber && (
            <div className="flex items-center gap-2 mb-5">
              <p className="text-white/70 text-sm font-semibold tracking-[0.18em]">
                {wallet.accountNumber.replace(/(.{4})/g, "$1 ").trim()}
              </p>
              <CopyButton text={wallet.accountNumber} />
            </div>
          )}

          {/* Fund button */}
          <Link href="/wallet/fund"
            className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-all text-white text-sm font-semibold px-4 py-2 rounded-xl">
            <Plus size={15} /> Fund Wallet
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map(({ href, icon: Icon, label, color, bg, ring }) => (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-2 group">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg} ring-2 ring-transparent group-hover:${ring} transition-all group-active:scale-95`}>
              <Icon size={22} className={color} strokeWidth={2} />
            </div>
            <span className="text-xs font-semibold text-gray-600">{label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-50">
          <p className="text-sm font-bold text-gray-800">Recent Transactions</p>
          <Link href="/transactions"
            className="flex items-center gap-1 text-xs font-semibold text-[#038E80] hover:underline">
            See all <ArrowRight size={12} />
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Receipt size={24} className="text-gray-300" />
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
                <div key={txn.id} className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                      <Icon size={18} className={meta.color} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{meta.label}</p>
                      <p className="text-xs text-gray-400">{formatDate(txn.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isCredit ? "text-green-600" : "text-gray-800"}`}>
                      {isCredit ? "+" : "-"}{formatCurrency(txn.grossAmount)}
                    </p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
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
    </div>
  );
}
