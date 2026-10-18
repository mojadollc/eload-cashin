"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Users, TrendingUp, DollarSign, AlertCircle, Clock, Smartphone, ArrowDownCircle, Wallet, ArrowRightLeft, ChevronLeft, ChevronRight } from "lucide-react";

const RANGES = ["today", "week", "month", "year"];

function SkeletonKpi() {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="w-9 h-9 rounded-xl bg-gray-200 animate-pulse mb-3" />
        <div className="h-7 w-20 bg-gray-200 rounded-full animate-pulse" />
        <div className="h-3 w-16 bg-gray-200 rounded-full animate-pulse mt-2" />
      </CardContent>
    </Card>
  );
}

function SkeletonServiceCard() {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gray-200 animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 rounded-full animate-pulse" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 w-20 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-3 w-16 bg-gray-200 rounded-full animate-pulse" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SkeletonTxnRow() {
  return (
    <tr>
      {[120, 100, 70, 70, 60, 60].map((w, i) => (
        <td key={i} className="py-3 pr-4">
          <div className="h-3 bg-gray-200 rounded-full animate-pulse" style={{ width: `${w}px` }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminDashboard() {
  const api = useApi();
  const [stats, setStats] = useState<any>(null);
  const [range, setRange] = useState("today");
  const [recentTxns, setRecentTxns] = useState<any[]>([]);
  const [txnPage, setTxnPage] = useState(1);
  const [txnPages, setTxnPages] = useState(1);
  const [txnTotal, setTxnTotal] = useState(0);
  const [txnLoading, setTxnLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadTxns = async (p = 1) => {
    setTxnLoading(true);
    const d = await api.get(`/api/admin/transactions?limit=10&page=${p}`);
    setRecentTxns(d?.transactions || []);
    setTxnPages(d?.pages || 1);
    setTxnTotal(d?.total || 0);
    setTxnPage(p);
    setTxnLoading(false);
  };

  useEffect(() => {
    setStatsLoading(true);
    api.get(`/api/admin/reports?range=${range}`).then(d => { setStats(d); setStatsLoading(false); });
    loadTxns(1);
  }, [range]); // eslint-disable-line react-hooks/exhaustive-deps

  const kpis = stats ? [
    { label: "Total Users",    value: stats.totalUsers?.toLocaleString(),        icon: Users,           color: "text-blue-600 bg-blue-50" },
    { label: "Active Users",   value: stats.activeUsers?.toLocaleString(),       icon: Users,           color: "text-green-600 bg-green-50" },
    { label: "Total Volume",   value: formatCurrency(stats.totalVolume || 0),    icon: TrendingUp,      color: "text-purple-600 bg-purple-50" },
    { label: "Net Revenue",    value: formatCurrency(stats.totalRevenue || 0),   icon: DollarSign,      color: "text-[#038E80] bg-[#038E80]/10" },
    { label: "Pending",        value: stats.pendingTxns?.toLocaleString(),       icon: Clock,           color: "text-yellow-600 bg-yellow-50" },
    { label: "Failed",         value: stats.failedTxns?.toLocaleString(),        icon: AlertCircle,     color: "text-red-600 bg-red-50" },
  ] : [];

  const serviceCards = stats ? [
    {
      label: "Wallet Funding",
      icon: Wallet,
      color: "text-blue-600",
      bg: "bg-blue-50",
      count: stats.walletFundCount ?? 0,
      volume: stats.walletFundVolume ?? 0,
      revenue: stats.walletFundFee ?? 0,
      providerCost: 0,
    },
    {
      label: "E-Load",
      icon: Smartphone,
      color: "text-green-600",
      bg: "bg-green-50",
      count: stats.eloadCount ?? 0,
      volume: stats.eloadVolume ?? 0,
      revenue: stats.eloadFee ?? 0,
      providerCost: 0,
    },
    {
      label: "Cash Out",
      icon: ArrowDownCircle,
      color: "text-purple-600",
      bg: "bg-purple-50",
      count: stats.cashoutCount ?? 0,
      volume: stats.cashoutVolume ?? 0,
      revenue: stats.cashoutRevenue ?? 0,
      providerCost: stats.cashoutCount ? stats.cashoutCount * 10 : 0,
      grossFee: stats.cashoutFee ?? 0,
    },
    {
      label: "Transfers",
      icon: ArrowRightLeft,
      color: "text-teal-600",
      bg: "bg-teal-50",
      count: stats.transferCount ?? 0,
      volume: 0,
      revenue: 0,
      providerCost: 0,
      free: true,
    },
  ] : [];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm">Good day, Admin</p>
        </div>
        <div className="flex gap-2">
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${range === r ? "bg-[#038E80] text-white" : "bg-white text-gray-600 border"}`}>{r}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsLoading
          ? [...Array(6)].map((_, i) => <SkeletonKpi key={i} />)
          : kpis.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon size={18} />
                </div>
                <p className="text-2xl font-bold">{value ?? "—"}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </CardContent>
            </Card>
          ))
        }
      </div>

      {/* Service Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsLoading
          ? [...Array(4)].map((_, i) => <SkeletonServiceCard key={i} />)
          : serviceCards.map(({ label, icon: Icon, color, bg, count, volume, revenue, providerCost, grossFee, free }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
                  <Icon size={16} className={color} />
                </div>
                <p className="font-semibold text-sm text-gray-700">{label}</p>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Transactions</span>
                  <span className="font-semibold">{count.toLocaleString()}</span>
                </div>
                {!free && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Volume</span>
                    <span className="font-semibold">{formatCurrency(volume)}</span>
                  </div>
                )}
                {providerCost > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Gross Fee</span>
                      <span className="font-semibold">{formatCurrency(grossFee ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Provider Cost</span>
                      <span className="font-semibold text-red-500">-{formatCurrency(providerCost)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t pt-1.5">
                  <span className="font-semibold text-gray-600">Net Revenue</span>
                  <span className={`font-bold ${free ? "text-gray-400" : "text-[#038E80]"}`}>
                    {free ? "FREE" : formatCurrency(revenue)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Transactions</h2>
            <span className="text-xs text-gray-400">{txnTotal.toLocaleString()} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b">
                  <th className="pb-2 font-medium">Txn No.</th>
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Fee</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {txnLoading
                  ? [...Array(10)].map((_, i) => <SkeletonTxnRow key={i} />)
                  : recentTxns.map((txn: any) => (
                    <tr key={txn.id}>
                      <td className="py-2.5 font-mono text-xs text-gray-500">{txn.transactionNumber}</td>
                      <td className="py-2.5">{txn.user?.firstName} {txn.user?.lastName}</td>
                      <td className="py-2.5 text-xs">{txn.type.replace(/_/g, " ")}</td>
                      <td className="py-2.5 font-medium">{formatCurrency(txn.grossAmount)}</td>
                      <td className="py-2.5 text-gray-500">{formatCurrency(txn.feeAmount)}</td>
                      <td className="py-2.5"><Badge status={txn.status} /></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {!txnLoading && txnPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-2">
              <button onClick={() => loadTxns(txnPage - 1)} disabled={txnPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold disabled:opacity-40 bg-gray-100 text-gray-600">
                <ChevronLeft size={16} /> Prev
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, txnPages) }, (_, i) => {
                  const p = txnPages <= 5 ? i + 1 : txnPage <= 3 ? i + 1 : txnPage >= txnPages - 2 ? txnPages - 4 + i : txnPage - 2 + i;
                  return (
                    <button key={p} onClick={() => loadTxns(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${txnPage === p ? "bg-[#038E80] text-white" : "bg-gray-100 text-gray-600"}`}>
                      {p}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => loadTxns(txnPage + 1)} disabled={txnPage === txnPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold disabled:opacity-40 bg-gray-100 text-gray-600">
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
          {!txnLoading && (
            <p className="text-xs text-gray-400 text-center pt-2">
              Showing {txnTotal === 0 ? 0 : Math.min((txnPage - 1) * 10 + 1, txnTotal)}–{Math.min(txnPage * 10, txnTotal)} of {txnTotal.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
