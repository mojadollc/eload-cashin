"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/shared/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { RecaptchaVerifier as RV, ConfirmationResult } from "firebase/auth";

function PinInput({ value, onChange, length = 4 }: { value: string; onChange: (v: string) => void; length?: number }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  const handleChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = digits.map((c, idx) => (idx === i ? d : c)).join("");
    onChange(next.trimEnd());
    if (d && i < length - 1) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        onChange(digits.map((c, idx) => (idx === i ? "" : c)).join("").trimEnd());
      } else if (i > 0) {
        inputs.current[i - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    inputs.current[Math.min(pasted.length, length - 1)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ""}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl border-gray-200 focus:border-[#038E80] focus:ring-2 focus:ring-[#038E80]/20 focus:outline-none transition-all"
        />
      ))}
    </div>
  );
}

type Step = "mobile" | "otp" | "mpin";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();

  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [mpin, setMpin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<{ accessToken: string; user: any } | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RV | null>(null);

  useEffect(() => {
    if (user) {
      router.push(["SUPER_ADMIN", "ADMIN", "FINANCE", "SUPPORT"].includes(user.role) ? "/admin" : "/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    return () => { recaptchaRef.current?.clear(); };
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");

    try {
      const { auth } = await import("@/lib/firebase/client");
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }
      const result = await signInWithPhoneNumber(auth, mobile.replace(/^0/, "+63"), recaptchaRef.current);
      setConfirmation(result);
      setStep("otp");
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP. Check your number and try again.");
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
      const firebaseToken = await result.user.getIdToken();

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, firebaseToken }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error); setLoading(false); return; }

      if (data.requiresMpin) {
        // Hold auth data, ask for MPIN unlock
        setPendingAuth({ accessToken: data.accessToken, user: data.user });
        setStep("mpin");
      } else {
        // No MPIN set yet — log in directly, redirect to set-mpin
        login(data.accessToken, data.user);
        router.push("/set-mpin");
      }
    } catch {
      setError("Invalid OTP. Please try again.");
    }
    setLoading(false);
  };

  const handleMpinUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAuth || mpin.length !== 4) return;
    setLoading(true); setError("");

    const res = await fetch("/api/auth/pin", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pendingAuth.accessToken}`,
      },
      body: JSON.stringify({ pin: mpin }),
    });
    const data = await res.json();

    if (!res.ok) { setError(data.error || "Incorrect MPIN"); setMpin(""); setLoading(false); return; }

    login(pendingAuth.accessToken, pendingAuth.user);
    router.push(["SUPER_ADMIN", "ADMIN", "FINANCE", "SUPPORT"].includes(pendingAuth.user.role) ? "/admin" : "/dashboard");
  };

  const handleResend = async () => {
    setError(""); setOtp("");
    try {
      const { auth } = await import("@/lib/firebase/client");
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");
      recaptchaRef.current?.clear();
      recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      const result = await signInWithPhoneNumber(auth, mobile.replace(/^0/, "+63"), recaptchaRef.current);
      setConfirmation(result);
    } catch (err: any) {
      setError(err?.message || "Failed to resend OTP.");
    }
  };

  const subtitles: Record<Step, string> = {
    mobile: "Sign in to your account",
    otp: "Verify your mobile number",
    mpin: "Enter your MPIN",
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div id="recaptcha-container" />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <img src="/icons/icon-192.png" alt="CashIn Tap" className="w-20 h-20 mx-auto mb-3" />
          </Link>
          <p className="text-gray-500 mt-1">{subtitles[step]}</p>
        </div>

        {searchParams.get("verified") === "1" && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-700 font-medium">Phone verified! You can now sign in.</p>
          </div>
        )}

        <Card>
          <CardContent className="pt-6">
            {step === "mobile" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <Input
                  label="Mobile Number"
                  placeholder="09XXXXXXXXX"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  required
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  Send OTP
                </Button>
                <p className="text-center text-sm text-gray-500">
                  No account? <Link href="/register" className="text-[#038E80] font-medium">Register</Link>
                </p>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">A 6-digit OTP was sent to</p>
                  <p className="font-semibold text-[#17202A] mt-1">{mobile}</p>
                </div>
                <PinInput value={otp} onChange={setOtp} length={6} />
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <Button type="submit" className="w-full" size="lg" loading={loading} disabled={otp.length < 6}>
                  Verify OTP
                </Button>
                <div className="flex justify-between text-sm">
                  <button type="button" onClick={handleResend} className="text-[#038E80] hover:underline">
                    Resend OTP
                  </button>
                  <button type="button" onClick={() => { setStep("mobile"); setOtp(""); }} className="text-gray-500 hover:underline">
                    Change number
                  </button>
                </div>
              </form>
            )}

            {step === "mpin" && (
              <form onSubmit={handleMpinUnlock} className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Welcome back, <span className="font-semibold text-[#17202A]">{pendingAuth?.user.firstName}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Enter your 4-digit MPIN to continue</p>
                </div>
                <PinInput value={mpin} onChange={setMpin} length={4} />
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <Button type="submit" className="w-full" size="lg" loading={loading} disabled={mpin.length !== 4}>
                  Unlock
                </Button>
                <div className="text-center">
                  <Link href="/forgot-mpin" className="text-sm text-[#038E80] hover:underline">
                    Forgot MPIN?
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
