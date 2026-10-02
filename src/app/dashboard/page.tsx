"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/shared/auth-context";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Smartphone, ArrowDownCircle, List, User, Eye, EyeOff, Plus } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const api = useApi();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    api.get("/api/wallet").then(setWallet);
    api.get("/api/transactions?limit=5").then(d => setTransactions(d?.transactions || []));
  }, []);

  const quickActions = [
    { href: "/eload", icon: Smartphone, label: "E-Load", color: "bg-blue-50 text-blue-600" },
    { href: "/cashout", icon: ArrowDownCircle, label: "Cash Out", color: "bg-purple-50 text-purple-600" },
    { href: "/transactions", icon: List, label: "Transactions", color: "bg-orange-50 text-orange-600" },
    { href: "/profile", icon: User, label: "Profile", color: "bg-green-50 text-green-600" },
  ];

  const txIcon: Record<string, string> = { ELOAD: "📱", WALLET_FUND: "💰", CASHOUT: "💸", REFUND: "↩️" };

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <p className="text-gray-500 text-sm">Good day,</p>
        <h1 className="text-2xl font-bold">👋 {user?.firstName} {user?.lastName}</h1>
      </div>

      {/* Wallet Card */}
      <div className="bg-gradient-to-br from-[#038E80] to-[#058174] rounded-2xl p-6 text-white">
        <p className="text-white/70 text-sm mb-1">Wallet Balance</p>
        <div className="flex items-center gap-3">
          <span className="text-4xl font-bold">
            {showBalance ? formatCurrency(wallet?.availableBalance || 0) : "₱ ••••••"}
          </span>
          <button onClick={() => setShowBalance(b => !b)} className="text-white/70 hover:text-white">
            {showBalance ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {wallet?.pendingBalance > 0 && (
          <p className="text-white/60 text-sm mt-1">Pending: {formatCurrency(wallet.pendingBalance)}</p>
        )}
        <Link href="/wallet/fund">
          <Button variant="secondary" size="sm" className="mt-4 bg-white/20 hover:bg-white/30 border-0 text-white">
            <Plus size={16} className="mr-1" /> Fund Wallet
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href} className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
                  <Icon size={22} />
                </div>
                <span className="text-xs font-medium text-gray-600">{label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Transactions</p>
            <Link href="/transactions" className="text-xs text-[#038E80] font-medium">See all</Link>
          </div>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn: any) => (
                <div key={txn.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{txIcon[txn.type] || "💳"}</span>
                    <div>
                      <p className="text-sm font-medium">{txn.type.replace("_", " ")}</p>
                      <p className="text-xs text-gray-400">{formatDate(txn.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${txn.type === "WALLET_FUND" ? "text-green-600" : "text-red-500"}`}>
                      {txn.type === "WALLET_FUND" ? "+" : "-"}{formatCurrency(txn.grossAmount)}
                    </p>
                    <Badge status={txn.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
