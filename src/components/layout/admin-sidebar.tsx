"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/shared/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Wallet, Smartphone, ArrowDownCircle,
  List, DollarSign, BarChart2, Settings, FileText, LogOut,
  Shield, Radio, HeadphonesIcon, ChevronRight,
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/admin/users", icon: Users, label: "Users" },
      { href: "/admin/wallets", icon: Wallet, label: "Wallets" },
      { href: "/admin/transactions", icon: List, label: "Transactions" },
    ],
  },
  {
    label: "Services",
    items: [
      { href: "/admin/eload", icon: Smartphone, label: "E-Load" },
      { href: "/admin/gbits", icon: Radio, label: "GBits Monitor" },
      { href: "/admin/cashout", icon: ArrowDownCircle, label: "Cash Out" },
      { href: "/admin/fees", icon: DollarSign, label: "Fee Rules" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/admin/reports", icon: BarChart2, label: "Reports" },
      { href: "/admin/audit", icon: FileText, label: "Audit Logs" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/support", icon: HeadphonesIcon, label: "Support" },
      { href: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();

  return (
    <aside className="flex flex-col w-[240px] shrink-0 h-screen sticky top-0 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0c1a2e 0%, #0f2137 50%, #0c1a2e 100%)" }}>

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #038E80, #0ea5e9)" }}>
            <Shield size={17} className="text-white" />
          </div>
          <div>
            <span className="text-[15px] font-bold text-white tracking-tight">CashIn Tap</span>
            <p className="text-[10px] text-white/30 font-medium tracking-widest uppercase leading-none mt-0.5">Admin Console</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar space-y-5">
        {navGroups.map(({ label, items }) => (
          <div key={label}>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] px-3 mb-1.5">{label}</p>
            <div className="space-y-0.5">
              {items.map(({ href, icon: Icon, label: itemLabel }) => {
                const active = pathname === href;
                return (
                  <Link key={href} href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group relative",
                      active
                        ? "text-white"
                        : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                    )}>
                    {active && (
                      <span className="absolute inset-0 rounded-xl opacity-100"
                        style={{ background: "linear-gradient(135deg, rgba(3,142,128,0.25), rgba(14,165,233,0.15))", border: "1px solid rgba(3,142,128,0.3)" }} />
                    )}
                    <Icon size={15} className={cn("shrink-0 relative z-10", active ? "text-[#038E80]" : "")} strokeWidth={active ? 2.5 : 2} />
                    <span className="relative z-10">{itemLabel}</span>
                    {active && <ChevronRight size={12} className="ml-auto relative z-10 text-[#038E80]/60" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, #038E80, #0ea5e9)" }}>
            {initials || "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-white/80 truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-white/30 truncate">{user?.role}</p>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 w-full transition-all">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
