"use client";
import { useState, useRef } from "react";
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

type Step = "mobile" | "otp" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [firebaseToken, setFirebaseToken] = useState("");
  const recaptchaRef = useRef<RV | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");

    // Check if mobile exists in our DB
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }

    try {
      const { auth } = await import("@/lib/firebase/client");
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }
      const phoneNumber = mobile.replace(/^0/, "+63");
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaRef.current);
      setConfirmation(result);
      setStep("otp");
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP.");
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmation || otp.length < 6) return;
    setLoading(true); setError("");

    try {
      const result = await confirmation.confirm(otp);
      const token = await result.user.getIdToken();
      setFirebaseToken(token);
      setStep("reset");
    } catch {
      setError("Invalid OTP. Please try again.");
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, firebaseToken, password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setStep("done");
    setLoading(false);
  };

  const titles: Record<Step, string> = {
    mobile: "Forgot Password",
    otp: "Verify Mobile",
    reset: "New Password",
    done: "Password Reset",
  };

  const subtitles: Record<Step, string> = {
    mobile: "Enter your registered mobile number",
    otp: "Enter the OTP sent to your phone",
    reset: "Create a new password",
    done: "Your password has been updated",
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div id="recaptcha-container" />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#038E80]">CashIn Tap</h1>
          <p className="text-gray-500 mt-1">{subtitles[step]}</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            {step === "mobile" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <Input label="Mobile Number" placeholder="09XXXXXXXXX" value={mobile} onChange={e => setMobile(e.target.value)} required />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" size="lg" loading={loading}>Send OTP</Button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">OTP sent to</p>
                  <p className="font-semibold text-[#17202A] mt-1">{mobile}</p>
                </div>
                <OtpInput value={otp} onChange={setOtp} />
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <Button type="submit" className="w-full" size="lg" loading={loading} disabled={otp.length < 6}>Verify OTP</Button>
                <button type="button" onClick={() => { setStep("mobile"); setOtp(""); recaptchaRef.current?.clear(); recaptchaRef.current = null; }} className="w-full text-sm text-gray-500 hover:underline">
                  Change number
                </button>
              </form>
            )}

            {step === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <Input label="New Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                <Input label="Confirm New Password" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" size="lg" loading={loading}>Reset Password</Button>
              </form>
            )}

            {step === "done" && (
              <div className="text-center space-y-6 py-2">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Password updated!</p>
                  <p className="text-sm text-gray-500 mt-1">You can now sign in with your new password.</p>
                </div>
                <Button className="w-full" size="lg" onClick={() => router.push("/login")}>Go to Login</Button>
              </div>
            )}

            {step !== "done" && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Remember it? <Link href="/login" className="text-[#038E80] font-medium">Sign in</Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
