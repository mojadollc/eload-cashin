"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react";

const FILTERS = ["All", "WALLET_FUND", "ELOAD", "CASHOUT", "REFUND"];

export default function WalletPage() {
  const api = useApi();
  const [wallet, setWallet] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    api.get("/api/wallet").then(setWallet);
    api.get("/api/wallet/transactions").then(d => setEntries(d?.entries || []));
  }, []);

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Wallet</h1>

      <div className="bg-gradient-to-br from-[#038E80] to-[#058174] rounded-2xl p-6 text-white">
        <p className="text-white/70 text-sm">Available Balance</p>
        <p className="text-4xl font-bold mt-1">{formatCurrency(wallet?.availableBalance || 0)}</p>
        {wallet?.pendingBalance > 0 && <p className="text-white/60 text-sm mt-1">Pending: {formatCurrency(wallet.pendingBalance)}</p>}
        <div className="mt-4 flex gap-2">
          <Link href="/wallet/fund">
            <Button size="sm" className="bg-white/20 hover:bg-white/30 border-0 text-white">
              <Plus size={16} className="mr-1" /> Fund Wallet
            </Button>
          </Link>
        </div>
        <div className="mt-3 text-white/50 text-xs">Account No: {wallet?.accountNumber}</div>
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
              {entries.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${e.entryType === "CREDIT" ? "bg-green-100" : "bg-red-100"}`}>
                      {e.entryType === "CREDIT" ? <ArrowDownLeft size={16} className="text-green-600" /> : <ArrowUpRight size={16} className="text-red-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{e.description || "Transaction"}</p>
                      <p className="text-xs text-gray-400">{formatDate(e.createdAt)}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${e.entryType === "CREDIT" ? "text-green-600" : "text-red-500"}`}>
                    {e.entryType === "CREDIT" ? "+" : "-"}{formatCurrency(e.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
