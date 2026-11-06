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
    <div className="flex min-h-screen min-h-[100dvh]">
      <UserSidebar />
      {/* Mobile: pad bottom for nav bar + safe area. Desktop: no pad. */}
      <main className="flex-1 overflow-x-hidden">
        <div className="lg:hidden" style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom))" }}>
          {children}
        </div>
        <div className="hidden lg:block">
          {children}
        </div>
      </main>
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
