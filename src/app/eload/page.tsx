"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/components/shared/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

const NETWORK_ICONS: Record<string, string> = {
  Globe: "🔵", Smart: "🟡", DITO: "🟣", TM: "🔴", TNT: "🟠", Sun: "🟤",
  "Mobile Legends": "🎮", Ragnarok: "⚔️", "Clash of Clans": "🏰",
  "PUBG Mobile": "🎯", "Free Fire": "🔥",
};

const NETWORK_COLORS: Record<string, string> = {
  Globe: "bg-blue-50 border-blue-200 text-blue-700",
  Smart: "bg-yellow-50 border-yellow-200 text-yellow-700",
  DITO: "bg-purple-50 border-purple-200 text-purple-700",
  TM: "bg-red-50 border-red-200 text-red-700",
  TNT: "bg-orange-50 border-orange-200 text-orange-700",
  Sun: "bg-amber-50 border-amber-200 text-amber-700",
  "Mobile Legends": "bg-blue-50 border-blue-200 text-blue-700",
  Ragnarok: "bg-red-50 border-red-200 text-red-700",
  "Clash of Clans": "bg-yellow-50 border-yellow-200 text-yellow-700",
  "PUBG Mobile": "bg-orange-50 border-orange-200 text-orange-700",
  "Free Fire": "bg-orange-50 border-orange-200 text-orange-700",
};

