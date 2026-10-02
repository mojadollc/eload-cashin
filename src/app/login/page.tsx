"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/shared/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ mobile: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    login(data.accessToken, data.user);
    router.push(["SUPER_ADMIN", "ADMIN", "FINANCE", "SUPPORT"].includes(data.user.role) ? "/admin" : "/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#038E80]">CashIn Tap</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Mobile Number" placeholder="09XXXXXXXXX" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} required />
              <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" size="lg" loading={loading}>Sign In</Button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">
              No account? <Link href="/register" className="text-[#038E80] font-medium">Register</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
