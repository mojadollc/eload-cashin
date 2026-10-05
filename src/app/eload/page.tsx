"use client";
import { useState, useEffect } from "react";
import { useApi } from "@/components/shared/use-api";
import { useAuth } from "@/components/shared/auth-context";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, ChevronRight, RefreshCw, RotateCcw, Loader2 } from "lucide-react";
import Link from "next/link";

const MOBILE_NETWORKS = ["GLOBE", "TM", "SMART", "TNT", "DITO", "GOMO", "GOMO PH", "SUN"];
const GAME_NETWORKS = ["GAME CLUB", "RAZER GOLD", "ROBLOX", "RIOT", "STEAM", "GARENA", "GENSHIN", "MOBILE LEGENDS", "MLBB", "CODM"];
const CABLE_NETWORKS = ["CIGNAL", "CIGNAL TV", "SKY", "SKY CABLE", "VIVA", "VIVAMAX", "VIVA ONE", "SATELLITE", "VIU", "GSAT"];

const NETWORK_COLORS: Record<string, string> = {
  SMART: "#00B900", GLOBE: "#007DFE", TNT: "#F59E0B", DITO: "#06B6D4",
  TM: "#6366F1", GOMO: "#14B8A6", SUN: "#F97316", "GOMO PH": "#14B8A6",
  "GAME CLUB": "#8B5CF6", "RAZER GOLD": "#84CC16", ROBLOX: "#E11D48",
  GARENA: "#F97316", GENSHIN: "#6366F1", "MOBILE LEGENDS": "#F59E0B",
  CIGNAL: "#0EA5E9", SKY: "#0284C7", VIVA: "#E11D48", VIVAMAX: "#E11D48", VIU: "#7C3AED",
};

const NETWORK_LOGOS: Record<string, string> = {
  SMART: "/networks/smart.png", GLOBE: "/networks/globe.png",
  TNT: "/networks/tnt.png", DITO: "/networks/Dito.png",
  TM: "/networks/tm.png", GOMO: "/networks/gomo.png",
  SUN: "/networks/sun.png", "GAME CLUB": "/networks/gameclub.png",
  CIGNAL: "/networks/Cignal.png",
};

interface Product {
  promoId: number;
  productCode: string;
  network: string;
  service: string;
  name: string;
  amount: number;
  category: string;
  description: string;
  validity: string;
  addressType: string;
  addressMin: number;
  addressMax: number;
}

type Step = "browse" | "phone" | "confirm" | "processing" | "success" | "failed";

