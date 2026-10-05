"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApi } from "@/components/shared/use-api";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, Loader2, Home, Wallet } from "lucide-react";
import Link from "next/link";

type Status = "checking" | "paid" | "pending" | "expired" | "failed";

function ReturnContent() {
  const api = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("checking");
  const [amount, setAmount] = useState(0);

  const ref = searchParams.get("ref");
  const failed = searchParams.get("failed");

  useEffect(() => {
    if (!ref) { router.replace("/wallet"); return; }

    if (failed === "1") {
      // Check anyway — user may have paid despite failure redirect
    }

    api.post("/api/wallet/fund/check", { transactionNumber: ref }).then((res: any) => {
      if (res?.status === "paid") {
        setAmount(res.amount || 0);
        setStatus("paid");
      } else if (res?.status === "expired") {
        setStatus("expired");
      } else {
        // QRPH or other async — still pending on Xendit
        setStatus("pending");
      }
    }).catch(() => setStatus("failed"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── CHECKING ─────────────────────────────────────────────────────────────────
  if (status === "checking") return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center space-y-5 px-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-[#038E80]" />
        <div className="relative w-24 h-24 rounded-full bg-[#038E80] flex items-center justify-center shadow-xl shadow-[#038E80]/30">
          <Loader2 className="h-12 w-12 text-white animate-spin" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Processing Payment</h2>
        <p className="text-gray-400 mt-2 text-sm">Please wait while we verify your payment...</p>
        <p className="text-xs text-gray-300 mt-3">Do not close this screen</p>
      </div>
    </div>
  );

  // ── PAID ─────────────────────────────────────────────────────────────────────
  if (status === "paid") return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center space-y-5 px-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-green-100 animate-pulse" />
        <div className="relative w-28 h-28 rounded-full bg-green-500 flex items-center justify-center shadow-xl shadow-green-500/30">
          <CheckCircle className="w-14 h-14 text-white" />
        </div>
      </div>
      <div>
        <h2 className="text-3xl font-extrabold text-green-600">Payment Successful!</h2>
        {amount > 0 && <p className="text-5xl font-extrabold text-gray-800 mt-2">{formatCurrency(amount)}</p>}
        <p className="text-gray-400 mt-2 text-sm">Your wallet has been credited.</p>
      </div>
      {ref && (
        <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100 w-full max-w-xs">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Reference No.</p>
          <p className="text-sm font-black text-gray-800 font-mono break-all">{ref}</p>
        </div>
      )}
      <div className="flex gap-3 w-full max-w-xs">
        <Link href="/dashboard" className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm flex items-center justify-center gap-2">
          <Home size={16} /> Home
        </Link>
        <Link href="/wallet" className="flex-[2] py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-[#038E80]">
          <Wallet size={16} /> Check Balance
        </Link>
      </div>
    </div>
  );

  // ── PENDING ───────────────────────────────────────────────────────────────────
  if (status === "pending") return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center space-y-5 px-6">
      <div className="w-28 h-28 rounded-full bg-blue-500 flex items-center justify-center shadow-xl shadow-blue-500/30">
        <Clock className="w-14 h-14 text-white" />
      </div>
      <div>
        <h2 className="text-3xl font-extrabold text-blue-600">Payment Pending</h2>
        <p className="text-gray-500 mt-2 max-w-xs text-sm">
          Your payment is being processed by the provider. This may take a few minutes to 24 hours for QRPh payments.
        </p>
        <p className="text-gray-400 mt-2 text-xs">Your wallet balance will update automatically once confirmed.</p>
      </div>
      {ref && (
        <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100 w-full max-w-xs">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Reference No.</p>
          <p className="text-sm font-black text-gray-800 font-mono break-all">{ref}</p>
        </div>
      )}
      <div className="flex gap-3 w-full max-w-xs">
        <Link href="/dashboard" className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm flex items-center justify-center gap-2">
          <Home size={16} /> Home
        </Link>
        <Link href="/wallet" className="flex-[2] py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-[#038E80]">
          <Wallet size={16} /> Check Balance
        </Link>
      </div>
    </div>
  );

  // ── EXPIRED / FAILED ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center space-y-5 px-6">
      <div className="w-28 h-28 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/30">
        <XCircle className="w-14 h-14 text-white" />
      </div>
      <div>
        <h2 className="text-3xl font-extrabold text-red-600">
          {status === "expired" ? "Payment Expired" : "Payment Failed"}
        </h2>
        <p className="text-gray-500 mt-2 max-w-xs text-sm">
          {status === "expired"
            ? "Your payment session has expired. Please try again."
            : "Something went wrong with your payment. Please try again."}
        </p>
      </div>
      <div className="flex gap-3 w-full max-w-xs">
        <Link href="/dashboard" className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm flex items-center justify-center gap-2">
          <Home size={16} /> Home
        </Link>
        <Link href="/wallet/fund" className="flex-[2] py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-[#038E80]">
          Try Again
        </Link>
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return <Suspense><ReturnContent /></Suspense>;
}
