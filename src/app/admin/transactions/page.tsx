"use client";
import { useEffect, useState, useCallback } from "react";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TYPES = ["All", "WALLET_FUND", "ELOAD", "CASHOUT", "REFUND", "ADMIN_ADJUSTMENT"];
const STATUSES = ["All", "SUCCESS", "PENDING", "PROCESSING", "FAILED", "REVERSED", "REFUNDED"];

function SkeletonRow() {
  return (
    <tr>
      {[...Array(8)].map((_, i) => (
        <td key={i} className="py-3 pr-4">
          <div className="h-3 bg-gray-200 rounded-full animate-pulse" style={{ width: `${[120, 100, 70, 70, 60, 70, 60, 80][i]}px` }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminTransactionsPage() {
  const api = useApi();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (type !== "All") params.set("type", type);
    if (status !== "All") params.set("status", status);
    const d = await api.get(`/api/admin/transactions?${params}`);
    setTransactions(d?.transactions || []);
    setTotal(d?.total || 0);
    setPages(d?.pages || 1);
    setLoading(false);
  }, [type, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setPage(1); load(1); }, [type, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (p: number) => { setPage(p); load(p); };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <span className="text-sm text-gray-500">{total.toLocaleString()} total</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPES.map(t => (
          <button key={t} onClick={() => setType(t)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${type === t ? "bg-[#038E80] text-white" : "bg-white text-gray-600 border"}`}>{t.replace(/_/g, " ")}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${status === s ? "bg-[#17202A] text-white" : "bg-white text-gray-600 border"}`}>{s}</button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="pb-2 font-medium">Transaction ID</th>
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Fee</th>
                <th className="pb-2 font-medium">Provider</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? [...Array(10)].map((_, i) => <SkeletonRow key={i} />)
                : transactions.length === 0
                  ? <tr><td colSpan={8} className="py-10 text-center text-sm text-gray-400">No transactions found</td></tr>
                  : transactions.map((txn: any) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="py-2.5 font-mono text-xs text-gray-500">{txn.transactionNumber}</td>
                      <td className="py-2.5">
                        <p className="font-medium">{txn.user?.firstName} {txn.user?.lastName}</p>
                        <p className="text-xs text-gray-400">{txn.user?.userId}</p>
                      </td>
                      <td className="py-2.5 text-xs">{txn.type.replace(/_/g, " ")}</td>
                      <td className="py-2.5 font-medium">{formatCurrency(txn.grossAmount)}</td>
                      <td className="py-2.5 text-gray-500">{formatCurrency(txn.feeAmount)}</td>
                      <td className="py-2.5 text-xs text-gray-500">{txn.provider || "—"}</td>
                      <td className="py-2.5"><Badge status={txn.status} /></td>
                      <td className="py-2.5 text-xs text-gray-400">{formatDate(txn.createdAt)}</td>
                    </tr>
                  ))
              }
            </tbody>
          </table>

          {!loading && pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-2">
              <button onClick={() => goTo(page - 1)} disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold disabled:opacity-40 bg-gray-100 text-gray-600">
                <ChevronLeft size={16} /> Prev
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  const p = pages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= pages - 2 ? pages - 4 + i : page - 2 + i;
                  return (
                    <button key={p} onClick={() => goTo(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${page === p ? "bg-[#038E80] text-white" : "bg-gray-100 text-gray-600"}`}>
                      {p}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => goTo(page + 1)} disabled={page === pages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold disabled:opacity-40 bg-gray-100 text-gray-600">
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
          {!loading && (
            <p className="text-xs text-gray-400 text-center pt-2">
              Showing {total === 0 ? 0 : Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)} of {total.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