export default function EloadPage() {
  const api = useApi();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("browse");
  const [products, setProducts] = useState<Product[]>([]);
  const [networks, setNetworks] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState("mobile");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [phone, setPhone] = useState("");
  const [wallet, setWallet] = useState<any>(null);
  const [fee, setFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [txnNumber, setTxnNumber] = useState("");
  const [error, setError] = useState("");

  const loadSkus = async (force = false) => {
    setLoading(true);
    const url = force ? "/api/eload/products?action=refresh" : "/api/eload/products";
    const data = await api.get(url);
    const flat: Product[] = data?.flat || [];
    setProducts(flat);
    const nets = [...new Set(flat.map((p) => p.network))] as string[];
    setNetworks(nets);
    const mobileNets = nets.filter(n => MOBILE_NETWORKS.some(m => n.toUpperCase().includes(m)));
    setSelectedNetwork(mobileNets[0] || nets[0] || "");
    setSelectedType("mobile");
    setLoading(false);
  };

  useEffect(() => {
    Promise.all([
      api.get("/api/wallet"),
      api.get("/api/fees?service=ELOAD&amount=100"),
    ]).then(([w, f]) => {
      setWallet(w);
      if (f?.fee !== undefined) setFee(f.fee);
    });
    loadSkus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mobileNets = networks.filter(n => MOBILE_NETWORKS.some(m => n.toUpperCase().includes(m)));
  const gameNets = networks.filter(n => GAME_NETWORKS.some(g => n.toUpperCase().includes(g)));
  const cableNets = networks.filter(n => CABLE_NETWORKS.some(c => n.toUpperCase().includes(c)));
  const otherNets = networks.filter(n => !mobileNets.includes(n) && !gameNets.includes(n) && !cableNets.includes(n));

  const availableTypes = [
    { id: "mobile", label: "Mobile", color: "#007DFE", count: mobileNets.length },
    { id: "games", label: "Games", color: "#8B5CF6", count: gameNets.length },
    { id: "cable", label: "Cable/TV", color: "#0EA5E9", count: cableNets.length },
    ...(otherNets.length > 0 ? [{ id: "others", label: "Others", color: "#6B7280", count: otherNets.length }] : []),
  ].filter(t => t.count > 0);

  const typeNetworks = selectedType === "mobile" ? mobileNets
    : selectedType === "games" ? gameNets
    : selectedType === "cable" ? cableNets
    : otherNets;

  const netColor = NETWORK_COLORS[selectedNetwork] || "#6366F1";

  const categories = [...new Set(products.filter(p => p.network === selectedNetwork).map(p => p.category).filter(Boolean))];
  const filtered = products
    .filter(p => p.network === selectedNetwork)
    .filter(p => filter === "all" || p.category === filter)
    .filter(p => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || String(p.amount).includes(search));

  const handleBuy = (p: Product) => { setSelectedProduct(p); setPhone(""); setSearch(""); setStep("phone"); };

  const handleConfirm = async () => {
    if (!selectedProduct) return;
    setStep("processing");
    setProcessing(true);
    const data = await api.post("/api/eload/purchase", {
      mobileNumber: phone,
      promoId: selectedProduct.promoId,
      productCode: selectedProduct.productCode,
      network: selectedProduct.network,
      loadAmount: selectedProduct.amount,
    });
    setProcessing(false);
    if (data?.error) { setError(data.error); setStep("failed"); return; }
    setTxnNumber(data?.transactionNumber || "");
    setStep("success");
  };

  const reset = () => { setStep("browse"); setSelectedProduct(null); setPhone(""); setTxnNumber(""); setError(""); setFilter("all"); setSearch(""); };

  const networkColor = selectedProduct ? (NETWORK_COLORS[selectedProduct.network] || "#6366F1") : "#6366F1";

  // ── BROWSE ──────────────────────────────────────────────────────────────────
  if (step === "browse") return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <Link href="/dashboard" className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-xl text-[#038E80] bg-[#038E80]/10">
          <ChevronLeft className="h-5 w-5" /> Back
        </Link>
        <div className="text-center">
          <p className="font-bold text-gray-800 text-lg">Buy Load</p>
          <p className="text-[10px] text-gray-400">{wallet ? formatCurrency(wallet.availableBalance) : "—"} available</p>
        </div>
        <button onClick={() => loadSkus(true)} disabled={loading} className="p-1.5 rounded-full bg-gray-100 active:bg-gray-200">
          <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Type tabs */}
      <div className="bg-white border-b border-gray-100 px-3 py-3">
        <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="shrink-0 flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse" style={{ background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
                <div className="h-2.5 w-10 rounded-full bg-gray-200 animate-pulse" />
              </div>
            ))
          ) : availableTypes.map(type => {
            const active = selectedType === type.id;
            return (
              <button key={type.id} onClick={() => {
                const nets = type.id === "mobile" ? mobileNets : type.id === "games" ? gameNets : type.id === "cable" ? cableNets : otherNets;
                setSelectedType(type.id);
                setSelectedNetwork(nets[0] || "");
                setFilter("all");
              }} className="shrink-0 flex flex-col items-center gap-1.5">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${active ? "shadow-lg scale-105" : "opacity-50"}`} style={{ backgroundColor: type.color }}>
                  <span className="text-white text-[10px] font-black">{type.label.slice(0, 3).toUpperCase()}</span>
                </div>
                <span className={`text-[11px] font-bold ${active ? "text-gray-900" : "text-gray-400"}`}>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Network chips */}
      <div className="bg-white border-b border-gray-100 px-3 py-3">
        {loading ? (
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl border-2 border-gray-100 min-w-[72px]">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-2.5 w-10 rounded-full bg-gray-200 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
            {typeNetworks.map(net => {
              const color = NETWORK_COLORS[net] || "#6366F1";
              const logo = NETWORK_LOGOS[net];
              const active = selectedNetwork === net;
              return (
                <button key={net} onClick={() => { setSelectedNetwork(net); setFilter("all"); }}
                  className={`shrink-0 flex flex-col items-center justify-center gap-1 px-4 py-2.5 rounded-2xl border-2 min-w-[72px] transition-all ${active ? "border-transparent shadow-md" : "border-gray-100 bg-white"}`}
                  style={active ? { backgroundColor: color } : {}}>
                  {logo && <img src={logo} alt={net} className={`w-8 h-8 object-contain ${active ? "brightness-0 invert" : ""}`} />}
                  <span className={`text-xs font-bold ${active ? "text-white" : "text-gray-700"}`}>{net}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Products */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white px-3 pt-2.5 pb-1.5">
          {loading ? (
            <div className="h-10 rounded-2xl bg-gray-200 animate-pulse" />
          ) : (
            <input type="text" placeholder={`Search ${selectedNetwork} promos...`} value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 px-4 rounded-2xl bg-gray-100 text-[13px] placeholder:text-gray-400 focus:outline-none" />
          )}
        </div>

        {!loading && categories.length > 0 && (
          <div className="bg-white border-b border-gray-100 px-3 py-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {["all", ...categories].map(c => (
              <button key={c} onClick={() => setFilter(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all ${filter === c ? "text-white shadow-sm" : "bg-gray-100 text-gray-500"}`}
                style={filter === c ? { backgroundColor: netColor } : {}}>
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="shrink-0 w-16 h-16 rounded-2xl bg-gray-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 rounded-full animate-pulse w-3/4" />
                    <div className="h-2.5 bg-gray-200 rounded-full animate-pulse w-full" />
                    <div className="h-2.5 bg-gray-200 rounded-full animate-pulse w-1/2" />
                    <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
                  </div>
                  <div className="shrink-0 space-y-1.5 items-end flex flex-col">
                    <div className="h-4 w-10 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-3 w-4 bg-gray-200 rounded-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">No products available</p>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(p => (
                <button key={p.promoId} onClick={() => handleBuy(p)}
                  className="bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm active:scale-[0.98] transition-all text-left flex items-center gap-3">
                  <div className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: netColor + "18" }}>
                    {NETWORK_LOGOS[p.network]
                      ? <img src={NETWORK_LOGOS[p.network]} alt={p.network} className="w-10 h-10 object-contain" />
                      : <span className="text-base font-black" style={{ color: netColor }}>₱{p.amount}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-gray-900 leading-snug">{p.name}</p>
                    {p.description && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{p.description}</p>}
                    {p.validity && (
                      <span className="inline-block mt-1.5 text-[11px] font-semibold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: netColor }}>
                        {p.validity.replace("Valid for ", "")}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-black" style={{ color: netColor }}>₱{p.amount}</p>
                    <ChevronRight className="h-4 w-4 text-gray-300 ml-auto mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );

  // ── PHONE ────────────────────────────────────────────────────────────────────
  if (step === "phone") {
    const minLen = selectedProduct?.addressMin || 10;
    const maxLen = selectedProduct?.addressMax || 11;
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
          <button onClick={() => setStep("browse")} className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-xl" style={{ color: networkColor, backgroundColor: networkColor + "18" }}>
            <ChevronLeft className="h-5 w-5" /> Back
          </button>
          <p className="font-bold text-gray-800">Enter Mobile No.</p>
          <div className="w-14" />
        </div>

        <div className="flex-1 px-4 pt-4 pb-6 space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">{selectedProduct?.network}</p>
              <p className="font-bold text-gray-800 text-sm">{selectedProduct?.name}</p>
              {selectedProduct?.validity && <p className="text-[10px] text-gray-400">{selectedProduct.validity}</p>}
            </div>
            <p className="text-xl font-black" style={{ color: networkColor }}>₱{selectedProduct?.amount}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <input type="tel" inputMode="numeric" maxLength={maxLen} value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, maxLen))}
              placeholder="09XX XXX XXXX"
              className="w-full text-3xl font-extrabold text-gray-800 tracking-widest text-center px-4 py-5 bg-transparent focus:outline-none placeholder:text-gray-300" />
            {phone.length > 0 && <p className="text-xs text-gray-400 text-center pb-3">{phone.length} / {maxLen} digits</p>}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("browse")} className="flex-1 py-3.5 rounded-2xl font-bold text-sm" style={{ color: networkColor, backgroundColor: networkColor + "18" }}>
              Back
            </button>
            <button onClick={() => setStep("confirm")} disabled={phone.length < minLen}
              className="flex-[2] py-3.5 rounded-2xl text-white font-bold text-base disabled:opacity-40 shadow-lg"
              style={{ backgroundColor: phone.length >= minLen ? networkColor : undefined }}>
              Next →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CONFIRM ──────────────────────────────────────────────────────────────────
  if (step === "confirm") return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <button onClick={() => setStep("phone")} className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-xl" style={{ color: networkColor, backgroundColor: networkColor + "18" }}>
          <ChevronLeft className="h-5 w-5" /> Back
        </button>
        <p className="font-bold text-gray-800">Review & Confirm</p>
        <div className="w-14" />
      </div>

      <div className="flex-1 px-4 pb-6 pt-4 space-y-4">
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <div className="py-6 text-center text-white" style={{ backgroundColor: networkColor }}>
            <p className="text-sm opacity-80 mb-1">{selectedProduct?.network} · {selectedProduct?.name}</p>
            <p className="text-5xl font-black">₱{selectedProduct?.amount}</p>
            {selectedProduct?.validity && <p className="text-xs opacity-70 mt-1">{selectedProduct.validity}</p>}
          </div>
          <div className="bg-white p-4 space-y-3">
            <div className="flex justify-between"><span className="text-sm text-gray-400">Mobile Number</span><span className="font-black text-gray-800 tracking-widest">{phone}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-400">Network</span><span className="font-bold text-gray-800">{selectedProduct?.network}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-400">Load Amount</span><span className="font-bold">{formatCurrency(selectedProduct?.amount || 0)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-400">Service Fee</span><span className="font-bold">{formatCurrency(fee)}</span></div>
            <div className="flex justify-between border-t pt-3"><span className="font-bold">Total</span><span className="font-black text-base" style={{ color: networkColor }}>{formatCurrency((selectedProduct?.amount || 0) + fee)}</span></div>
            <div className="flex justify-between text-xs text-gray-400 pt-1"><span>Wallet Balance</span><span>{formatCurrency(wallet?.availableBalance || 0)}</span></div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 text-center">
          ⚠️ Double-check the mobile number. Load cannot be reversed.
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep("phone")} className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-500 font-bold text-sm">✏️ Edit</button>
          <button onClick={reset} className="flex-1 py-3.5 rounded-2xl bg-red-50 text-red-500 font-bold text-sm border border-red-100">Cancel</button>
        </div>
        <button onClick={handleConfirm} className="w-full py-4 rounded-2xl text-white font-extrabold text-lg shadow-xl" style={{ backgroundColor: networkColor }}>
          ✅ Send Load Now
        </button>
      </div>
    </div>
  );

  // ── PROCESSING ───────────────────────────────────────────────────────────────
  if (step === "processing") return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center space-y-5 px-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: networkColor }} />
        <div className="relative w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: networkColor }}>
          <Loader2 className="h-12 w-12 text-white animate-spin" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Processing Load</h2>
        <p className="text-gray-400 mt-1">{selectedProduct?.network} · ₱{selectedProduct?.amount}</p>
        <p className="text-gray-400 text-sm">{phone}</p>
        <p className="text-xs text-gray-300 mt-4">Please wait... do not close this screen</p>
      </div>
    </div>
  );

  // ── SUCCESS ──────────────────────────────────────────────────────────────────
  if (step === "success") return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center space-y-5 px-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-green-100 animate-pulse" />
        <div className="relative w-28 h-28 rounded-full bg-green-500 flex items-center justify-center shadow-xl shadow-green-500/30">
          <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <div>
        <h2 className="text-3xl font-extrabold text-green-600">Load Sent!</h2>
        <p className="text-5xl font-extrabold text-gray-800 mt-2">₱{selectedProduct?.amount}</p>
        <p className="text-gray-400 mt-1">{selectedProduct?.network} · {selectedProduct?.name}</p>
        <p className="text-gray-500 font-bold tracking-widest mt-1">{phone}</p>
      </div>
      {txnNumber && (
        <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100 w-full max-w-xs">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Transaction No.</p>
          <p className="text-sm font-black text-gray-800 font-mono break-all">{txnNumber}</p>
        </div>
      )}
      <button onClick={reset} className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2" style={{ backgroundColor: networkColor }}>
        <RotateCcw className="h-5 w-5" /> New Transaction
      </button>
    </div>
  );

  // ── FAILED ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center space-y-5 px-6">
      <div className="w-28 h-28 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/30">
        <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <div>
        <h2 className="text-3xl font-extrabold text-red-600">Failed</h2>
        <p className="text-gray-500 mt-2 max-w-xs">{error || "Transaction failed. Please try again."}</p>
      </div>
      <div className="flex gap-3 w-full max-w-xs">
        <button onClick={reset} className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-500 font-bold">Cancel</button>
        <button onClick={() => { setError(""); setStep("confirm"); }} className="flex-1 py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-2" style={{ backgroundColor: networkColor }}>
          <RotateCcw className="h-4 w-4" /> Retry
        </button>
      </div>
    </div>
  );
}
