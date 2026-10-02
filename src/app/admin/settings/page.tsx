"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, RefreshCw, Eye, EyeOff } from "lucide-react";

const XENDIT_FIELDS = [
  { key: "XENDIT_SECRET_KEY", label: "Xendit Secret Key", placeholder: "xnd_production_..." },
  { key: "XENDIT_WEBHOOK_TOKEN", label: "Xendit Webhook Token", placeholder: "your-webhook-token" },
];
const GBITS_FIELDS = [
  { key: "GBITS_API_URL", label: "GbitsAPI URL", placeholder: "https://api.gbits.com" },
  { key: "GBITS_API_KEY", label: "GbitsAPI Key", placeholder: "your-gbits-key" },
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

  useEffect(() => {
    api.get("/api/admin/settings").then(d => { if (d) setValues(d); });
  }, []);

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
            <h2 className="font-semibold">Xendit API</h2>
            <p className="text-xs text-gray-400">Payment gateway for wallet funding and disbursements.</p>
            {XENDIT_FIELDS.map(renderField)}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold">GbitsAPI</h2>
            <p className="text-xs text-gray-400">E-load provider for Globe, Smart, DITO, TM, TNT, Sun.</p>
            {GBITS_FIELDS.map(renderField)}
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
