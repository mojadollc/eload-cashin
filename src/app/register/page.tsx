"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", mobile: "", email: "", password: "", confirmPassword: "", referralCode: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"register" | "verify">("register");
  const [otp, setOtp] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Registration failed"); return; }
    setStep("verify");
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mobile: form.mobile, code: otp }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push("/login?verified=1");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#038E80]">CashIn Tap</h1>
          <p className="text-gray-500 mt-1">{step === "register" ? "Create your account" : "Verify your mobile"}</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            {step === "register" ? (
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="First Name" value={form.firstName} onChange={set("firstName")} required />
                  <Input label="Last Name" value={form.lastName} onChange={set("lastName")} required />
                </div>
                <Input label="Mobile Number" placeholder="09XXXXXXXXX" value={form.mobile} onChange={set("mobile")} required />
                <Input label="Email" type="email" value={form.email} onChange={set("email")} required />
                <Input label="Password" type="password" value={form.password} onChange={set("password")} required />
                <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={set("confirmPassword")} required />
                <Input label="Referral Code (optional)" value={form.referralCode} onChange={set("referralCode")} />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" size="lg" loading={loading}>Create Account</Button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <p className="text-sm text-gray-600">Enter the 6-digit OTP sent to <strong>{form.mobile}</strong></p>
                <Input label="OTP Code" placeholder="000000" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} required />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" size="lg" loading={loading}>Verify</Button>
              </form>
            )}
            <p className="text-center text-sm text-gray-500 mt-4">
              Have an account? <Link href="/login" className="text-[#038E80] font-medium">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
