"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/shared/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Wallet, Smartphone, SendHorizonal,
  ArrowLeftRight, Receipt, Bell, UserCircle2, LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Home" },
  { href: "/wallet",        icon: Wallet,          label: "Wallet" },
  { href: "/eload",         icon: Smartphone,      label: "E-Load" },
  { href: "/cashout",       icon: SendHorizonal,   label: "Send" },
  { href: "/transfer",      icon: ArrowLeftRight,  label: "Transfer" },
  { href: "/transactions",  icon: Receipt,         label: "Transactions" },
  { href: "/notifications", icon: Bell,            label: "Notifications" },
  { href: "/profile",       icon: UserCircle2,     label: "Profile" },
];

const mobileItems = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Home" },
  { href: "/wallet",       icon: Wallet,          label: "Wallet" },
  { href: "/eload",        icon: Smartphone,      label: "E-Load" },
  { href: "/cashout",      icon: SendHorizonal,   label: "Send" },
  { href: "/profile",      icon: UserCircle2,     label: "More" },
];

export function UserSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#038E80] flex items-center justify-center">
            <Wallet size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">CashIn <span className="text-[#038E80]">Tap</span></span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active ? "bg-[#038E80] text-white shadow-sm shadow-[#038E80]/30" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              )}>
              <Icon size={17} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-[#038E80]/10 flex items-center justify-center text-[#038E80] text-xs font-bold shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-400 truncate">{user?.mobile}</p>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-all">
          <LogOut size={17} /> Sign Out
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100">
      <div className="flex items-center px-2 py-1">
        {mobileItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 relative">
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#038E80]" />
              )}
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                active ? "bg-[#038E80]/10" : ""
              )}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8}
                  className={active ? "text-[#038E80]" : "text-gray-400"} />
              </div>
              <span className={cn("text-[10px] font-semibold", active ? "text-[#038E80]" : "text-gray-400")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
