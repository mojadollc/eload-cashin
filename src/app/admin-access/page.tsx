"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const ADMIN_KEY = "ct-admin-9x7k2m";

function AdminAccessForm() {
  const searchParams = useSearchParams();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const key = searchParams.get("k");
  if (key !== ADMIN_KEY) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Not found</p>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        return;
      }

      // Write directly to localStorage — no auth-context, no router, no Firebase
      localStorage.setItem("auth", JSON.stringify({
        user: data.user,
        accessToken: data.accessToken,
      }));

      // Hard redirect — bypasses all Next.js guards
      window.location.href = "/admin";
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
        <div className="text-center mb-2">
          <img src="/icons/icon-192.png" alt="CashIn Tap" className="w-14 h-14 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Admin Sign In</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Mobile</label>
            <input
              type="tel"
              placeholder="09XXXXXXXXX"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              required
              autoComplete="off"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#038E80]/30 focus:border-[#038E80]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#038E80]/30 focus:border-[#038E80]"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[#038E80] text-white rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminAccessPage() {
  return (
    <Suspense>
      <AdminAccessForm />
    </Suspense>
  );
}
