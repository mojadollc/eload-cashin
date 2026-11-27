"use client";
import { useEffect, useRef, useState } from "react";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, RefreshCw, Eye, EyeOff, Upload, Palette } from "lucide-react";

const PAYMONGO_FIELDS = [
  { key: "PAYMONGO_SECRET_KEY", label: "Secret Key", placeholder: "sk_live_..." },
  { key: "PAYMONGO_PUBLIC_KEY", label: "Public Key", placeholder: "pk_live_..." },
  { key: "PAYMONGO_PAYMENT_WEBHOOK_SECRET", label: "Payment Webhook Secret", placeholder: "whsec_... (from payment webhook)" },
  { key: "PAYMONGO_DISBURSEMENT_WEBHOOK_SECRET", label: "Disbursement Webhook Secret", placeholder: "whsec_... (from disbursement webhook)" },
];
const GBITS_FIELDS = [
  { key: "GBITS_API_URL", label: "API URL", placeholder: "https://api.gbits.ph" },
  { key: "GBITS_BUSINESS_ID", label: "Business ID", placeholder: "aab5db19-..." },
  { key: "GBITS_BUSINESS_CODE", label: "Business Code", placeholder: "JLKJ" },
  { key: "GBITS_USERNAME", label: "Username", placeholder: "your@email.com" },
  { key: "GBITS_PASSWORD", label: "Password", placeholder: "your-password" },
];
const FIREBASE_FIELDS = [
  { key: "FIREBASE_PROJECT_ID", label: "Project ID", placeholder: "your-project-id" },
  { key: "FIREBASE_CLIENT_EMAIL", label: "Client Email", placeholder: "firebase-adminsdk@project.iam.gserviceaccount.com" },
  { key: "FIREBASE_PRIVATE_KEY", label: "Private Key", placeholder: "-----BEGIN PRIVATE KEY-----\n..." },
  { key: "NEXT_PUBLIC_FIREBASE_API_KEY", label: "Web API Key", placeholder: "AIzaSy..." },
  { key: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", label: "Auth Domain", placeholder: "your-project.firebaseapp.com" },
  { key: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", label: "Public Project ID", placeholder: "your-project-id" },
  { key: "NEXT_PUBLIC_FIREBASE_APP_ID", label: "App ID", placeholder: "1:000000000000:web:xxx" },
];
const GENERAL_FIELDS = [
  { key: "APP_URL", label: "App URL", placeholder: "https://cashin-tap.com" },
];

export default function AdminSettingsPage() {
  const api = useApi();
  const [values, setValues] = useState<Record<string, string>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [restarting, setRestarting] = useState(false);

  // Branding state
  const [branding, setBranding] = useState({ primaryColor: "#038E80", secondaryColor: "#0ea5e9", appName: "CashIn Tap", logoUrl: "", faviconUrl: "" });
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandSaved, setBrandSaved] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [faviconPreview, setFaviconPreview] = useState("");
  const [uploading, setUploading] = useState<"logo" | "favicon" | null>(null);

  useEffect(() => {
    api.get("/api/admin/settings").then(d => { if (d) setValues(d); });
    fetch("/api/branding").then(r => r.json()).then(d => {
      setBranding(b => ({ ...b, ...d }));
      if (d.logoUrl) setLogoPreview(d.logoUrl);
      if (d.faviconUrl) setFaviconPreview(d.faviconUrl);
    }).catch(() => {});
  }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues(v => ({ ...v, [key]: e.target.value }));

  const toggleShow = (key: string) =>
    setShow(s => ({ ...s, [key]: !s[key] }));

  const handleBrandSave = async () => {
    setBrandSaving(true);
    const token = JSON.parse(localStorage.getItem("auth") || "{}")?.accessToken;
    await fetch("/api/admin/branding", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ primaryColor: branding.primaryColor, secondaryColor: branding.secondaryColor, appName: branding.appName }),
    });
    // Apply immediately to current page
    document.documentElement.style.setProperty("--brand", branding.primaryColor);
    document.documentElement.style.setProperty("--secondary", branding.secondaryColor);
    setBrandSaving(false);
    setBrandSaved(true);
    setTimeout(() => setBrandSaved(false), 3000);
  };

  const handleFileUpload = async (type: "logo" | "favicon", file: File) => {
    setUploading(type);
    const token = JSON.parse(localStorage.getItem("auth") || "{}")?.accessToken;
    const form = new FormData();
    form.append("type", type);
    form.append("file", file);
    const res = await fetch("/api/admin/branding", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    if (data.url) {
      if (type === "logo") setLogoPreview(data.url);
      else {
        setFaviconPreview(data.url);
        // Update favicon in browser immediately
        const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
        if (link) link.href = data.url;
      }
    }
    setUploading(null);
  };

  const handleSave = async (restart = false) => {
    if (restart) {
      setRestarting(true);
      // Fire-and-forget — pm2 kills the process before it can respond
      api.post("/api/admin/settings", { ...values, restart: true }).catch(() => {});
      setTimeout(() => { setRestarting(false); setSaved(true); setTimeout(() => setSaved(false), 3000); }, 6000);
    } else {
      setSaving(true);
      const res = await api.post("/api/admin/settings", { ...values, restart: false });
      setSaving(false);
      if (res?.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    }
  };

  const renderField = ({ key, label, placeholder }: { key: string; label: string; placeholder: string }) => (
    <div key={key} className="relative">
      <Input
        label={label}
        type={show[key] ? "text" : "password"}
        placeholder={placeholder}
        value={values[key] || ""}
        onChange={set(key)}
      />
      <button
        type="button"
        onClick={() => toggleShow(key)}
        className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
      >
        {show[key] ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        {saved && (
          <div className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle size={15} /> Saved successfully
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding Card */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center gap-2">
              <Palette size={16} className="text-[var(--brand)]" />
              <h2 className="font-semibold">Branding & Theme</h2>
              {brandSaved && <span className="ml-auto flex items-center gap-1 text-xs text-green-600"><CheckCircle size={13} /> Saved</span>}
            </div>
            <p className="text-xs text-gray-400">Changes apply instantly across the entire web app without a restart.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* App Name */}
              <Input
                label="App Name"
                value={branding.appName}
                onChange={e => setBranding(b => ({ ...b, appName: e.target.value }))}
                placeholder="CashIn Tap"
              />

              {/* Primary Color */}
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={e => setBranding(b => ({ ...b, primaryColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={branding.primaryColor}
                    onChange={e => setBranding(b => ({ ...b, primaryColor: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                    placeholder="#038E80"
                  />
                </div>
                <div className="mt-2 h-6 rounded-lg" style={{ background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` }} />
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Secondary / Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.secondaryColor}
                    onChange={e => setBranding(b => ({ ...b, secondaryColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={branding.secondaryColor}
                    onChange={e => setBranding(b => ({ ...b, secondaryColor: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                    placeholder="#0ea5e9"
                  />
                </div>
              </div>
            </div>

            {/* Image uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <p className="text-[13px] font-medium text-slate-700">App Logo</p>
                <p className="text-xs text-gray-400">Shown in sidebar and login page. PNG/SVG recommended.</p>
                <div className="flex items-center gap-3">
                  {logoPreview && (
                    <img src={logoPreview} alt="Logo" className="h-10 w-auto max-w-[120px] object-contain rounded-lg border border-slate-100" />
                  )}
                  <button
                    onClick={() => logoRef.current?.click()}
                    disabled={uploading === "logo"}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    <Upload size={14} />
                    {uploading === "logo" ? "Uploading..." : "Upload Logo"}
                  </button>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload("logo", f); e.target.value = ""; }} />
                </div>
              </div>

              {/* Favicon */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <p className="text-[13px] font-medium text-slate-700">Browser Favicon / Icon</p>
                <p className="text-xs text-gray-400">Shown in browser tab. ICO or 32×32 PNG recommended.</p>
                <div className="flex items-center gap-3">
                  {faviconPreview && (
                    <img src={faviconPreview} alt="Favicon" className="h-8 w-8 object-contain rounded border border-slate-100" />
                  )}
                  <button
                    onClick={() => faviconRef.current?.click()}
                    disabled={uploading === "favicon"}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    <Upload size={14} />
                    {uploading === "favicon" ? "Uploading..." : "Upload Favicon"}
                  </button>
                  <input ref={faviconRef} type="file" accept="image/*,.ico" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload("favicon", f); e.target.value = ""; }} />
                </div>
              </div>
            </div>

            <Button onClick={handleBrandSave} loading={brandSaving} size="sm">
              Save Branding
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold">PayMongo API</h2>
            <p className="text-xs text-gray-400">Payment gateway for wallet funding and bank disbursements.</p>
            {PAYMONGO_FIELDS.map(renderField)}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="pt-6 space-y-3">
            <h2 className="font-semibold">PayMongo Webhook URLs</h2>
            <p className="text-xs text-gray-400">Register these URLs once in your <a href="https://dashboard.paymongo.com/developers" target="_blank" rel="noreferrer" className="text-blue-500 underline">PayMongo Dashboard → Developers → Webhooks</a>.</p>
            <div className="space-y-2">
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">Wallet Funding (checkout_session.payment.paid, payment.paid)</p>
                <p className="font-mono text-sm text-gray-800 break-all">{values.APP_URL || "https://yourdomain.com"}/api/webhooks/paymongo/payment</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">Cash Out / Send Funds (disbursement.paid, disbursement.failed)</p>
                <p className="font-mono text-sm text-gray-800 break-all">{values.APP_URL || "https://yourdomain.com"}/api/webhooks/paymongo/disbursement</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold">GbitsAPI</h2>
            <p className="text-xs text-gray-400">E-load provider for Globe, Smart, DITO, TM, TNT, Sun.</p>
            <div className="grid grid-cols-1 gap-4">
              {GBITS_FIELDS.map(renderField)}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold">Firebase (Phone OTP)</h2>
            <p className="text-xs text-gray-400">Used for SMS OTP verification during registration. Get these from your Firebase Console → Project Settings.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {FIREBASE_FIELDS.map(renderField)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold">General</h2>
            {GENERAL_FIELDS.map(renderField)}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold">Save & Deploy</h2>
            <p className="text-sm text-gray-500">
              Changes are written to the <code className="bg-gray-100 px-1 rounded text-xs">.env</code> file on the server.
              Restart is required for new API keys to take effect.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              Restarting will briefly interrupt service (~5 seconds).
            </div>
            <div className="flex gap-3">
              <Button variant="outline" loading={saving} onClick={() => handleSave(false)}>
                Save Only
              </Button>
              <Button loading={restarting} onClick={() => handleSave(true)}>
                <RefreshCw size={14} className="mr-1.5" />
                Save & Restart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
