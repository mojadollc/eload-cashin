"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/components/shared/use-api";
import { UserSidebar, MobileNav } from "@/components/layout/user-sidebar";
import { useAuth } from "@/components/shared/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const api = useApi();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);
  useEffect(() => { api.get("/api/notifications").then(d => setNotifications(d?.notifications || [])); }, []);

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <UserSidebar />
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-4">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <Card>
            <CardContent className="pt-4">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((n: any) => (
                    <div key={n.id} className={`p-4 rounded-xl transition-all ${n.read ? "bg-white" : "bg-[#038E80]/5 border border-[#038E80]/10"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{n.title}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                        </div>
                        <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(n.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
