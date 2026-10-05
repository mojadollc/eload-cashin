"use client";
import { useEffect, useState, lazy, Suspense } from "react";
import { useApi } from "@/components/shared/use-api";
import { formatCurrency } from "@/lib/utils";
import { QrCode, ChevronLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { CHANNEL_LABELS, CHANNEL_COLORS, QRPhData } from "@/lib/qrph/parser";

const QRScanner = lazy(() => import("@/components/shared/qr-scanner"));

const CHANNELS = ["GCASH", "PAYMAYA", "BDO", "BPI", "METROBANK", "UNIONBANK", "GRABPAY", "INSTAPAY"];
const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

type Step = "form" | "confirm" | "processing" | "result";

export default function CashoutPage() {
  const api = useApi();
  const [step, setStep] = useState<Step>("form");
  const [amount, setAmount] = useState<number | "">("");
  const [channel, setChannel] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [wallet, setWallet] = useState<any>(null);
  const [fee, setFee] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [qrSource, setQrSource] = useState(false); // true = filled from QR

  useEffect(() => {
    api.get("/api/wallet").then(setWallet);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!amount) return;
    api.get(`/api/fees?service=CASHOUT&amount=${amount}`).then(d => {
      if (d?.fee !== undefined) setFee(d.fee);
    });
  }, [amount]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQRResult = (data: QRPhData) => {
    setShowScanner(false);
    setChannel(data.channel);
    setAccountNumber(data.accountNumber);
    setAccountName(data.accountName || "");
    if (data.amount) setAmount(data.amount);
    setQrSource(true);
    // only set amount from QR if it has one
  };

  const handleSend = async () => {
    setStep("processing");
    setLoading(true);
    const data = await api.post("/api/cashout/request", { amount, channel, accountNumber, accountName });
    setLoading(false);
    setResult(data);
    setStep("result");
  };

  const reset = () => {
    setStep("form"); setResult(null); setQrSource(false);
    setAccountNumber(""); setAccountName(""); setAmount(""); setChannel("");
  };

  const channelColor = channel ? (CHANNEL_COLORS[channel] || "#038E80") : "#038E80";
  const channelLabel = channel ? (CHANNEL_LABELS[channel] || channel) : "";

  // ── RESULT ───────────────────────────────────────────────────────────────────
  if (step === "result") return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center space-y-5 px-6">
      {result?.error ? (
        <>
          <div className="w-28 h-28 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/30">
            <XCircle className="w-14 h-14 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-red-600">Failed</h2>
            <p className="text-gray-500 mt-2 max-w-xs">{result.error}</p>
          </div>
          <button onClick={reset} className="w-full max-w-xs py-4 rounded-2xl bg-gray-100 text-gray-700 font-bold">Try Again</button>
        </>
      ) : (
        <>
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-green-100 animate-pulse" />
            <div className="relative w-28 h-28 rounded-full bg-green-500 flex items-center justify-center shadow-xl shadow-green-500/30">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-green-600">Sent!</h2>
            <p className="text-5xl font-extrabold text-gray-800 mt-2">{formatCurrency(Number(amount))}</p>
            <p className="text-gray-400 mt-1">{channelLabel} · {accountNumber}</p>
            {accountName && <p className="text-gray-500 font-semibold mt-0.5">{accountName}</p>}
          </div>
          {result?.transactionNumber && (
            <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100 w-full max-w-xs">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Transaction No.</p>
              <p className="text-sm font-black text-gray-800 font-mono break-all">{result.transactionNumber}</p>
            </div>
          )}
          <p className="text-xs text-gray-400 max-w-xs">Your send request is being processed. You'll be notified once completed.</p>
          <button onClick={reset} className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-lg shadow-lg" style={{ backgroundColor: channelColor }}>
            New Transaction
          </button>
        </>
      )}
    </div>
  );

  // ── PROCESSING ───────────────────────────────────────────────────────────────
  if (step === "processing") return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center space-y-5 px-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: channelColor }} />
        <div className="relative w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: channelColor }}>
          <Loader2 className="h-12 w-12 text-white animate-spin" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Processing...</h2>
        <p className="text-gray-400 mt-1">{channelLabel} · {formatCurrency(Number(amount))}</p>
        <p className="text-xs text-gray-300 mt-4">Please wait... do not close this screen</p>
      </div>
    </div>
  );

  // ── CONFIRM ──────────────────────────────────────────────────────────────────
  if (step === "confirm") return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <button onClick={() => setStep("form")} className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-xl" style={{ color: channelColor, backgroundColor: channelColor + "18" }}>
          <ChevronLeft className="h-5 w-5" /> Back
        </button>
        <p className="font-bold text-gray-800">Review & Confirm</p>
        <div className="w-14" />
      </div>

      <div className="flex-1 px-4 pt-4 pb-6 space-y-4">
        {/* Amount hero */}
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <div className="py-6 text-center text-white" style={{ backgroundColor: channelColor }}>
            {qrSource && (
              <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs font-semibold mb-2">
                <QrCode size={11} /> Scanned via QRPh
              </div>
            )}
            <p className="text-sm opacity-80 mb-1">{channelLabel}</p>
            <p className="text-5xl font-black">{formatCurrency(Number(amount))}</p>
          </div>
          <div className="bg-white p-4 space-y-3">
            <div className="flex justify-between"><span className="text-sm text-gray-400">Send To</span><span className="font-bold text-gray-800">{channelLabel}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-400">Account No.</span><span className="font-bold text-gray-800 tracking-widest">{accountNumber}</span></div>
            {accountName && <div className="flex justify-between"><span className="text-sm text-gray-400">Account Name</span><span className="font-bold text-gray-800">{accountName}</span></div>}
            <div className="flex justify-between"><span className="text-sm text-gray-400">Amount</span><span className="font-bold">{formatCurrency(Number(amount))}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-400">Service Fee</span><span className="font-bold">{formatCurrency(fee)}</span></div>
            <div className="flex justify-between border-t pt-3">
              <span className="font-bold">Total Deducted</span>
              <span className="font-black text-base text-red-500">{formatCurrency(Number(amount) + fee)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 pt-1">
              <span>Wallet Balance</span><span>{formatCurrency(wallet?.availableBalance || 0)}</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 text-center">
          ⚠️ Double-check account details. Transactions cannot be reversed.
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep("form")} className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-500 font-bold text-sm">✏️ Edit</button>
          <button onClick={handleSend} className="flex-[2] py-3.5 rounded-2xl text-white font-extrabold text-base shadow-lg" style={{ backgroundColor: channelColor }}>
            ✅ Confirm Send
          </button>
        </div>
      </div>
    </div>
  );

  // ── FORM ─────────────────────────────────────────────────────────────────────
  return (
    <>
      {showScanner && (
        <Suspense fallback={null}>
          <QRScanner onResult={handleQRResult} onClose={() => setShowScanner(false)} />
        </Suspense>
      )}

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#038E80] px-4 pt-6 pb-16">
          <div className="flex items-center justify-between">
            <h1 className="text-white text-xl font-bold">Send Money</h1>
            <div className="text-right">
              <p className="text-white/60 text-xs">Available</p>
              <p className="text-white font-bold text-sm">{formatCurrency(wallet?.availableBalance || 0)}</p>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-10 pb-8 space-y-4">
          {/* QR Scan button */}
          <button onClick={() => setShowScanner(true)}
            className="w-full bg-white rounded-2xl shadow-sm border-2 border-dashed border-[#038E80]/30 py-5 flex flex-col items-center gap-2 active:scale-[0.98] transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#038E80]/10 flex items-center justify-center">
              <QrCode size={24} className="text-[#038E80]" />
            </div>
            <p className="text-sm font-bold text-[#038E80]">Scan QRPh Code</p>
            <p className="text-xs text-gray-400">GCash · Maya · BPI · BDO · UnionBank · and more</p>
          </button>

          {/* QR filled badge */}
          {qrSource && (
            <div className="flex items-center gap-2 bg-[#038E80]/10 rounded-xl px-3 py-2">
              <QrCode size={14} className="text-[#038E80]" />
              <span className="text-xs font-semibold text-[#038E80]">Details filled from QR scan</span>
              <button onClick={() => { setQrSource(false); setAccountNumber(""); setAccountName(""); }} className="ml-auto text-xs text-gray-400 underline">Clear</button>
            </div>
          )}

          {/* Channel picker — always visible */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Send To</p>
            <div className="grid grid-cols-4 gap-2">
              {CHANNELS.map(c => {
                const color = CHANNEL_COLORS[c] || "#038E80";
                const active = channel === c;
                return (
                  <button key={c} onClick={() => setChannel(c)}
                    className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${active ? "border-transparent text-white" : "border-gray-100 text-gray-600 bg-gray-50"}`}
                    style={active ? { backgroundColor: color } : {}}>
                    {CHANNEL_LABELS[c] || c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rest of form — only after channel is picked */}
          {channel && (
            <>
              {/* Account details */}
              <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Details</p>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Account / Mobile Number</label>
                  <input type="tel" placeholder="09XXXXXXXXX or account number" value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    className="w-full text-base font-semibold border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#038E80]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Account Name</label>
                  <input type="text" placeholder="Full name of recipient" value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    className="w-full text-base font-semibold border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#038E80]" />
                </div>
              </div>

              {/* Amount */}
              <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</p>
                <div className="grid grid-cols-5 gap-2">
                  {QUICK_AMOUNTS.map(a => (
                    <button key={a} onClick={() => setAmount(a)}
                      className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${amount === a ? "border-[#038E80] bg-[#038E80]/5 text-[#038E80]" : "border-gray-100 text-gray-600"}`}>
                      ₱{a >= 1000 ? `${a / 1000}k` : a}
                    </button>
                  ))}
                </div>
                <input type="number" placeholder="Enter amount" value={amount}
                  onChange={e => setAmount(e.target.value === "" ? "" : Number(e.target.value))} min={100}
                  className="w-full text-2xl font-extrabold border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#038E80]" />
              </div>

              {/* Summary — only when amount is set */}
              {amount !== "" && amount > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold">{formatCurrency(amount)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Service Fee</span><span className="font-semibold">{formatCurrency(fee)}</span></div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-bold">Total Deducted</span>
                    <span className="font-black text-red-500">{formatCurrency(amount + fee)}</span>
                  </div>
                </div>
              )}

              <button
                disabled={!accountNumber || !accountName || !amount || Number(amount) < 100}
                onClick={() => setStep("confirm")}
                className="w-full py-4 rounded-2xl text-white font-extrabold text-lg shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                style={{ backgroundColor: channelColor }}>
                Send{amount ? ` ${formatCurrency(Number(amount))}` : ""}{channelLabel ? ` via ${channelLabel}` : ""}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
