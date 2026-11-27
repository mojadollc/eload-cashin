"use client";
import { useState, useEffect, useRef } from "react";
import { useApi } from "@/components/shared/use-api";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, QrCode, CheckCircle, RefreshCw, Clock, Info } from "lucide-react";
import Image from "next/image";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];
const QRPH_FEE_RATE = 0.015;
const QR_EXPIRY_SECONDS = 300; // 5 minutes display timeout before suggesting refresh

type Step = "amount" | "qr" | "success";

export default function FundWalletPage() {
  const api = useApi();
  const router = useRouter();

  const [amount, setAmount] = useState<number>(1000);
  const [appFee, setAppFee] = useState(0);
  const [step, setStep] = useState<Step>("amount");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // QR state
  const [qrData, setQrData] = useState("");
  const [txnNumber, setTxnNumber] = useState("");
  const [totalCharge, setTotalCharge] = useState(0);
  const [qrphFee, setQrphFee] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paid, setPaid] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch app fee whenever amount changes
  useEffect(() => {
    api.get(`/api/fees?service=WALLET_FUND&amount=${amount}`).then((d: any) => {
      if (d?.fee !== undefined) setAppFee(d.fee);
    });
  }, [amount]); // eslint-disable-line react-hooks/exhaustive-deps

  const computedQrphFee = Math.ceil(amount * QRPH_FEE_RATE * 100) / 100;
  const totalFee = appFee + computedQrphFee;
  const totalToPay = amount + totalFee;

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => () => stopPolling(), []);

  const startPolling = (txn: string) => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/wallet/fund/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionNumber: txn }),
        });
        const data = await res.json();
        if (data.status === "paid") {
          stopPolling();
          setPaid(true);
          setStep("success");
          setTimeout(() => router.replace("/wallet?funded=1"), 3000);
        }
      } catch { /* ignore */ }
    }, 3000);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.post("/api/wallet/fund", { amount });
      if (data?.qrData) {
        setQrData(data.qrData);
        setTxnNumber(data.transactionNumber);
        setTotalCharge(data.totalCharge);
        setQrphFee(data.qrphFee);
        setStep("qr");
        startPolling(data.transactionNumber);
      } else {
        setError(data?.error || "Failed to generate QR code. Please try again.");
      }
    } catch (e: any) {
      setError(e?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    stopPolling();
    setStep("amount");
    setQrData("");
    setTxnNumber("");
    setElapsed(0);
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center space-y-5 px-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-green-100 animate-pulse" />
          <div className="relative w-28 h-28 rounded-full bg-green-500 flex items-center justify-center shadow-xl shadow-green-500/30">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-green-600">Payment Received!</h2>
          <p className="text-gray-500 mt-2 text-sm">₱{amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })} has been added to your wallet.</p>
          <p className="text-xs text-gray-400 mt-1">Redirecting to wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => step === "qr" ? handleBack() : router.replace("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} /> {step === "qr" ? "Back" : "Home"}
        </button>
        <h1 className="text-2xl font-bold">Fund Wallet</h1>
      </div>

      {step === "amount" && (
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">How much do you want to load?</p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {QUICK_AMOUNTS.map(a => (
                  <button key={a} onClick={() => setAmount(a)}
                    className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${amount === a ? "border-[#038E80] bg-[#038E80]/5 text-[#038E80]" : "border-gray-200 text-gray-600"}`}>
                    ₱{a.toLocaleString()}
                  </button>
                ))}
              </div>
              <Input type="number" placeholder="Custom amount (min ₱100)" value={amount}
                onChange={e => setAmount(Number(e.target.value))} min={100} max={50000} />
            </div>

            {/* Fee breakdown */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Amount to load</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
              {appFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Service fee</span>
                  <span className="font-medium">{formatCurrency(appFee)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  QR Ph processing fee
                  <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">1.5%</span>
                </span>
                <span className="font-medium">{formatCurrency(computedQrphFee)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-1">
                <span className="font-semibold">Total to pay</span>
                <span className="font-bold text-[#038E80]">{formatCurrency(totalToPay)}</span>
              </div>
            </div>

            {/* QR Ph info */}
            <div className="flex gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Pay via <strong>QR Ph</strong> — scan with GCash, Maya, BDO, BPI, or any QR Ph-enabled app. The 1.5% fee is charged by PayMongo.
              </p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button className="w-full" size="lg" loading={loading} onClick={handleGenerate} disabled={amount < 100}>
              <QrCode size={16} className="mr-2" /> Generate QR Code
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "qr" && (
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="text-center space-y-1">
              <p className="font-semibold text-gray-800">Scan to Pay</p>
              <p className="text-xs text-gray-400">Use GCash, Maya, BDO, BPI, or any QR Ph app</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="relative bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm">
                {qrData.startsWith("http") ? (
                  <img src={qrData} alt="QR Ph Code" className="w-52 h-52 object-contain" />
                ) : qrData ? (
                  <img src={`data:image/png;base64,${qrData}`} alt="QR Ph Code" className="w-52 h-52 object-contain" />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center">
                    <RefreshCw size={32} className="text-gray-300 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Amount summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Amount to load</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
              {appFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Service fee</span>
                  <span className="font-medium">{formatCurrency(appFee)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">QR Ph fee (1.5%)</span>
                <span className="font-medium">{formatCurrency(qrphFee)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Scan & pay</span>
                <span className="font-bold text-[#038E80]">{formatCurrency(totalCharge)}</span>
              </div>
            </div>

            {/* Polling status */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <RefreshCw size={13} className="animate-spin text-[#038E80]" />
              <span>Waiting for payment...</span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={11} /> {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
              </span>
            </div>

            {elapsed >= QR_EXPIRY_SECONDS && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 text-center">
                QR code may have expired. <button onClick={handleBack} className="font-semibold underline">Generate a new one</button>
              </div>
            )}

            <p className="text-[11px] text-gray-400 text-center">
              Ref: {txnNumber} · Do not close this page until payment is confirmed
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
