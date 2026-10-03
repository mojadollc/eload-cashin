"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { RecaptchaVerifier as RV, ConfirmationResult } from "firebase/auth";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", mobile: "", email: "", password: "", confirmPassword: "", referralCode: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"register" | "verify">("register");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RV | null>(null);

  useEffect(() => {
    return () => { recaptchaRef.current?.clear(); };
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");

    // 1. Create account in our DB first
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      // Handle Zod validation errors
      if (data.error?.fieldErrors) {
        const messages = Object.values(data.error.fieldErrors).flat().join(". ");
        setError(messages || "Validation failed");
      } else {
        setError(data.error || "Registration failed");
      }
      setLoading(false); return;
    }

    // 2. Send Firebase OTP
    try {
      const { auth } = await import("@/lib/firebase/client");
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }
      const phoneNumber = form.mobile.replace(/^0/, "+63");
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaRef.current);
      setConfirmation(result);
      setStep("verify");
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP. Check your number and try again.");
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmation) return;
    setLoading(true); setError("");

    try {
      // 3. Confirm OTP with Firebase
      const result = await confirmation.confirm(otp);
      const firebaseToken = await result.user.getIdToken();

      // 4. Tell our backend to activate the account
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: form.mobile, firebaseToken }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      router.push("/login?verified=1");
    } catch {
      setError("Invalid OTP. Please try again.");
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setError(""); setOtp("");
    try {
      const { auth } = await import("@/lib/firebase/client");
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");
      recaptchaRef.current?.clear();
      recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      const phoneNumber = form.mobile.replace(/^0/, "+63");
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaRef.current);
      setConfirmation(result);
    } catch (err: any) {
      setError(err?.message || "Failed to resend OTP.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div id="recaptcha-container" />
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
                <p className="text-sm text-gray-600">
                  A 6-digit OTP was sent via SMS to <strong>{form.mobile}</strong>
                </p>
                <Input label="OTP Code" placeholder="000000" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} required />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" size="lg" loading={loading}>Verify</Button>
                <button type="button" onClick={handleResend} className="w-full text-sm text-[#038E80] hover:underline">
                  Resend OTP
                </button>
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
