"use client";
import { UserSidebar, MobileNav } from "@/components/layout/user-sidebar";
import { useAuth } from "@/components/shared/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Spinner = () => (
  <div className="min-h-screen bg-[#F7F9FA] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-[#038E80] border-t-transparent rounded-full animate-spin" />
  </div>
);

export function UserLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) router.push("/login");
  }, [user, router]);

  if (!user) return <Spinner />;

  return (
    <div className="flex min-h-screen">
      <UserSidebar />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) router.push("/login");
    else if (!isAdmin) router.push("/dashboard");
  }, [user, isAdmin, router]);

  if (!user || !isAdmin) return <Spinner />;

  return <>{children}</>;
}
