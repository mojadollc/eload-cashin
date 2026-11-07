"use client";
import { useAuth } from "@/components/shared/auth-context";
import { useEffect, useState } from "react";
import { User, Phone, Mail, LogOut, ChevronRight, Shield, Bell, FileText, Key, Fingerprint, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [initials, setInitials] = useState("");

  useEffect(() => {
    if (user) setInitials(`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase());
  }, [user]);

  const [pinStatus, setPinStatus] = useState<{ hasPin: boolean; biometricsEnabled: boolean } | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinStep, setPinStep] = useState<"enter" | "confirm" | null>(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);

  useEffect(() => {
    // Check biometric support
    if (window.PublicKeyCredential) {
      navigator.credentials?.get({ publicKey: { challenge: new Uint8Array(1) } })
        .then(() => setCanUseBiometrics(true))
        .catch(() => setCanUseBiometrics(false));
    }
    
    // Fetch PIN status
    fetch("/api/auth/pin")
      .then(res => res.json())
      .then(data => setPinStatus(data))
      .catch(() => setPinStatus({ hasPin: false, biometricsEnabled: false }));
  }, []);

  const handleSetPin = async () => {
    if (pin.length !== 4) { setPinError("PIN must be 4 digits"); return; }
    if (pin !== confirmPin) { setPinError("PINs do not match"); return; }
    
    setPinLoading(true);
    setPinError("");
    
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      
      if (!res.ok) { setPinError(data.error); return; }
      
      setPinStatus({ hasPin: true, biometricsEnabled: false });
      setShowPinModal(false);
      setPin("");
      setConfirmPin("");
      setPinStep(null);
    } catch { setPinError("Failed to set PIN"); }
    finally { setPinLoading(false); }
  };

  const handleToggleBiometrics = async (enabled: boolean) => {
    if (!pinStatus?.hasPin) return;
    
    const res = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    const data = await res.json();
    
    if (res.ok) {
      setPinStatus(s => s ? { ...s, biometricsEnabled: data.biometricsEnabled } : null);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F7F9FA]">
      {/* Header */}
      <div className="bg-[#038E80] px-4 pt-6 pb-20">
        <h1 className="text-white text-xl font-bold">Profile</h1>
      </div>

      <div className="px-4 -mt-14 space-y-4">
        {/* Avatar card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-[#038E80] flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg shadow-[#038E80]/30">
            {initials || <User size={32} />}
          </div>
          <h2 className="text-xl font-bold text-gray-800">{user.firstName} {user.lastName}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{user.mobile}</p>
          <span className="mt-2 px-3 py-1 rounded-full bg-[#038E80]/10 text-[#038E80] text-xs font-semibold">
            {(user as any).kycStatus || "Unverified"}
          </span>
        </div>

        {/* Contact info */}
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Phone size={16} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Mobile Number</p>
              <p className="text-sm font-semibold text-gray-800">{user.mobile}</p>
            </div>
          </div>
          {user.email && (
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Mail size={16} className="text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-semibold text-gray-800">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
          <Link href="/transactions" className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                <FileText size={16} className="text-teal-500" />
              </div>
              <span className="text-sm font-medium text-gray-700">Transaction History</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
          <button className="flex items-center justify-between w-full px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                <Shield size={16} className="text-green-500" />
              </div>
              <span className="text-sm font-medium text-gray-700">Change Password</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          {pinStatus && (
            <>
              <button 
                onClick={() => { setPinStep("enter"); setShowPinModal(true); }}
                className="flex items-center justify-between w-full px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Key size={16} className="text-indigo-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {pinStatus.hasPin ? "Change MPIN" : "Set MPIN"}
                  </span>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
              {pinStatus.hasPin && canUseBiometrics && (
                <div className="flex items-center justify-between px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                      <Fingerprint size={16} className="text-rose-500" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Biometric Login</span>
                  </div>
                  <button
                    onClick={() => handleToggleBiometrics(!pinStatus.biometricsEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${pinStatus.biometricsEnabled ? "bg-[#038E80]" : "bg-gray-300"}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${pinStatus.biometricsEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>
              )}
            </>
          )}
          <Link href="/notifications" className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                <Bell size={16} className="text-orange-500" />
              </div>
              <span className="text-sm font-medium text-gray-700">Notifications</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
        </div>

        {/* Sign out */}
        <button onClick={logout}
          className="w-full bg-white rounded-2xl shadow-sm px-4 py-4 flex items-center gap-3 text-red-500 active:bg-red-50 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
            <LogOut size={16} className="text-red-500" />
          </div>
          <span className="text-sm font-semibold">Sign Out</span>
        </button>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <CardContent className="pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                {!pinStatus?.hasPin ? "Set" : "Change"} Your MPIN
              </h3>
              
              <p className="text-sm text-gray-500 text-center mb-4">
                Create a 4-digit PIN to secure your account
              </p>

              {pinStep === "enter" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enter 4-digit PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={pin}
                      onChange={e => { if (/^\d*$/.test(e.target.value)) setPin(e.target.value.slice(-4)); }}
                      className="w-full h-12 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#038E80] focus:outline-none"
                      placeholder="••••"
                    />
                  </div>
                  <Button
                    onClick={() => { setPinStep("confirm"); setPinError(""); }}
                    className="w-full"
                    disabled={pin.length !== 4}
                  >
                    Continue
                  </Button>
                </div>
              )}

              {pinStep === "confirm" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={confirmPin}
                      onChange={e => { if (/^\d*$/.test(e.target.value)) setConfirmPin(e.target.value.slice(-4)); }}
                      className="w-full h-12 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#038E80] focus:outline-none"
                      placeholder="••••"
                    />
                  </div>
                  {pinError && <p className="text-sm text-red-500 text-center">{pinError}</p>}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => { setPinStep("enter"); setConfirmPin(""); setPinError(""); }}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSetPin}
                      className="flex-1"
                      loading={pinLoading}
                      disabled={confirmPin.length !== 4}
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              )}

              <button
                onClick={() => { setShowPinModal(false); setPin(""); setConfirmPin(""); setPinStep(null); setPinError(""); }}
                className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
