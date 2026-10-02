"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

const SERVICES = ["WALLET_FUND", "ELOAD", "CASHOUT"];
const FEE_TYPES = ["FIXED", "PERCENTAGE"];

const emptyForm = { service: "WALLET_FUND", feeType: "FIXED", amount: "", rate: "", minimum: "", maximum: "" };

export default function AdminFeesPage() {
  const api = useApi();
  const [rules, setRules] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => api.get("/api/admin/fees").then(d => setRules(Array.isArray(d) ? d : []));
  useEffect(() => { load(); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAdd = async () => {
    setAdding(true);
    await api.post("/api/admin/fees", {
      service: form.service,
      feeType: form.feeType,
      ...(form.amount ? { amount: Number(form.amount) } : {}),
      ...(form.rate ? { rate: Number(form.rate) / 100 } : {}),
      ...(form.minimum ? { minimum: Number(form.minimum) } : {}),
      ...(form.maximum ? { maximum: Number(form.maximum) } : {}),
    });
    setAdding(false);
    setForm(emptyForm);
    load();
  };

  const startEdit = (r: any) => {
    setEditId(r.id);
    setEditData({
      feeType: r.feeType,
      amount: r.feeType === "FIXED" ? String(r.amount ?? "") : "",
      rate: r.feeType === "PERCENTAGE" ? String((Number(r.rate) * 100).toFixed(2)) : "",
      minimum: r.minimum ? String(r.minimum) : "",
      maximum: r.maximum ? String(r.maximum) : "",
      isActive: r.isActive,
    });
  };

  const handleEdit = async (id: string) => {
    await api.put(`/api/admin/fees/${id}`, {
      feeType: editData.feeType,
      ...(editData.amount ? { amount: Number(editData.amount) } : {}),
      ...(editData.rate ? { rate: Number(editData.rate) / 100 } : {}),
      ...(editData.minimum ? { minimum: Number(editData.minimum) } : {}),
      ...(editData.maximum ? { maximum: Number(editData.maximum) } : {}),
      isActive: editData.isActive,
    });
    setEditId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await api.del(`/api/admin/fees/${id}`);
    setDeletingId(null);
    load();
  };

  const grouped = SERVICES.reduce((acc, s) => {
    acc[s] = rules.filter(r => r.service === s);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold">Fees & Pricing</h1>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Add Fee Rule</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
              <select value={form.service} onChange={set("service")} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E80]">
                {SERVICES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
              <select value={form.feeType} onChange={set("feeType")} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E80]">
                {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {form.feeType === "FIXED"
              ? <Input label="Fixed Amount (₱)" type="number" placeholder="15" value={form.amount} onChange={set("amount")} />
              : <Input label="Rate (%)" type="number" placeholder="1.5" value={form.rate} onChange={set("rate")} />
            }
            <Input label="Min Transaction (₱)" type="number" placeholder="Optional" value={form.minimum} onChange={set("minimum")} />
            <Input label="Max Transaction (₱)" type="number" placeholder="Optional" value={form.maximum} onChange={set("maximum")} />
          </div>
          <Button className="mt-4" loading={adding} onClick={handleAdd}><Plus size={16} className="mr-1" /> Add Rule</Button>
        </CardContent>
      </Card>

      {SERVICES.map(service => (
        <Card key={service}>
          <CardContent className="pt-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{service.replace(/_/g, " ")}</h2>
            {grouped[service]?.length === 0 ? (
              <p className="text-sm text-gray-400">No fee rules configured</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b">
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Amount / Rate</th>
                    <th className="pb-2 font-medium">Min Txn</th>
                    <th className="pb-2 font-medium">Max Txn</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {grouped[service]?.map((r: any) => editId === r.id ? (
                    <tr key={r.id} className="bg-teal-50">
                      <td className="py-2 pr-2">
                        <select value={editData.feeType} onChange={e => setEditData((d: any) => ({ ...d, feeType: e.target.value, amount: "", rate: "" }))} className="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#038E80]">
                          {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        {editData.feeType === "FIXED"
                          ? <input type="number" value={editData.amount} onChange={e => setEditData((d: any) => ({ ...d, amount: e.target.value }))} className="w-24 px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#038E80]" placeholder="₱" />
                          : <input type="number" value={editData.rate} onChange={e => setEditData((d: any) => ({ ...d, rate: e.target.value }))} className="w-24 px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#038E80]" placeholder="%" />
                        }
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" value={editData.minimum} onChange={e => setEditData((d: any) => ({ ...d, minimum: e.target.value }))} className="w-24 px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#038E80]" placeholder="—" />
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" value={editData.maximum} onChange={e => setEditData((d: any) => ({ ...d, maximum: e.target.value }))} className="w-24 px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#038E80]" placeholder="—" />
                      </td>
                      <td className="py-2 pr-2">
                        <select value={editData.isActive ? "1" : "0"} onChange={e => setEditData((d: any) => ({ ...d, isActive: e.target.value === "1" }))} className="px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#038E80]">
                          <option value="1">Active</option>
                          <option value="0">Inactive</option>
                        </select>
                      </td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(r.id)} className="p-1.5 rounded-lg bg-[#038E80] text-white hover:bg-[#058174]"><Check size={13} /></button>
                          <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300"><X size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="py-2.5">{r.feeType}</td>
                      <td className="py-2.5 font-medium">
                        {r.feeType === "FIXED" ? formatCurrency(r.amount) : `${(Number(r.rate) * 100).toFixed(2)}%`}
                      </td>
                      <td className="py-2.5 text-gray-500">{r.minimum ? formatCurrency(r.minimum) : "—"}</td>
                      <td className="py-2.5 text-gray-500">{r.maximum ? formatCurrency(r.maximum) : "—"}</td>
                      <td className="py-2.5">
                        <span className={`text-xs font-medium ${r.isActive ? "text-green-600" : "text-gray-400"}`}>
                          {r.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(r)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#038E80]"><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(r.id)} disabled={deletingId === r.id} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
