"use client";
import { useAuth } from "@/components/shared/auth-context";
import { useApi } from "@/components/shared/use-api";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { User, Phone, Mail, LogOut, ChevronRight, ChevronLeft, Shield, Bell, FileText, X, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const txIcon: Record<string, string> = { ELOAD: "📱", WALLET_FUND: "💰", CASHOUT: "💸", REFUND: "↩️", REVERSAL: "🔄" };

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3 w-20 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-2.5 w-28 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="space-y-1.5 items-end flex flex-col">
        <div className="h-3 w-14 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-4 w-12 bg-gray-200 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const api = useApi();
  const router = useRouter();

  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);
  if (!user) return null;

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();

  const fetchHistory = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "10" });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const d = await api.get(`/api/transactions?${params}`);
    setTransactions(d?.transactions || []);
    setTotal(d?.total || 0);
    setPages(d?.pages || 1);
    setPage(p);
    setLoading(false);
  }, [dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const openHistory = () => { setShowHistory(true); fetchHistory(1); };

  const applyDate = () => { setShowDateFilter(false); fetchHistory(1); };

  const clearDate = () => { setDateFrom(""); setDateTo(""); setShowDateFilter(false); fetchHistory(1); };

  return (
    <div className="min-h-screen bg-[#F7F9FA]">
      {/* Header */}
      <div className="bg-[#038E80] px-4 pt-6 pb-20">
        <h1 className="text-white text-xl font-bold">Profile</h1>
      </div>

      <div className="px-4 -mt-14 space-y-4 pb-8">
        {/* Avatar card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-[#038E80] flex items-center justify-center text-white text-2xl font-bold mb-3">
            {initials || <User size={32} />}
          </div>
          <h2 className="text-xl font-bold text-gray-800">{user.firstName} {user.lastName}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{user.mobile}</p>
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Phone size={16} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Mobile Number</p>
              <p className="text-sm font-semibold text-gray-800">{user.mobile}</p>
            </div>
          </div>
          {user.email && (
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                <Mail size={16} className="text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-semibold text-gray-800">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
          <button onClick={openHistory} className="flex items-center justify-between w-full px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                <FileText size={16} className="text-teal-500" />
              </div>
              <span className="text-sm font-medium text-gray-700">Transaction History</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <button className="flex items-center justify-between w-full px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                <Shield size={16} className="text-green-500" />
              </div>
              <span className="text-sm font-medium text-gray-700">Change Password</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <button className="flex items-center justify-between w-full px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                <Bell size={16} className="text-orange-500" />
              </div>
              <span className="text-sm font-medium text-gray-700">Notifications</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </div>

        {/* Transaction History Panel */}
        {showHistory && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-800">Transaction History</p>
                <p className="text-xs text-gray-400">{total} total records</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowDateFilter(v => !v)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${(dateFrom || dateTo) ? "bg-[#038E80] text-white" : "bg-gray-100 text-gray-600"}`}>
                  <Calendar size={12} /> Filter
                </button>
                <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-xl bg-gray-100">
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Date filter */}
            {showDateFilter && (
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">From</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#038E80]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">To</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#038E80]" />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[{ label: "Today", days: 0 }, { label: "7 days", days: 7 }, { label: "30 days", days: 30 }].map(({ label, days }) => (
                    <button key={label} onClick={() => {
                      const to = new Date(); const from = new Date();
                      from.setDate(from.getDate() - days);
                      setDateFrom(from.toISOString().slice(0, 10));
                      setDateTo(to.toISOString().slice(0, 10));
                    }} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-600">
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={clearDate} className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500">Clear</button>
                  <button onClick={applyDate} className="flex-[2] py-2 rounded-xl bg-[#038E80] text-white text-xs font-semibold">Apply</button>
                </div>
              </div>
            )}

            {/* Active date badge */}
            {(dateFrom || dateTo) && !showDateFilter && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#038E80]/5 border-b border-gray-100">
                <span className="text-xs font-semibold text-[#038E80]">📅 {dateFrom || "—"} → {dateTo || "—"}</span>
                <button onClick={clearDate} className="ml-auto"><X size={12} className="text-[#038E80]" /></button>
              </div>
            )}

            {/* List */}
            <div className="divide-y divide-gray-50 px-4">
              {loading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              ) : transactions.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-sm text-gray-400">No transactions found</p>
                </div>
              ) : transactions.map((txn: any) => (
                <div key={txn.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg shrink-0">
                      {txIcon[txn.type] || "💳"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{txn.type.replace(/_/g, " ")}</p>
                      <p className="text-[11px] text-gray-400">{formatDate(txn.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-0.5 shrink-0">
                    <p className={`text-sm font-bold ${txn.type === "WALLET_FUND" || txn.type === "REFUND" ? "text-green-600" : "text-red-500"}`}>
                      {txn.type === "WALLET_FUND" || txn.type === "REFUND" ? "+" : "-"}{formatCurrency(txn.grossAmount)}
                    </p>
                    <Badge status={txn.status} />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {!loading && pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <button onClick={() => fetchHistory(page - 1)} disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 bg-gray-100 text-gray-600">
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="text-xs text-gray-500 font-medium">Page {page} of {pages}</span>
                <button onClick={() => fetchHistory(page + 1)} disabled={page === pages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 bg-gray-100 text-gray-600">
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}

            {!loading && (
              <p className="text-xs text-gray-400 text-center py-2">
                Showing {Math.min((page - 1) * 10 + 1, total)}–{Math.min(page * 10, total)} of {total}
              </p>
            )}
          </div>
        )}

        {/* Sign out */}
        <button onClick={logout} className="w-full bg-white rounded-2xl shadow-sm px-4 py-4 flex items-center gap-3 text-red-500">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
            <LogOut size={16} className="text-red-500" />
          </div>
          <span className="text-sm font-semibold">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
