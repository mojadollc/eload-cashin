"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/components/shared/use-api";
import { formatDate } from "@/lib/utils";
import { Plus, ChevronLeft, Send, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES = ["WALLET", "ELOAD", "CASHOUT", "ACCOUNT", "OTHER"];

const STATUS_STYLE: Record<string, string> = {
  OPEN:        "bg-blue-50 text-blue-600",
  IN_PROGRESS: "bg-yellow-50 text-yellow-600",
  RESOLVED:    "bg-green-50 text-green-600",
  CLOSED:      "bg-gray-100 text-gray-500",
};

export default function SupportPage() {
  const api = useApi();
  const [tickets, setTickets] = useState<any[]>([]);
  const [view, setView] = useState<"list" | "new" | "thread">("list");
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ category: "WALLET", subject: "", message: "" });
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => api.get("/api/support").then((d: any) => setTickets(d?.tickets || []));

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openThread = (ticket: any) => { setSelected(ticket); setView("thread"); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res: any = await api.post("/api/support", form);
    if (res?.ticket) { await load(); setView("list"); setForm({ category: "WALLET", subject: "", message: "" }); }
    else setError(res?.error || "Failed to submit ticket");
    setLoading(false);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setLoading(true);
    await api.post(`/api/support/${selected.id}/reply`, { message: reply });
    setReply("");
    const fresh: any = await api.get("/api/support");
    const updated = fresh?.tickets?.find((t: any) => t.id === selected.id);
    if (updated) setSelected(updated);
    setTickets(fresh?.tickets || []);
    setLoading(false);
  };

  // ── THREAD VIEW ──────────────────────────────────────────────────────────────
  if (view === "thread" && selected) return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ChevronLeft size={16} /> Back
      </button>
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-1">
        <div className="flex items-center justify-between">
          <p className="font-bold text-gray-800">{selected.subject}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[selected.status]}`}>{selected.status.replace("_", " ")}</span>
        </div>
        <p className="text-xs text-gray-400">{selected.ticketNumber} · {selected.category}</p>
      </div>

      <div className="space-y-3">
        {selected.replies.map((r: any) => (
          <div key={r.id} className={`flex ${r.isAdmin ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${r.isAdmin ? "bg-white shadow-sm text-gray-800" : "bg-[#038E80] text-white"}`}>
              {r.isAdmin && <p className="text-[10px] font-bold text-[#038E80] mb-1">Support Team</p>}
              <p>{r.message}</p>
              <p className={`text-[10px] mt-1 ${r.isAdmin ? "text-gray-400" : "text-white/60"}`}>{formatDate(r.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      {selected.status !== "CLOSED" && (
        <form onSubmit={handleReply} className="flex gap-2 sticky bottom-20 lg:bottom-4">
          <input
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Type a reply..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#038E80]"
          />
          <Button type="submit" loading={loading} disabled={!reply.trim()} className="shrink-0 px-4">
            <Send size={16} />
          </Button>
        </form>
      )}
      {selected.status === "CLOSED" && (
        <p className="text-center text-xs text-gray-400 py-2">This ticket is closed.</p>
      )}
    </div>
  );

  // ── NEW TICKET FORM ──────────────────────────────────────────────────────────
  if (view === "new") return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ChevronLeft size={16} /> Back
      </button>
      <h1 className="text-xl font-bold text-gray-800">New Support Ticket</h1>
      <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, category: c }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${form.category === c ? "border-[#038E80] bg-[#038E80]/5 text-[#038E80]" : "border-gray-200 text-gray-500"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <Input label="Subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Brief description of your issue" required />
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">Message</p>
          <textarea
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            placeholder="Describe your issue in detail..."
            rows={5}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#038E80] resize-none"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>Submit Ticket</Button>
      </form>
    </div>
  );

  // ── TICKET LIST ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Support</h1>
        <Button size="sm" onClick={() => setView("new")} className="flex items-center gap-1.5">
          <Plus size={14} /> New Ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <HeadphonesIcon size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-400">No tickets yet</p>
          <p className="text-xs text-gray-300 mt-1">Submit a ticket if you need help</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t: any) => (
            <button key={t.id} onClick={() => openThread(t)}
              className="w-full bg-white rounded-2xl shadow-sm p-4 text-left hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{t.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.ticketNumber} · {t.category} · {formatDate(t.updatedAt)}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[t.status]}`}>
                  {t.status.replace("_", " ")}
                </span>
              </div>
              {t.replies?.length > 0 && (
                <p className="text-xs text-gray-400 mt-2 truncate">{t.replies[t.replies.length - 1].message}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
