"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/shared/auth-context";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Wallet, Smartphone, ArrowDownCircle, List, DollarSign, BarChart2, Settings, FileText, LogOut, Shield, Radio } from "lucide-react";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/wallets", icon: Wallet, label: "Wallets" },
  { href: "/admin/transactions", icon: List, label: "Transactions" },
  { href: "/admin/eload", icon: Smartphone, label: "E-Load" },
  { href: "/admin/gbits", icon: Radio, label: "GBits Monitor" },
  { href: "/admin/cashout", icon: ArrowDownCircle, label: "Send" },
  { href: "/admin/fees", icon: DollarSign, label: "Fees" },
  { href: "/admin/reports", icon: BarChart2, label: "Reports" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
  { href: "/admin/audit", icon: FileText, label: "Audit Logs" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex flex-col w-64 bg-[#17202A] min-h-screen">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-[#038E80]" />
          <span className="text-lg font-bold text-white">CashIn Tap</span>
        </div>
        <span className="text-xs text-gray-400 mt-0.5 block">Admin Panel</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all", pathname === href ? "bg-[#038E80] text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}>
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 py-2 text-sm text-gray-400">{user?.firstName} · {user?.role}</div>
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 w-full transition-all">
          <LogOut size={17} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