export default function EloadPage() {
  const api = useApi();
  const [mobile, setMobile] = useState("");
  const [category, setCategory] = useState("Telco");
  const [network, setNetwork] = useState("");
  const [products, setProducts] = useState<Record<string, Record<string, any[]>>>({});
  const [selected, setSelected] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [step, setStep] = useState<"form" | "confirm" | "result">("form");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [fee, setFee] = useState(0);

  useEffect(() => { api.get("/api/fees?service=ELOAD&amount=100").then(d => { if (d?.fee !== undefined) setFee(d.fee); }); }, []);

  useEffect(() => { api.get("/api/wallet").then(setWallet); }, []);

  useEffect(() => {
    setLoadingProducts(true);
    api.get("/api/eload/products").then(d => {
      setProducts(d || {});
      // Auto-select first network of current category
      const nets = Object.keys(d?.[category] || {});
      if (nets.length > 0) setNetwork(nets[0]);
      setLoadingProducts(false);
    });
  }, []);

  const categories = Object.keys(products);
  const networks = Object.keys(products[category] || {});
  const currentProducts = (network && products[category]?.[network]) || [];

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setNetwork("");
    setSelected(null);
    const nets = Object.keys(products[cat] || {});
    if (nets.length > 0) setNetwork(nets[0]);
  };

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

  // Result screen
  if (step === "result") return (
    <div className="min-h-screen bg-[#F7F9FA] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm p-8 text-center space-y-5">
        {result?.error ? (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">❌</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-600">Transaction Failed</h2>
              <p className="text-gray-500 text-sm mt-1">{result.error}</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Load Sent!</h2>
              <p className="text-gray-500 text-sm mt-1">{formatCurrency(selected?.amount)} {network} load sent to <strong>{mobile}</strong></p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-sm space-y-2 text-left">
              <div className="flex justify-between"><span className="text-gray-500">Network</span><span className="font-medium">{network}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-medium">{formatCurrency(selected?.amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Fee</span><span className="font-medium">{formatCurrency(fee)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="font-semibold">Total Deducted</span><span className="font-bold text-[#038E80]">{formatCurrency(Number(selected?.amount) + fee)}</span></div>
            </div>
          </>
        )}
        <Button className="w-full" size="lg" onClick={() => { setStep("form"); setResult(null); setSelected(null); setMobile(""); }}>
          Buy Another Load
        </Button>
      </div>
    </div>
  );

  // Confirm screen
  if (step === "confirm") return (
    <div className="min-h-screen bg-[#F7F9FA] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm p-6 space-y-5">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl bg-gray-100">
            {NETWORK_ICONS[network] || "📱"}
          </div>
          <h2 className="text-xl font-bold">Confirm Purchase</h2>
          <p className="text-gray-500 text-sm">{selected?.name}</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Mobile Number</span><span className="font-semibold">{mobile}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Network</span><span className="font-semibold">{network}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Load Amount</span><span className="font-semibold">{formatCurrency(selected?.amount)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Service Fee</span><span className="font-semibold">{formatCurrency(fee)}</span></div>
          <div className="flex justify-between border-t pt-3">
            <span className="font-bold">Total</span>
            <span className="font-bold text-[#038E80] text-base">{formatCurrency(Number(selected?.amount) + fee)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 pt-1">
            <span>Wallet Balance</span>
            <span>{formatCurrency(wallet?.availableBalance || 0)}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setStep("form")}>Back</Button>
          <Button className="flex-1" size="lg" loading={loading} onClick={handleBuy}>Confirm</Button>
        </div>
      </div>
    </div>
  );

  // Main form
  return (
    <div className="min-h-screen bg-[#F7F9FA]">
      {/* Header */}
      <div className="bg-[#038E80] px-4 pt-6 pb-16">
        <h1 className="text-white text-xl font-bold mb-1">Buy Load</h1>
        <p className="text-white/70 text-sm">Wallet: {formatCurrency(wallet?.availableBalance || 0)}</p>
      </div>

      {/* Card pulled up over header */}
      <div className="px-4 -mt-10 space-y-4 pb-8">
        {/* Mobile input */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mobile Number</label>
          <input
            type="tel"
            placeholder="09XXXXXXXXX"
            value={mobile}
            onChange={e => setMobile(e.target.value)}
            maxLength={11}
            className="w-full text-xl font-bold text-[#17202A] mt-1 focus:outline-none placeholder-gray-300"
          />
        </div>

        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Category</p>
            <div className="flex gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${category === cat ? "bg-[#038E80] text-white shadow-sm" : "bg-gray-100 text-gray-500"}`}
                >
                  {cat === "Telco" ? "📱 Telco" : "🎮 Games"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Network selector */}
        {networks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {category === "Telco" ? "Network" : "Game"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {networks.map(n => (
                <button
                  key={n}
                  onClick={() => { setNetwork(n); setSelected(null); }}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${network === n ? "border-[#038E80] bg-[#038E80]/5" : "border-gray-100 bg-gray-50"}`}
                >
                  <span className="text-2xl">{NETWORK_ICONS[n] || "📱"}</span>
                  <span className={`text-xs font-semibold ${network === n ? "text-[#038E80]" : "text-gray-600"}`}>{n}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {network && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {category === "Telco" ? "Load Amount" : "Select Package"}
            </p>
            {loadingProducts ? (
              <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : currentProducts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No products available</p>
            ) : (
              <div className="space-y-2">
                {currentProducts.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selected?.id === p.id ? "border-[#038E80] bg-[#038E80]/5" : "border-gray-100 bg-gray-50"}`}
                  >
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${selected?.id === p.id ? "text-[#038E80]" : "text-[#17202A]"}`}>{p.name}</p>
                      {p.description && <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>}
                    </div>
                    <p className={`text-base font-bold ml-4 ${selected?.id === p.id ? "text-[#038E80]" : "text-[#17202A]"}`}>₱{Number(p.amount)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary + CTA */}
        {selected && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Load</span><span className="font-medium">{formatCurrency(selected.amount)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Service Fee</span><span className="font-medium">{formatCurrency(fee)}</span></div>
            <div className="flex justify-between border-t pt-3"><span className="font-bold">Total</span><span className="font-bold text-[#038E80] text-base">{formatCurrency(Number(selected.amount) + fee)}</span></div>
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          disabled={!mobile || mobile.length < 11 || !selected}
          onClick={() => setStep("confirm")}
        >
          Buy Load
        </Button>
      </div>
    </div>
  );
}
