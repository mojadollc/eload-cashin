"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default function AdminAuditPage() {
  const api = useApi();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    api.get(`/api/admin/audit?page=${page}`).then(d => {
      setLogs(d?.logs || []);
      setTotal(d?.total || 0);
      setPages(d?.pages || 1);
    });
  }, [page]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium">Entity</th>
                <th className="pb-2 font-medium">Entity ID</th>
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">Admin ID</th>
                <th className="pb-2 font-medium">IP Address</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="py-2.5 font-medium text-xs">{log.action}</td>
                  <td className="py-2.5 text-xs text-gray-500">{log.entity || "—"}</td>
                  <td className="py-2.5 font-mono text-xs text-gray-400">{log.entityId || "—"}</td>
                  <td className="py-2.5 text-xs">
                    {log.user ? (
                      <>
                        <p>{log.user.firstName} {log.user.lastName}</p>
                        <p className="text-gray-400">{log.user.userId}</p>
                      </>
                    ) : "—"}
                  </td>
                  <td className="py-2.5 font-mono text-xs text-gray-400">{log.adminId || "—"}</td>
                  <td className="py-2.5 text-xs text-gray-400">{log.ipAddress || "—"}</td>
                  <td className="py-2.5 text-xs text-gray-400">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No audit logs found</p>}
        </CardContent>
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border text-sm disabled:opacity-40">Prev</button>
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1 rounded border text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
