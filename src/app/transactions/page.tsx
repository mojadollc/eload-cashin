"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const TYPES = ["All", "WALLET_FUND", "ELOAD", "CASHOUT", "REFUND"];
const STATUSES = ["All", "SUCCESS", "PENDING", "PROCESSING", "FAILED", "CANCELLED"];
const txIcon: Record<string, string> = { ELOAD: "📱", WALLET_FUND: "💰", CASHOUT: "💸", REFUND: "↩️", REVERSAL: "🔄" };

export default function TransactionsPage() {
  const api = useApi();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page) });
    if (type !== "All") params.set("type", type);
    if (status !== "All") params.set("status", status);
    api.get(`/api/transactions?${params}`).then(d => { setTransactions(d?.transactions || []); setTotal(d?.total || 0); });
  }, [type, status, page]);

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Transactions</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TYPES.map(t => (
          <button key={t} onClick={() => { setType(t); setPage(1); }} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${type === t ? "bg-[#038E80] text-white" : "bg-white text-gray-600 border"}`}>
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUSES.map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${status === s ? "bg-[#17202A] text-white" : "bg-white text-gray-600 border"}`}>{s}</button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4">
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No transactions found</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn: any) => (
                <div key={txn.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{txIcon[txn.type] || "💳"}</span>
                    <div>
                      <p className="text-sm font-medium">{txn.type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-gray-400">{txn.transactionNumber}</p>
                      <p className="text-xs text-gray-400">{formatDate(txn.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className={`text-sm font-semibold ${txn.type === "WALLET_FUND" ? "text-green-600" : "text-red-500"}`}>
                      {txn.type === "WALLET_FUND" ? "+" : "-"}{formatCurrency(txn.grossAmount)}
                    </p>
                    <Badge status={txn.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 text-center mt-4">{total} total transactions</p>
        </CardContent>
      </Card>
    </div>
  );
}
