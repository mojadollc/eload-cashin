"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

function PinInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 4 }, (_, i) => value[i] || "");

  const handleChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = digits.map((c, idx) => (idx === i ? d : c)).join("");
    onChange(next.trimEnd());
    if (d && i < 3) inputs.current[i + 1]?.focus();
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
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    onChange(pasted);
    inputs.current[Math.min(pasted.length, 3)]?.focus();
    e.preventDefault();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3 text-center">{label}</label>
      <div className="flex gap-3 justify-center">
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
    </div>
  );
}

export default function SetMpinPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) { setError("MPIN must be 4 digits"); return; }
    if (pin !== confirmPin) { setError("MPINs do not match"); return; }
    setLoading(true); setError("");

    const res = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();

    if (!res.ok) { setError(data.error || "Failed to set MPIN"); setLoading(false); return; }
    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">MPIN Set!</h2>
            <p className="text-gray-500 text-sm mt-2">
              Your 4-digit MPIN is ready. You&apos;ll use it every time you sign in.
            </p>
          </div>
          <Button className="w-full" size="lg" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#038E80]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-[#038E80]" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Set Your MPIN</h1>
          <p className="text-gray-500 text-sm mt-2">
            Create a 4-digit MPIN. You&apos;ll use this every time you sign in.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <PinInput value={pin} onChange={setPin} label="Enter 4-digit MPIN" />
              <PinInput value={confirmPin} onChange={setConfirmPin} label="Confirm MPIN" />
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={loading}
                disabled={pin.length !== 4 || confirmPin.length !== 4}
              >
                Set MPIN
              </Button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-[#038E80] font-medium">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
