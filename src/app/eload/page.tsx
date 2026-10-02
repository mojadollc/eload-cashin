"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";

const NETWORKS = ["Globe", "Smart", "DITO", "TM", "TNT", "Sun"];

export default function EloadPage() {
  const api = useApi();
  const [mobile, setMobile] = useState("");
  const [network, setNetwork] = useState("Globe");
  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [step, setStep] = useState<"form" | "confirm" | "result">("form");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fee = 2;

  useEffect(() => {
    api.get("/api/wallet").then(setWallet);
  }, []);

  useEffect(() => {
    api.get(`/api/eload/products?network=${network}`).then(d => {
      setProducts(d?.[network] || []);
      setSelected(null);
    });
  }, [network]);

  const handleBuy = async () => {
    if (!selected) return;
    setLoading(true);
    const data = await api.post("/api/eload/purchase", {
      mobileNumber: mobile,
      productCode: selected.productCode,
      network,
      loadAmount: Number(selected.amount),
    });
    setLoading(false);
    setResult(data);
    setStep("result");
  };

  if (step === "result") return (
    <div className="p-4 lg:p-8 max-w-md mx-auto">
      <Card>
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          {result?.error ? (
            <><XCircle size={56} className="text-red-500 mx-auto" /><h2 className="text-xl font-bold text-red-600">Transaction Failed</h2><p className="text-gray-500">{result.error}</p></>
          ) : (
            <><CheckCircle size={56} className="text-green-500 mx-auto" /><h2 className="text-xl font-bold">Load Sent!</h2><p className="text-gray-500">₱{selected?.amount} {network} load sent to {mobile}</p></>
          )}
          <Button className="w-full" onClick={() => { setStep("form"); setResult(null); setSelected(null); setMobile(""); }}>Buy Another Load</Button>
        </CardContent>
      </Card>
    </div>
  );

  if (step === "confirm") return (
    <div className="p-4 lg:p-8 max-w-md mx-auto">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="text-xl font-bold">Confirm Purchase</h2>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Mobile</span><span className="font-medium">{mobile}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Network</span><span className="font-medium">{network}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Load</span><span className="font-medium">{formatCurrency(selected?.amount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Service Fee</span><span className="font-medium">{formatCurrency(fee)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-semibold">Total</span><span className="font-bold text-[#038E80]">{formatCurrency(Number(selected?.amount) + fee)}</span></div>
            <div className="flex justify-between text-xs text-gray-400 pt-1"><span>Wallet Balance</span><span>{formatCurrency(wallet?.availableBalance || 0)}</span></div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep("form")}>Back</Button>
            <Button className="flex-1" loading={loading} onClick={handleBuy}>Confirm</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">E-Load</h1>
      <Card>
        <CardContent className="pt-6 space-y-5">
          <Input label="Mobile Number" placeholder="09XXXXXXXXX" value={mobile} onChange={e => setMobile(e.target.value)} maxLength={11} />

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Network</p>
            <div className="grid grid-cols-3 gap-2">
              {NETWORKS.map(n => (
                <button key={n} onClick={() => setNetwork(n)} className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${network === n ? "border-[#038E80] bg-[#038E80]/5 text-[#038E80]" : "border-gray-200 text-gray-600"}`}>{n}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Choose Amount</p>
            {products.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No products available</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {products.map((p: any) => (
                  <button key={p.id} onClick={() => setSelected(p)} className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${selected?.id === p.id ? "border-[#038E80] bg-[#038E80]/5 text-[#038E80]" : "border-gray-200 text-gray-600"}`}>
                    ₱{Number(p.amount).toLocaleString()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Load</span><span>{formatCurrency(selected.amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Service Fee</span><span>{formatCurrency(fee)}</span></div>
              <div className="flex justify-between font-semibold border-t pt-2"><span>Total</span><span className="text-[#038E80]">{formatCurrency(Number(selected.amount) + fee)}</span></div>
            </div>
          )}

          <Button className="w-full" size="lg" disabled={!mobile || !selected} onClick={() => setStep("confirm")}>Buy Load</Button>
        </CardContent>
      </Card>
    </div>
  );
}
