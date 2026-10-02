"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, DollarSign, Users, Activity } from "lucide-react";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

export default function AdminReportsPage() {
  const api = useApi();
  const [stats, setStats] = useState<any>(null);
  const [range, setRange] = useState("today");

  useEffect(() => { api.get(`/api/admin/reports?range=${range}`).then(setStats); }, [range]);

  const revenueBreakdown = stats?.revenueByType || [];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports & Revenue</h1>
        <div className="flex gap-2">
          {RANGES.map(r => (
            <button key={r.key} onClick={() => setRange(r.key)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${range === r.key ? "bg-[#038E80] text-white" : "bg-white text-gray-600 border"}`}>{r.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Volume", value: formatCurrency(stats?.totalVolume || 0), icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
          { label: "Platform Revenue", value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign, color: "text-[#038E80] bg-[#038E80]/10" },
          { label: "Transactions", value: stats?.totalTransactions?.toLocaleString() || "0", icon: Activity, color: "text-purple-600 bg-purple-50" },
          { label: "Active Users", value: stats?.activeUsers?.toLocaleString() || "0", icon: Users, color: "text-orange-600 bg-orange-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}><Icon size={18} /></div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Revenue Breakdown</h2>
          {revenueBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No revenue data for this period</p>
          ) : (
            <div className="space-y-3">
              {revenueBreakdown.map((r: any) => {
                const pct = stats?.totalRevenue > 0 ? (Number(r._sum?.feeAmount || 0) / stats.totalRevenue) * 100 : 0;
                return (
                  <div key={r.type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{r.type.replace("_", " ")}</span>
                      <span className="font-bold">{formatCurrency(r._sum?.feeAmount || 0)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#038E80] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Volume: {formatCurrency(r._sum?.grossAmount || 0)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Pending Transactions</h2>
            <p className="text-3xl font-bold text-yellow-600">{stats?.pendingTxns || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Failed Transactions</h2>
            <p className="text-3xl font-bold text-red-600">{stats?.failedTxns || 0}</p>
            <p className="text-xs text-gray-400 mt-1">In selected period</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
