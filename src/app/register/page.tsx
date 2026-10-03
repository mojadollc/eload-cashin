"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { RecaptchaVerifier as RV, ConfirmationResult } from "firebase/auth";

export const dynamic = "force-dynamic";

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const handleChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = digits.map((c, idx) => idx === i ? d : c).join("");
    onChange(next);
    if (d && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ""}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-11 h-12 text-center text-xl font-bold border-2 rounded-xl border-gray-200 focus:border-[#038E80] focus:ring-2 focus:ring-[#038E80]/20 focus:outline-none transition-all"
        />
      ))}
    </div>
  );
}

function SuccessModal({ mobile, onClose }: { mobile: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Phone Verified!</h2>
        <p className="text-gray-500 text-sm mb-6">
          <strong>{mobile}</strong> has been successfully verified. You can now login to your account.
        </p>
        <Button className="w-full" size="lg" onClick={onClose}>Login Now</Button>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", mobile: "", email: "", password: "", confirmPassword: "", referralCode: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"register" | "verify">("register");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
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

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.error?.fieldErrors) {
        const messages = Object.values(data.error.fieldErrors).flat().join(". ");
        setError(messages || "Validation failed");
      } else {
        setError(data.error || "Registration failed");
      }
      setLoading(false); return;
    }

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
    if (!confirmation || otp.length < 6) return;
    setLoading(true); setError("");

    try {
      const result = await confirmation.confirm(otp);
      const firebaseToken = await result.user.getIdToken();

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: form.mobile, firebaseToken }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      setShowSuccess(true);
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
      {showSuccess && <SuccessModal mobile={form.mobile} onClose={() => router.push("/login")} />}
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
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">A 6-digit OTP was sent via SMS to</p>
                  <p className="font-semibold text-[#17202A] mt-1">{form.mobile}</p>
                </div>
                <OtpInput value={otp} onChange={setOtp} />
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <Button type="submit" className="w-full" size="lg" loading={loading} disabled={otp.length < 6}>Verify OTP</Button>
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
