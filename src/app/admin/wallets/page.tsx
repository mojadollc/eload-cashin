"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, SlidersHorizontal } from "lucide-react";

export default function AdminWalletsPage() {
  const api = useApi();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [adjForm, setAdjForm] = useState({ amount: "", entryType: "CREDIT", reason: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = (q = "") => api.get(`/api/admin/users?search=${q}`).then(d => setUsers(d?.users || []));
  useEffect(() => { load(); }, []);

  const handleAdjust = async () => {
    if (!selected) return;
    setLoading(true); setMsg("");
    const res = await api.post(`/api/admin/wallets/${selected.wallet?.id}/adjust`, {
      amount: Number(adjForm.amount),
      entryType: adjForm.entryType,
      reason: adjForm.reason,
    });
    setLoading(false);
    setMsg(res?.error || "Adjustment applied successfully");
    load(search);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold">Wallets</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E80]" placeholder="Search user..." value={search} onChange={e => { setSearch(e.target.value); load(e.target.value); }} />
          </div>
          <Card>
            <CardContent className="pt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b">
                    <th className="pb-2 font-medium">User</th>
                    <th className="pb-2 font-medium">Wallet ID</th>
                    <th className="pb-2 font-medium">Available</th>
                    <th className="pb-2 font-medium">Pending</th>
                    <th className="pb-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="py-2.5">
                        <p className="font-medium">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-400">{u.userId}</p>
                      </td>
                      <td className="py-2.5 font-mono text-xs text-gray-500">{u.wallet?.walletId || "—"}</td>
                      <td className="py-2.5 font-medium">{formatCurrency(u.wallet?.availableBalance || 0)}</td>
                      <td className="py-2.5 text-gray-500">{formatCurrency(u.wallet?.pendingBalance || 0)}</td>
                      <td className="py-2.5">
                        <button onClick={() => setSelected(u)} className="text-xs text-[#038E80] font-medium hover:underline flex items-center gap-1">
                          <SlidersHorizontal size={12} /> Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold">Manual Adjustment</h2>
            {selected ? (
              <>
                <div className="bg-gray-50 rounded-xl p-3 text-sm">
                  <p className="font-medium">{selected.firstName} {selected.lastName}</p>
                  <p className="text-xs text-gray-400">{selected.userId}</p>
                  <p className="text-xs text-gray-400 mt-1">Balance: {formatCurrency(selected.wallet?.availableBalance || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={adjForm.entryType} onChange={e => setAdjForm(f => ({ ...f, entryType: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E80]">
                    <option value="CREDIT">Credit (+)</option>
                    <option value="DEBIT">Debit (-)</option>
                  </select>
                </div>
                <Input label="Amount (₱)" type="number" placeholder="500" value={adjForm.amount} onChange={e => setAdjForm(f => ({ ...f, amount: e.target.value }))} />
                <Input label="Reason" placeholder="Approved refund..." value={adjForm.reason} onChange={e => setAdjForm(f => ({ ...f, reason: e.target.value }))} />
                {msg && <p className="text-sm text-gray-600">{msg}</p>}
                <Button className="w-full" loading={loading} onClick={handleAdjust} disabled={!adjForm.amount || !adjForm.reason}>Apply Adjustment</Button>
                <button onClick={() => setSelected(null)} className="text-xs text-gray-400 w-full text-center">Cancel</button>
              </>
            ) : (
              <p className="text-sm text-gray-400">Select a user to adjust their wallet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
