"use client";
import { useState, useEffect } from "react";
import { useApi } from "@/components/shared/use-api";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, XCircle, Loader2, Wallet } from "lucide-react";

const QUICK_AMOUNTS = [50, 100, 500, 1000, 2000];
type Step = "form" | "confirm" | "processing" | "result";

export default function TransferPage() {
  const api = useApi();
  const [step, setStep] = useState<Step>("form");
  const [wallet, setWallet] = useState<any>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => { api.get("/api/wallet").then(setWallet); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async () => {
    setStep("processing");
    const data = await api.post("/api/transfer", { accountNumber, amount });
    setResult(data);
    setStep("result");
  };

  const reset = () => { setStep("form"); setResult(null); setError(""); setAccountNumber(""); setAmount(""); };

  // Zero-balance wall
  if (wallet !== null && Number(wallet?.availableBalance ?? 0) <= 0) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-6 space-y-5">
      <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center">
        <span className="text-4xl">💳</span>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">No Balance</h2>
        <p className="text-gray-400 mt-2 max-w-xs">You need to fund your wallet before transferring.</p>
      </div>
      <a href="/wallet/fund" className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-lg bg-[#038E80] flex items-center justify-center gap-2">Fund Wallet</a>
      <a href="/dashboard" className="text-sm text-gray-400 underline">Back to Dashboard</a>
    </div>
  );

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
            <p className="text-gray-500 font-semibold mt-1">{result?.recipientName}</p>
            <p className="text-gray-400 text-sm mt-0.5">CashIn Tap · {accountNumber}</p>
          </div>
          <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100 w-full max-w-xs">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Transaction No.</p>
            <p className="text-sm font-black text-gray-800 font-mono break-all">{result?.transactionNumber}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700 w-full max-w-xs text-center">
            🎉 Free transfer — no fees charged
          </div>
          <button onClick={reset} className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-lg shadow-lg bg-[#038E80]">New Transfer</button>
        </>
      )}
    </div>
  );

  if (step === "processing") return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center space-y-5 px-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-[#038E80]" />
        <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-[#038E80]">
          <Loader2 className="h-12 w-12 text-white animate-spin" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-800">Sending...</h2>
    </div>
  );

  if (step === "confirm") return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <button onClick={() => setStep("form")} className="text-sm font-medium px-3 py-1.5 rounded-xl text-[#038E80] bg-[#038E80]/10">← Back</button>
        <p className="font-bold text-gray-800">Review & Confirm</p>
        <div className="w-14" />
      </div>
      <div className="flex-1 px-4 pt-4 pb-6 space-y-4">
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <div className="py-6 text-center text-white bg-[#038E80]">
            <p className="text-sm opacity-80 mb-1">CashIn Tap Wallet</p>
            <p className="text-5xl font-black">{formatCurrency(Number(amount))}</p>
          </div>
          <div className="bg-white p-4 space-y-3">
            <div className="flex justify-between"><span className="text-sm text-gray-400">Account No.</span><span className="font-bold text-gray-800 tracking-widest">{accountNumber}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-400">Amount</span><span className="font-bold">{formatCurrency(Number(amount))}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-400">CashIn-Tap Service Fee</span><span className="font-bold text-green-600">FREE</span></div>
            <div className="flex justify-between border-t pt-3">
              <span className="font-bold">Total Deducted</span>
              <span className="font-black text-base text-red-500">{formatCurrency(Number(amount))}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 pt-1">
              <span>Wallet Balance</span><span>{formatCurrency(wallet?.availableBalance || 0)}</span>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 text-center">
          🎉 CashIn Tap to CashIn Tap transfers are always free!
        </div>
        <div className="flex gap-3">
          <button onClick={() => setStep("form")} className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-500 font-bold text-sm">✏️ Edit</button>
          <button onClick={handleSend} className="flex-[2] py-3.5 rounded-2xl text-white font-extrabold text-base shadow-lg bg-[#038E80]">✅ Confirm Send</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-[#038E80] px-4 pt-6 pb-16">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-xl font-bold">CashIn Tap Transfer</h1>
          <div className="text-right">
            <p className="text-white/60 text-xs">Available</p>
            <p className="text-white font-bold text-sm">{formatCurrency(wallet?.availableBalance || 0)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-10 pb-8 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-[#038E80]" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recipient Account</p>
          </div>
          <input
            type="text"
            placeholder="Enter CashIn Tap account number"
            value={accountNumber}
            onChange={e => setAccountNumber(e.target.value)}
            className="w-full text-base font-semibold border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#038E80]"
          />
        </div>

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
            onChange={e => setAmount(e.target.value === "" ? "" : Number(e.target.value))} min={1}
            className="w-full text-2xl font-extrabold border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#038E80]" />
        </div>

        {amount !== "" && amount > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold">{formatCurrency(Number(amount))}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">CashIn-Tap Service Fee</span><span className="font-semibold text-green-600">FREE</span></div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-bold">Total Deducted</span>
              <span className="font-black text-red-500">{formatCurrency(Number(amount))}</span>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button
          disabled={!accountNumber || !amount || Number(amount) < 1}
          onClick={() => setStep("confirm")}
          className="w-full py-4 rounded-2xl text-white font-extrabold text-lg shadow-lg disabled:opacity-40 disabled:cursor-not-allowed bg-[#038E80]">
          Send{amount ? ` ${formatCurrency(Number(amount))}` : ""}
        </button>
      </div>
    </div>
  );
}
