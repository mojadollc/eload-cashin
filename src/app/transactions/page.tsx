"use client";
import { useEffect, useState, useCallback } from "react";
import { useApi } from "@/components/shared/use-api";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Filter, X } from "lucide-react";

const TYPES = ["All", "WALLET_FUND", "ELOAD", "CASHOUT", "REFUND"];
const STATUSES = ["All", "SUCCESS", "PENDING", "FAILED", "CANCELLED"];
const txIcon: Record<string, string> = { ELOAD: "📱", WALLET_FUND: "💰", CASHOUT: "💸", REFUND: "↩️", REVERSAL: "🔄" };

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-3 w-24 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-2.5 w-32 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-2.5 w-20 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="space-y-1.5 items-end flex flex-col">
        <div className="h-3.5 w-16 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-5 w-14 bg-gray-200 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const api = useApi();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const fetchTransactions = useCallback(async (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "15" });
    if (type !== "All") params.set("type", type);
    if (status !== "All") params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const d = await api.get(`/api/transactions?${params}`);
    setTransactions(d?.transactions || []);
    setTotal(d?.total || 0);
    setPages(d?.pages || 1);
    setLoading(false);
  }, [type, status, dateFrom, dateTo, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchTransactions(page); }, [type, status, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyDateFilter = () => { setPage(1); fetchTransactions(1); setShowFilter(false); };

  const clearFilters = () => {
    setType("All"); setStatus("All"); setDateFrom(""); setDateTo(""); setPage(1);
  };

  const hasActiveFilter = type !== "All" || status !== "All" || dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-[#F7F9FA]">
      {/* Header */}
      <div className="bg-[#038E80] px-4 pt-6 pb-16">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-xl font-bold">Transactions</h1>
          <button onClick={() => setShowFilter(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${hasActiveFilter ? "bg-white text-[#038E80]" : "bg-white/20 text-white"}`}>
            <Filter size={14} />
            Filter
            {hasActiveFilter && <span className="w-2 h-2 rounded-full bg-[#038E80]" />}
          </button>
        </div>
        <p className="text-white/60 text-sm mt-1">{total} transaction{total !== 1 ? "s" : ""}</p>
      </div>

      <div className="px-4 -mt-10 pb-8 space-y-4">
        {/* Filter panel */}
        {showFilter && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            {/* Date range */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Date Range</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">From</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#038E80]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">To</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#038E80]" />
                </div>
              </div>
            </div>

            {/* Quick date presets */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Select</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "Today", days: 0 },
                  { label: "Last 7 days", days: 7 },
                  { label: "Last 30 days", days: 30 },
                  { label: "Last 90 days", days: 90 },
                ].map(({ label, days }) => (
                  <button key={label} onClick={() => {
                    const to = new Date();
                    const from = new Date();
                    from.setDate(from.getDate() - days);
                    setDateFrom(from.toISOString().slice(0, 10));
                    setDateTo(to.toISOString().slice(0, 10));
                  }} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-[#038E80]/10 hover:text-[#038E80] transition-all">
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={clearFilters} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 flex items-center justify-center gap-1">
                <X size={14} /> Clear
              </button>
              <button onClick={applyDateFilter} className="flex-[2] py-2.5 rounded-xl bg-[#038E80] text-white text-sm font-semibold">
                Apply Filter
              </button>
            </div>
          </div>
        )}

        {/* Type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {TYPES.map(t => (
            <button key={t} onClick={() => { setType(t); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${type === t ? "bg-[#038E80] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200"}`}>
              {t.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${status === s ? "bg-[#17202A] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200"}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Active date filter badge */}
        {(dateFrom || dateTo) && (
          <div className="flex items-center gap-2 bg-[#038E80]/10 rounded-xl px-3 py-2">
            <span className="text-xs font-semibold text-[#038E80]">
              📅 {dateFrom || "—"} → {dateTo || "—"}
            </span>
            <button onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); fetchTransactions(1); }} className="ml-auto">
              <X size={14} className="text-[#038E80]" />
            </button>
          </div>
        )}

        {/* Transaction list */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="px-4 divide-y divide-gray-50">
              {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm font-semibold text-gray-500">No transactions found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map((txn: any) => (
                <div key={txn.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl shrink-0">
                      {txIcon[txn.type] || "💳"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{txn.type.replace(/_/g, " ")}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{txn.transactionNumber}</p>
                      <p className="text-[11px] text-gray-400">{formatDate(txn.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1 shrink-0">
                    <p className={`text-sm font-bold ${txn.type === "WALLET_FUND" || txn.type === "REFUND" ? "text-green-600" : "text-red-500"}`}>
                      {txn.type === "WALLET_FUND" || txn.type === "REFUND" ? "+" : "-"}{formatCurrency(txn.grossAmount)}
                    </p>
                    <Badge status={txn.status} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed bg-gray-100 text-gray-600">
                <ChevronLeft size={16} /> Prev
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  const p = pages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= pages - 2 ? pages - 4 + i : page - 2 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${page === p ? "bg-[#038E80] text-white" : "bg-gray-100 text-gray-600"}`}>
                      {p}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed bg-gray-100 text-gray-600">
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}

          {!loading && (
            <p className="text-xs text-gray-400 text-center py-2">
              Showing {Math.min((page - 1) * 15 + 1, total)}–{Math.min(page * 15, total)} of {total}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
