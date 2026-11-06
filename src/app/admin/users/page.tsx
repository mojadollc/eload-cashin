"use client";
import { useEffect, useState, useCallback } from "react";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Search, X, User, Phone, Mail, Wallet, Receipt,
  ShieldCheck, ChevronRight, ChevronLeft, AlertTriangle,
  CheckCircle, XCircle, FileText, Calendar,
} from "lucide-react";

const STATUS_OPTIONS = ["ACTIVE", "SUSPENDED", "RESTRICTED"];
const KYC_OPTIONS = ["NONE", "PENDING", "VERIFIED", "REJECTED"];

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 shrink-0 w-32">{label}</span>
      <span className="text-xs font-medium text-gray-800 text-right break-all">{value}</span>
    </div>
  );
}

function UserDrawer({ userId, onClose, onUpdated }: { userId: string; onClose: () => void; onUpdated: () => void }) {
  const api = useApi();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"profile" | "wallet" | "transactions" | "kyc">("profile");

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/api/admin/users/${userId}`).then(d => { setUser(d?.user); setLoading(false); });
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (field: "status" | "kycStatus", value: string) => {
    setSaving(true);
    await api.patch(`/api/admin/users/${userId}`, { [field]: value });
    setSaving(false);
    load();
    onUpdated();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            {user && <p className="font-bold text-gray-900">{user.firstName} {user.lastName}</p>}
            {user && <p className="text-xs text-gray-400">{user.userId}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#038E80] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !user ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">User not found</div>
        ) : (
          <>
            {/* Status badges + quick actions */}
            <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
              <Badge status={user.status} />
              <Badge status={user.kycStatus} />
              <div className="ml-auto flex items-center gap-2">
                <select
                  value={user.status}
                  disabled={saving}
                  onChange={e => updateStatus("status", e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#038E80] disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={user.kycStatus}
                  disabled={saving}
                  onChange={e => updateStatus("kycStatus", e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#038E80] disabled:opacity-50"
                >
                  {KYC_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6">
              {(["profile", "wallet", "transactions", "kyc"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-3 text-xs font-semibold capitalize border-b-2 transition-all ${tab === t ? "border-[#038E80] text-[#038E80]" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">

              {/* ── PROFILE ── */}
              {tab === "profile" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#038E80]/10 flex items-center justify-center text-[#038E80] text-xl font-bold shrink-0">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-400">{user.role}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <DetailRow label="User ID" value={user.userId} />
                    <DetailRow label="Mobile" value={user.mobile} />
                    <DetailRow label="Email" value={user.email || "—"} />
                    <DetailRow label="Status" value={<Badge status={user.status} />} />
                    <DetailRow label="KYC" value={<Badge status={user.kycStatus} />} />
                    <DetailRow label="Mobile Verified" value={user.mobileVerified ? "Yes" : "No"} />
                    <DetailRow label="2FA Enabled" value={user.twoFaEnabled ? "Yes" : "No"} />
                    <DetailRow label="Referral Code" value={user.referralCode || "—"} />
                    <DetailRow label="Referred By" value={user.referredBy || "—"} />
                    <DetailRow label="Total Transactions" value={user._count?.transactions ?? 0} />
                    <DetailRow label="Joined" value={formatDate(user.createdAt)} />
                  </div>
                </div>
              )}

              {/* ── WALLET ── */}
              {tab === "wallet" && (
                <div className="space-y-4">
                  {user.wallet ? (
                    <>
                      <div className="rounded-2xl text-white p-5 space-y-3"
                        style={{ background: "linear-gradient(135deg, #038E80 0%, #026b62 50%, #025a52 100%)" }}>
                        <p className="text-white/60 text-xs uppercase tracking-widest">Available Balance</p>
                        <p className="text-3xl font-bold">{formatCurrency(user.wallet.availableBalance)}</p>
                        {Number(user.wallet.pendingBalance) > 0 && (
                          <p className="text-white/50 text-xs">+ {formatCurrency(user.wallet.pendingBalance)} pending</p>
                        )}
                        <p className="text-white/60 text-xs font-mono tracking-widest">
                          {user.wallet.accountNumber?.replace(/(.{4})/g, "$1 ").trim()}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <DetailRow label="Wallet ID" value={user.wallet.walletId} />
                        <DetailRow label="Account No." value={user.wallet.accountNumber} />
                        <DetailRow label="Currency" value={user.wallet.currency} />
                        <DetailRow label="Status" value={<Badge status={user.wallet.status} />} />
                      </div>
                      {user.wallet.ledgerEntries?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent Ledger</p>
                          <div className="space-y-2">
                            {user.wallet.ledgerEntries.map((e: any) => (
                              <div key={e.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                                <div>
                                  <p className="text-xs font-medium text-gray-700">{e.description || e.entryType}</p>
                                  <p className="text-[10px] text-gray-400">{formatDate(e.createdAt)}</p>
                                </div>
                                <p className={`text-xs font-bold ${e.entryType === "CREDIT" ? "text-green-600" : "text-gray-700"}`}>
                                  {e.entryType === "CREDIT" ? "+" : "-"}{formatCurrency(e.amount)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-8">No wallet found</p>
                  )}
                </div>
              )}

              {/* ── TRANSACTIONS ── */}
              {tab === "transactions" && (
                <div className="space-y-2">
                  {user.transactions?.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">No transactions</p>
                  )}
                  {user.transactions?.map((txn: any) => (
                    <div key={txn.id} className="bg-gray-50 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-gray-800">{txn.transactionNumber}</p>
                        <Badge status={txn.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">{txn.type.replace(/_/g, " ")} · {formatDate(txn.createdAt)}</p>
                        <p className="text-xs font-semibold text-gray-700">{formatCurrency(txn.grossAmount)}</p>
                      </div>
                      {txn.eloadTxn && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{txn.eloadTxn.network} · {txn.eloadTxn.mobileNumber}</p>
                      )}
                      {txn.cashoutTxn && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{txn.cashoutTxn.channel} · {txn.cashoutTxn.accountNumber}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── KYC ── */}
              {tab === "kyc" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-semibold text-gray-700">KYC Status:</p>
                    <Badge status={user.kycStatus} />
                  </div>
                  {user.kycDocuments?.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">No documents submitted</p>
                  )}
                  {user.kycDocuments?.map((doc: any) => (
                    <div key={doc.id} className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-800">{doc.docType.replace(/_/g, " ")}</p>
                        <Badge status={doc.status} />
                      </div>
                      {doc.reviewNote && <p className="text-xs text-gray-500">{doc.reviewNote}</p>}
                      <p className="text-[10px] text-gray-400">{formatDate(doc.createdAt)}</p>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#038E80] font-semibold hover:underline">
                        <FileText size={12} /> View Document
                      </a>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </>
  );
}

export default function AdminUsersPage() {
  const api = useApi();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback((q = search, p = page) => {
    api.get(`/api/admin/users?search=${q}&page=${p}`).then(d => {
      setUsers(d?.users || []);
      setTotal(d?.total || 0);
      setPages(d?.pages || 1);
    });
  }, [search, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load("", 1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (q: string) => { setSearch(q); setPage(1); load(q, 1); };
  const handlePage = (p: number) => { setPage(p); load(search, p); };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E80]"
          placeholder="Search name, mobile, email..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">Mobile</th>
                <th className="pb-2 font-medium">Balance</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">KYC</th>
                <th className="pb-2 font-medium">Joined</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u: any) => (
                <tr key={u.id}
                  onClick={() => setSelectedId(u.id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-400">{u.userId}</p>
                  </td>
                  <td className="py-3 pr-4 text-gray-600 text-xs">{u.mobile}</td>
                  <td className="py-3 pr-4 font-semibold text-sm">{formatCurrency(u.wallet?.availableBalance || 0)}</td>
                  <td className="py-3 pr-4"><Badge status={u.status} /></td>
                  <td className="py-3 pr-4"><Badge status={u.kycStatus} /></td>
                  <td className="py-3 pr-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(u.createdAt)}</td>
                  <td className="py-3">
                    <ChevronRight size={16} className="text-gray-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No users found</p>}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={() => handlePage(page - 1)} disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            <ChevronLeft size={15} /> Prev
          </button>
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <button onClick={() => handlePage(page + 1)} disabled={page === pages}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Drawer */}
      {selectedId && (
        <UserDrawer
          userId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={() => load()}
        />
      )}
    </div>
  );
}
