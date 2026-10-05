"use client";
import { useEffect, useState, useCallback } from "react";
import { useApi } from "@/components/shared/use-api";
import { RefreshCw, Wifi, WifiOff, Search, CheckCircle, XCircle, Activity } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Sku {
  promoId: number;
  name: string;
  network: string;
  service: string;
  category: string;
  amount: number;
  description: string;
  validity: string;
  addressType: string;
  isActive: boolean;
}

interface NetworkStat {
  network: string;
  active: number;
  inactive: number;
  total: number;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  networks: number;
  balance: number | null;
  fetchedAt: string;
}

function SkeletonCard() {
  return <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />;
}

function SkeletonRow() {
  return (
    <tr>
      {[40, 28, 20, 16, 16, 16, 14].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`h-3 bg-gray-200 rounded-full animate-pulse w-${w}`} style={{ width: `${w * 4}px` }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminGbitsPage() {
  const api = useApi();
  const [skus, setSkus] = useState<Sku[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [byNetwork, setByNetwork] = useState<NetworkStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterNetwork, setFilterNetwork] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const fetchSkus = useCallback(async () => {
    setLoading(true);
    setError("");
    const data = await api.get("/api/admin/gbits");
    if (data?.error) { setError(data.error); setLoading(false); return; }
    setSkus(data?.skus || []);
    setStats(data?.stats || null);
    setByNetwork(data?.byNetwork || []);
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchSkus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const networks = ["All", ...byNetwork.map(n => n.network)];
  const categories = ["All", ...([...new Set(skus.map(s => s.category).filter(Boolean))] as string[])];

  const filtered = skus
    .filter(s => filterNetwork === "All" || s.network === filterNetwork)
    .filter(s => filterStatus === "All" || (filterStatus === "Active" ? s.isActive : !s.isActive))
    .filter(s => filterCategory === "All" || s.category === filterCategory)
    .filter(s => !search.trim() || s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.network.toLowerCase().includes(search.toLowerCase()) ||
      String(s.promoId).includes(search) ||
      String(s.amount).includes(search));

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = () => setPage(1);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">GBits SKU Monitor</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {stats ? `Last fetched: ${new Date(stats.fetchedAt).toLocaleString("en-PH")}` : "Live data from GBits API"}
          </p>
        </div>
        <button onClick={fetchSkus} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#038E80] text-white rounded-xl text-sm font-semibold hover:bg-[#058174] disabled:opacity-60 transition-all">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          {loading ? "Fetching..." : "Refresh"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <WifiOff size={20} className="text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">GBits API Error</p>
            <p className="text-xs text-red-500 mt-0.5">{error}</p>
          </div>
          <button onClick={fetchSkus} className="ml-auto px-3 py-1.5 bg-red-100 text-red-600 rounded-xl text-xs font-semibold">Retry</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? [...Array(5)].map((_, i) => <SkeletonCard key={i} />) : stats ? (
          <>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                <Activity size={18} className="text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total SKUs</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mb-3">
                <CheckCircle size={18} className="text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-gray-500 mt-0.5">Active SKUs</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center mb-3">
                <XCircle size={18} className="text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-500">{stats.inactive}</p>
              <p className="text-xs text-gray-500 mt-0.5">Inactive SKUs</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                <Wifi size={18} className="text-purple-600" />
              </div>
              <p className="text-2xl font-bold">{stats.networks}</p>
              <p className="text-xs text-gray-500 mt-0.5">Networks</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-[#038E80]/10 flex items-center justify-center mb-3">
                <span className="text-[#038E80] font-black text-sm">₱</span>
              </div>
              <p className="text-2xl font-bold text-[#038E80]">
                {stats.balance != null ? formatCurrency(stats.balance) : "—"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">GBits Balance</p>
            </div>
          </>
        ) : null}
      </div>

      {/* Network breakdown */}
      {!loading && byNetwork.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Network Breakdown</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b bg-gray-50">
                  <th className="px-5 py-2.5 font-semibold">Network</th>
                  <th className="px-4 py-2.5 font-semibold text-center">Total</th>
                  <th className="px-4 py-2.5 font-semibold text-center">Active</th>
                  <th className="px-4 py-2.5 font-semibold text-center">Inactive</th>
                  <th className="px-4 py-2.5 font-semibold">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {byNetwork.map(n => {
                  const pct = n.total > 0 ? Math.round((n.active / n.total) * 100) : 0;
                  return (
                    <tr key={n.network} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-gray-800">{n.network}</td>
                      <td className="px-4 py-3 text-center font-mono text-gray-600">{n.total}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                          <CheckCircle size={12} /> {n.active}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {n.inactive > 0
                          ? <span className="inline-flex items-center gap-1 text-red-500 font-semibold"><XCircle size={12} /> {n.inactive}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#10b981" : pct >= 70 ? "#f59e0b" : "#ef4444" }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-500 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SKU Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              All SKUs <span className="text-gray-400 font-normal">({filtered.length} shown)</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search name, network, promo ID, amount..." value={search}
                onChange={e => { setSearch(e.target.value); resetPage(); }}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#038E80]" />
            </div>
            {/* Status filter */}
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); resetPage(); }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#038E80] bg-white">
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            {/* Network filter */}
            <select value={filterNetwork} onChange={e => { setFilterNetwork(e.target.value); resetPage(); }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#038E80] bg-white">
              {networks.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            {/* Category filter */}
            <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); resetPage(); }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#038E80] bg-white">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b bg-gray-50">
                <th className="px-4 py-3 font-semibold">Promo ID</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Network</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Validity</th>
                <th className="px-4 py-3 font-semibold">Address</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-gray-400 text-sm">
                    No SKUs match your filters
                  </td>
                </tr>
              ) : paginated.map(sku => (
                <tr key={sku.promoId} className={`hover:bg-gray-50 transition-colors ${!sku.isActive ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{sku.promoId}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800 text-sm">{sku.name}</p>
                    {sku.description && <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{sku.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">{sku.network}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{sku.category || "—"}</td>
                  <td className="px-4 py-3 font-bold text-gray-800">₱{sku.amount}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{sku.validity || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{sku.addressType || "—"}</td>
                  <td className="px-4 py-3">
                    {sku.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-semibold">
                        <CheckCircle size={11} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-semibold">
                        <XCircle size={11} /> Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 disabled:opacity-40">← Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${page === p ? "bg-[#038E80] text-white" : "bg-gray-100 text-gray-600"}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
