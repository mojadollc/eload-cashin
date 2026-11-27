"use client";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminLayout as AdminGuard } from "@/components/shared/protected-layout";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen" style={{ background: "#f0f4f8" }}>
        <AdminSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </AdminGuard>
  );
}
