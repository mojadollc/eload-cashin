"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUSES = ["All", "SUCCESS", "PENDING", "PROCESSING", "FAILED", "REVERSED"];

export default function AdminEloadPage() {
  const api = useApi();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [status, setStatus] = useState("All");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams({ type: "ELOAD" });
    if (status !== "All") params.set("status", status);
    api.get(`/api/admin/transactions?${params}`).then(d => {
      setTransactions(d?.transactions || []);
      setTotal(d?.total || 0);
    });
  }, [status]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">E-Load Transactions</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${status === s ? "bg-[#038E80] text-white" : "bg-white text-gray-600 border"}`}>{s}</button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="pb-2 font-medium">Transaction #</th>
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">Mobile</th>
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Fee</th>
                <th className="pb-2 font-medium">Provider Ref</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((txn: any) => (
                <tr key={txn.id} className="hover:bg-gray-50">
                  <td className="py-2.5 font-mono text-xs text-gray-500">{txn.transactionNumber}</td>
                  <td className="py-2.5">
                    <p className="font-medium">{txn.user?.firstName} {txn.user?.lastName}</p>
                    <p className="text-xs text-gray-400">{txn.user?.userId}</p>
                  </td>
                  <td className="py-2.5 text-xs">{txn.eloadTxn?.recipientMobile || "—"}</td>
                  <td className="py-2.5 text-xs">{txn.eloadTxn?.productCode || "—"}</td>
                  <td className="py-2.5 font-medium">{formatCurrency(txn.grossAmount)}</td>
                  <td className="py-2.5 text-gray-500">{formatCurrency(txn.feeAmount)}</td>
                  <td className="py-2.5 font-mono text-xs text-gray-400">{txn.eloadTxn?.providerRef || "—"}</td>
                  <td className="py-2.5"><Badge status={txn.status} /></td>
                  <td className="py-2.5 text-xs text-gray-400">{formatDate(txn.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No e-load transactions found</p>}
        </CardContent>
      </Card>
    </div>
  );
}
