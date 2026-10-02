"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search } from "lucide-react";

export default function AdminUsersPage() {
  const api = useApi();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  const load = (q = "") => {
    api.get(`/api/admin/users?search=${q}`).then(d => { setUsers(d?.users || []); setTotal(d?.total || 0); });
  };

  useEffect(() => { load(); }, []);

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
          onChange={e => { setSearch(e.target.value); load(e.target.value); }}
        />
      </div>

      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">Mobile</th>
                <th className="pb-2 font-medium">Wallet Balance</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">KYC</th>
                <th className="pb-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="py-3">
                    <p className="font-medium">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-400">{u.userId}</p>
                  </td>
                  <td className="py-3 text-gray-600">{u.mobile}</td>
                  <td className="py-3 font-medium">{formatCurrency(u.wallet?.availableBalance || 0)}</td>
                  <td className="py-3"><Badge status={u.status} /></td>
                  <td className="py-3"><Badge status={u.kycStatus} /></td>
                  <td className="py-3 text-gray-400 text-xs">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No users found</p>}
        </CardContent>
      </Card>
    </div>
  );
}
