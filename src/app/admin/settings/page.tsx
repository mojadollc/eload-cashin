"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, RefreshCw, Eye, EyeOff, Webhook, Trash2, Plus, ToggleRight } from "lucide-react";

const PAYMONGO_FIELDS = [
  { key: "PAYMONGO_SECRET_KEY", label: "PayMongo Secret Key", placeholder: "sk_live_..." },
  { key: "PAYMONGO_WEBHOOK_SECRET", label: "PayMongo Webhook Secret", placeholder: "whsec_..." },
];
const GBITS_FIELDS = [
  { key: "GBITS_API_URL", label: "GbitsAPI URL", placeholder: "https://api.gbits.com" },
  { key: "GBITS_API_KEY", label: "GbitsAPI Key", placeholder: "your-gbits-key" },
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
  const [pmWebhooks, setPmWebhooks] = useState<any[]>([]);
  const [pmWebhookUrl, setPmWebhookUrl] = useState("");
  const [pmLoading, setPmLoading] = useState(false);
  const [pmError, setPmError] = useState("");

  useEffect(() => {
    api.get("/api/admin/settings").then(d => { if (d) setValues(d); });
    loadPmWebhooks();
  }, []);

  const loadPmWebhooks = () => {
    api.get("/api/admin/paymongo/webhooks").then(d => { if (d?.webhooks) setPmWebhooks(d.webhooks); });
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues(v => ({ ...v, [key]: e.target.value }));

  const toggleShow = (key: string) =>
    setShow(s => ({ ...s, [key]: !s[key] }));

  const handleSave = async (restart = false) => {
    if (restart) setRestarting(true); else setSaving(true);
    const res = await api.post("/api/admin/settings", { ...values, restart });
    if (restart) setRestarting(false); else setSaving(false);
    if (res?.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  };

  const handlePmWebhookAction = async (action: string, webhookId?: string) => {
    setPmLoading(true);
    setPmError("");
    const res = await api.post("/api/admin/paymongo/webhooks", {
      action,
      webhookId,
      url: pmWebhookUrl || undefined,
    });
    setPmLoading(false);
    if (res?.error) { setPmError(res.error); return; }
    loadPmWebhooks();
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
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold">PayMongo API</h2>
            <p className="text-xs text-gray-400">Payment gateway for wallet funding and bank disbursements.</p>
            {PAYMONGO_FIELDS.map(renderField)}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold flex items-center gap-2"><Webhook size={16} /> PayMongo Webhooks</h2>
                <p className="text-xs text-gray-400 mt-0.5">Registered webhooks on your PayMongo account for disbursement events.</p>
              </div>
              <Button variant="outline" loading={pmLoading} onClick={() => loadPmWebhooks()}>
                <RefreshCw size={13} className="mr-1.5" /> Refresh
              </Button>
            </div>

            {pmError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600">{pmError}</div>
            )}

            {pmWebhooks.length === 0 ? (
              <p className="text-sm text-gray-400">No webhooks registered yet.</p>
            ) : (
              <div className="space-y-2">
                {pmWebhooks.map((wh: any) => (
                  <div key={wh.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-gray-700 truncate">{wh.attributes?.url}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          wh.attributes?.status === "enabled" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>{wh.attributes?.status}</span>
                        {(wh.attributes?.events || []).map((e: string) => (
                          <span key={e} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{e}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      {wh.attributes?.status !== "enabled" && (
                        <button onClick={() => handlePmWebhookAction("enable", wh.id)}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <ToggleRight size={13} /> Enable
                        </button>
                      )}
                      <button onClick={() => handlePmWebhookAction("delete", wh.id)}
                        className="text-xs text-red-500 hover:underline flex items-center gap-1">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500">Register New Webhook</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder={`${values.APP_URL || "https://yourdomain.com"}/api/webhooks/paymongo/disbursement`}
                  value={pmWebhookUrl}
                  onChange={e => setPmWebhookUrl(e.target.value)}
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400"
                />
                <Button loading={pmLoading} onClick={() => handlePmWebhookAction("create")}>
                  <Plus size={14} className="mr-1.5" /> Register
                </Button>
              </div>
              <p className="text-xs text-gray-400">Leave blank to use <code className="bg-gray-100 px-1 rounded">APP_URL</code> + <code className="bg-gray-100 px-1 rounded">/api/webhooks/paymongo/disbursement</code></p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold">GbitsAPI</h2>
            <p className="text-xs text-gray-400">E-load provider for Globe, Smart, DITO, TM, TNT, Sun.</p>
            {GBITS_FIELDS.map(renderField)}
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
