"use client";
import { UserSidebar, MobileNav } from "@/components/layout/user-sidebar";
import { useAuth } from "@/components/shared/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TransactionsLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);
  if (!user) return null;
  return (
    <div className="flex min-h-screen">
      <UserSidebar />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
}
