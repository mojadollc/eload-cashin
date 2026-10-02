"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/shared/auth-context";
import { cn } from "@/lib/utils";
import { Home, Wallet, Smartphone, ArrowDownCircle, List, Bell, User, LogOut, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/eload", icon: Smartphone, label: "E-Load" },
  { href: "/cashout", icon: ArrowDownCircle, label: "Send" },
  { href: "/transactions", icon: List, label: "Transactions" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function UserSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 min-h-screen">
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-xl font-bold text-[#038E80]">CashIn Tap</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all", pathname === href ? "bg-[#038E80] text-white" : "text-gray-600 hover:bg-gray-50")}>
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 py-2 text-sm text-gray-500">{user?.firstName} {user?.lastName}</div>
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-all">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const mobileItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/wallet", icon: Wallet, label: "Wallet" },
    { href: "/eload", icon: Smartphone, label: "E-Load" },
    { href: "/cashout", icon: ArrowDownCircle, label: "Send" },
    { href: "/profile", icon: User, label: "More" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
      <div className="flex">
        {mobileItems.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={cn("flex-1 flex flex-col items-center py-3 text-xs font-medium transition-all", pathname === href ? "text-[#038E80]" : "text-gray-400")}>
            <Icon size={20} />
            <span className="mt-1">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
