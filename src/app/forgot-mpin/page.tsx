"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { RecaptchaVerifier as RV, ConfirmationResult } from "firebase/auth";

export const dynamic = "force-dynamic";

function PinInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 4 }, (_, i) => value[i] || "");

  const handleChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = digits.map((c, idx) => idx === i ? d : c).join("");
    onChange(next.trimEnd());
    if (d && i < 3) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = digits.map((c, idx) => idx === i ? "" : c).join("");
        onChange(next.trimEnd());
      } else if (i > 0) {
        inputs.current[i - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    onChange(pasted);
    inputs.current[Math.min(pasted.length, 3)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 4 }).map((_, i) => (
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

type Step = "mobile" | "otp" | "reset" | "done";

export default function ForgotMpinPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [firebaseToken, setFirebaseToken] = useState("");
  const recaptchaRef = useRef<RV | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmation || otp.length < 6) return;
    setLoading(true);
    setError("");

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

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) { setError("PIN must be 4 digits"); return; }
    if (pin !== confirmPin) { setError("PINs do not match"); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/forgot-mpin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, firebaseToken, newPin: pin }),
    });
    const data = await res.json();
    
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setStep("done");
    setLoading(false);
  };

  const titles: Record<Step, string> = {
    mobile: "Forgot MPIN",
    otp: "Verify Mobile",
    reset: "New MPIN",
    done: "MPIN Reset",
  };

  const subtitles: Record<Step, string> = {
    mobile: "Enter your registered mobile number",
    otp: "Enter the OTP sent to your phone",
    reset: "Create a new 4-digit PIN",
    done: "Your MPIN has been reset",
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
                <div className="flex gap-2 justify-center">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[i] || ""}
                      onChange={e => {
                        const d = e.target.value.replace(/\D/g, "").slice(-1);
                        const next = otp.split("").map((c, idx) => idx === i ? d : c).join("");
                        setOtp(next.trimEnd());
                        if (d && i < 5) {
                          const inputs = document.querySelectorAll('.otp-input');
                          (inputs[i + 1] as HTMLInputElement)?.focus();
                        }
                      }}
                      className="otp-input w-11 h-12 text-center text-xl font-bold border-2 rounded-xl border-gray-200 focus:border-[#038E80] focus:ring-2 focus:ring-[#038E80]/20 focus:outline-none transition-all"
                    />
                  ))}
                </div>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <Button type="submit" className="w-full" size="lg" loading={loading} disabled={otp.length < 6}>Verify OTP</Button>
                <button type="button" onClick={() => { setStep("mobile"); setOtp(""); recaptchaRef.current?.clear(); recaptchaRef.current = null; }} className="w-full text-sm text-gray-500 hover:underline">
                  Change number
                </button>
              </form>
            )}

            {step === "reset" && (
              <form onSubmit={handleResetPin} className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Create new 4-digit MPIN</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enter new MPIN</label>
                  <PinInput value={pin} onChange={setPin} />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm MPIN</label>
                  <PinInput value={confirmPin} onChange={setConfirmPin} />
                </div>

                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <Button type="submit" className="w-full" size="lg" loading={loading} disabled={pin.length !== 4 || confirmPin.length !== 4}>Reset MPIN</Button>
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
                  <p className="font-semibold text-gray-800">MPIN reset successful!</p>
                  <p className="text-sm text-gray-500 mt-1">You can now sign in with your new MPIN.</p>
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