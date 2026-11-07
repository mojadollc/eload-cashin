"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/shared/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Fingerprint, Key, ArrowLeft } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();
  
  const [mode, setMode] = useState<"password" | "pin">("password");
  const [form, setForm] = useState({ mobile: "", password: "", userId: "", pin: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (user) {
      router.push(["SUPER_ADMIN", "ADMIN", "FINANCE", "SUPPORT"].includes(user.role) ? "/admin" : "/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (searchParams.get("verified") === "1") setVerified(true);
  }, [searchParams]);

  // Check device biometric capability
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);
  const [biometricUserId, setBiometricUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedBiometric = localStorage.getItem("biometric_userId");
    if (storedBiometric && window.PublicKeyCredential) {
      setBiometricUserId(storedBiometric);
      // Check if browser supports WebAuthn
      if (window.PublicKeyCredential) {
        navigator.credentials?.get({ publicKey: { challenge: new Uint8Array(1) } })
          .then(() => setCanUseBiometrics(true))
          .catch(() => setCanUseBiometrics(false));
      }
    }
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const res = await fetch("/api/auth/login", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ mobile: form.mobile, password: form.password }) 
    });
    const data = await res.json();
    setLoading(false);
    
    if (!res.ok) { 
      setError(data.error); 
      return; 
    }
    
    // Store userId for biometric login if enabled
    if (data.user.hasPin && data.user.biometricsEnabled) {
      localStorage.setItem("biometric_userId", data.user.id);
      setBiometricUserId(data.user.id);
    }
    
    login(data.accessToken, data.user);
    router.push(["SUPER_ADMIN", "ADMIN", "FINANCE", "SUPPORT"].includes(data.user.role) ? "/admin" : "/dashboard");
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const res = await fetch("/api/auth/login", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ userId: form.userId, pin: form.pin }) 
    });
    const data = await res.json();
    setLoading(false);
    
    if (!res.ok) { 
      setError(data.error); 
      return; 
    }
    
    login(data.accessToken, data.user);
    router.push(["SUPER_ADMIN", "ADMIN", "FINANCE", "SUPPORT"].includes(data.user.role) ? "/admin" : "/dashboard");
  };

  const handleBiometricLogin = async () => {
    if (!biometricUserId) return;
    
    setLoading(true);
    setError("");
    
    try {
      // WebAuthn biometric verification
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new TextEncoder().encode(`biometric_login_${biometricUserId}`),
          timeout: 60000,
        }
      }) as any;
      
      if (!credential) {
        setError("Biometric authentication failed");
        setLoading(false);
        return;
      }
      
      // For simplicity, we'll use the credential ID as a "biometric token"
      // In production, you'd verify this on the server
      const res = await fetch("/api/auth/login", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ userId: biometricUserId, biometric: true }) 
      });
      const data = await res.json();
      setLoading(false);
      
      if (!res.ok) { 
        setError(data.error); 
        return; 
      }
      
      login(data.accessToken, data.user);
      router.push(["SUPER_ADMIN", "ADMIN", "FINANCE", "SUPPORT"].includes(data.user.role) ? "/admin" : "/dashboard");
    } catch (err) {
      setLoading(false);
      setError("Biometric authentication failed");
    }
  };

  const handlePinDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = form.pin.split("");
    newPin[index] = value.slice(-1);
    const finalPin = newPin.join("");
    setForm(f => ({ ...f, pin: finalPin }));
    
    // Auto-advance to next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-input-${index + 1}`);
      nextInput?.focus();
    }
    
    // Auto-submit when 4 digits entered
    if (finalPin.length === 4) {
      handlePinSubmit(new Event("submit") as any);
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !form.pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <img src="/icons/icon-192.png" alt="CashIn Tap" className="w-20 h-20 mx-auto mb-3" />
          </Link>
          <p className="text-gray-500 mt-1">
            {mode === "password" ? "Sign in to your account" : "Enter your MPIN"}
          </p>
        </div>
        
        {verified && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-green-700 font-medium">Phone verified! You can now sign in.</p>
          </div>
        )}
        
        {mode === "password" ? (
          <>
            {/* Biometric quick login */}
            {canUseBiometrics && biometricUserId && (
              <Card className="mb-4 border-[#038E80]/20">
                <CardContent className="pt-4">
                  <button 
                    onClick={handleBiometricLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#038E80]/10 text-[#038E80] rounded-xl font-medium hover:bg-[#038E80]/20 transition-colors"
                  >
                    <Fingerprint size={20} />
                    Use Biometrics
                  </button>
                </CardContent>
              </Card>
            )}
          
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <Input 
                    label="Mobile Number" 
                    placeholder="09XXXXXXXXX" 
                    value={form.mobile} 
                    onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} 
                    required 
                  />
                  <div>
                    <div className="relative">
                      <Input 
                        label="Password" 
                        type={showPw ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={form.password} 
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPw(v => !v)} 
                        className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                      >
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <Link href="/forgot-password" className="text-xs text-[#038E80] hover:underline">
                        Forgot password?
                      </Link>
                      <div className="flex gap-3">
                        <button 
                          type="button"
                          onClick={() => router.push("/forgot-mpin")}
                          className="text-xs text-[#038E80] hover:underline"
                        >
                          Forgot MPIN?
                        </button>
                        <button 
                          type="button"
                          onClick={() => setMode("pin")}
                          className="text-xs text-[#038E80] hover:underline"
                        >
                          Use MPIN
                        </button>
                      </div>
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" size="lg" loading={loading}>Sign In</Button>
                </form>
                <p className="text-center text-sm text-gray-500 mt-4">
                  No account? <Link href="/register" className="text-[#038E80] font-medium">Register</Link>
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="pt-6">
              {/* User ID input for PIN mode */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <Input 
                  placeholder="Enter your User ID" 
                  value={form.userId} 
                  onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} 
                  required 
                />
              </div>
              
              {/* PIN inputs */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">4-Digit PIN</label>
                <div className="flex gap-2 justify-between">
                  {[0, 1, 2, 3].map((i) => (
                    <input
                      key={i}
                      id={`pin-input-${i}`}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={form.pin[i] || ""}
                      onChange={(e) => handlePinDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(i, e)}
                      className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#038E80] focus:outline-none"
                    />
                  ))}
                </div>
              </div>
              
              {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
              
              <Button 
                type="button"
                onClick={handlePinSubmit}
                className="w-full mb-3" 
                size="lg" 
                loading={loading}
                disabled={form.pin.length !== 4 || !form.userId}
              >
                Sign In with PIN
              </Button>
              
              <div className="flex justify-between text-sm">
                <button 
                  type="button"
                  onClick={() => router.push("/forgot-mpin")}
                  className="text-[#038E80] hover:underline"
                >
                  Forgot MPIN?
                </button>
                <button 
                  type="button"
                  onClick={() => setMode("password")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Back to Password
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Helper to check if biometric login is available
function canUseBiometricLogin() {
  if (typeof window === "undefined") return false;
  return !!(window.PublicKeyCredential && localStorage.getItem("biometric_userId"));
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}