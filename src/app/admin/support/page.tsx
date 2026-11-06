"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/components/shared/use-api";
import { formatDate } from "@/lib/utils";
import { Send, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_STYLE: Record<string, string> = {
  OPEN:        "bg-blue-50 text-blue-600",
  IN_PROGRESS: "bg-yellow-50 text-yellow-600",
  RESOLVED:    "bg-green-50 text-green-600",
  CLOSED:      "bg-gray-100 text-gray-500",
};

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export default function AdminSupportPage() {
  const api = useApi();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const load = (status = filterStatus) =>
    api.get(`/api/admin/support${status ? `?status=${status}` : ""}`).then((d: any) => setTickets(d?.tickets || []));

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openThread = (ticket: any) => { setSelected(ticket); setNewStatus(ticket.status); setReply(""); };

  const handleAction = async () => {
    if (!reply.trim() && !newStatus) return;
    setLoading(true);
    await api.post(`/api/admin/support/${selected.id}`, {
      ...(reply.trim() ? { message: reply } : {}),
      ...(newStatus !== selected.status ? { status: newStatus } : {}),
    });
    setReply("");
    const fresh: any = await api.get(`/api/admin/support`);
    const updated = fresh?.tickets?.find((t: any) => t.id === selected.id);
    if (updated) setSelected(updated);
    setTickets(fresh?.tickets || []);
    setLoading(false);
  };

  // ── THREAD VIEW ──────────────────────────────────────────────────────────────
  if (selected) return (
    <div className="p-6 max-w-2xl">
      <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4">
        <ChevronLeft size={16} /> All Tickets
      </button>

      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 space-y-1">
        <div className="flex items-center justify-between">
          <p className="font-bold text-gray-800">{selected.subject}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[selected.status]}`}>{selected.status.replace("_", " ")}</span>
        </div>
        <p className="text-xs text-gray-400">{selected.ticketNumber} · {selected.category}</p>
        <p className="text-xs text-gray-500 font-medium">{selected.user?.firstName} {selected.user?.lastName} — {selected.user?.mobile}</p>
      </div>

      <div className="space-y-3 mb-4">
        {selected.replies.map((r: any) => (
          <div key={r.id} className={`flex ${r.isAdmin ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${r.isAdmin ? "bg-[#038E80] text-white" : "bg-white shadow-sm text-gray-800"}`}>
              {r.isAdmin && <p className="text-[10px] font-bold text-white/70 mb-1">Support Team</p>}
              <p>{r.message}</p>
              <p className={`text-[10px] mt-1 ${r.isAdmin ? "text-white/60" : "text-gray-400"}`}>{formatDate(r.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-gray-500">Status:</p>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setNewStatus(s)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-xl border-2 transition-all ${newStatus === s ? "border-[#038E80] bg-[#038E80]/5 text-[#038E80]" : "border-gray-200 text-gray-400"}`}>
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Reply to user..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#038E80]"
          />
          <Button onClick={handleAction} loading={loading} disabled={!reply.trim() && newStatus === selected.status} className="shrink-0 px-4">
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );

  // ── TICKET LIST ──────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Support Tickets</h1>
        <div className="flex gap-2">
          {["", ...STATUSES].map(s => (
            <button key={s} onClick={() => { setFilterStatus(s); load(s); }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${filterStatus === s ? "bg-[#038E80] text-white" : "bg-gray-100 text-gray-500"}`}>
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {tickets.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-16">No tickets found</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Ticket", "User", "Category", "Status", "Updated"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.map((t: any) => (
                <tr key={t.id} onClick={() => openThread(t)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800 truncate max-w-[200px]">{t.subject}</p>
                    <p className="text-xs text-gray-400">{t.ticketNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700">{t.user?.firstName} {t.user?.lastName}</p>
                    <p className="text-xs text-gray-400">{t.user?.mobile}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t.category}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[t.status]}`}>
                      {t.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDate(t.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
