"use client";
import { useAuth } from "@/components/shared/auth-context";
import { UserSidebar, MobileNav } from "@/components/layout/user-sidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { User, Phone, Mail, LogOut, ChevronRight, Shield, Bell } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);
  if (!user) return null;

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="flex min-h-screen">
      <UserSidebar />
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="min-h-screen bg-[#F7F9FA]">
          {/* Header */}
          <div className="bg-[#038E80] px-4 pt-6 pb-20">
            <h1 className="text-white text-xl font-bold">Profile</h1>
          </div>

          {/* Avatar card pulled up */}
          <div className="px-4 -mt-14 space-y-4 pb-8">
            <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#038E80] flex items-center justify-center text-white text-2xl font-bold mb-3">
                {initials || <User size={32} />}
              </div>
              <h2 className="text-xl font-bold text-gray-800">{user.firstName} {user.lastName}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{user.mobile}</p>
            </div>

            {/* Info */}
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Phone size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Mobile Number</p>
                  <p className="text-sm font-semibold text-gray-800">{user.mobile}</p>
                </div>
              </div>
              {user.email && (
                <div className="flex items-center gap-3 px-4 py-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Mail size={16} className="text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-semibold text-gray-800">{user.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
              <button className="flex items-center justify-between w-full px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                    <Shield size={16} className="text-green-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Change Password</span>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
              <button className="flex items-center justify-between w-full px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                    <Bell size={16} className="text-orange-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Notifications</span>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            </div>

            {/* Sign out */}
            <button
              onClick={logout}
              className="w-full bg-white rounded-2xl shadow-sm px-4 py-4 flex items-center gap-3 text-red-500"
            >
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <LogOut size={16} className="text-red-500" />
              </div>
              <span className="text-sm font-semibold">Sign Out</span>
            </button>
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
