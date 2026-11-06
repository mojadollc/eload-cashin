"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, XCircle, Wallet, Home } from "lucide-react";
import Link from "next/link";

function ReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(3);

  const ref = searchParams.get("ref");
  const failed = searchParams.get("failed");
  const isSuccess = !failed;

  useEffect(() => {
    if (!ref) { router.replace("/wallet"); return; }
    if (!isSuccess) return; // expired screen, no redirect

    // Countdown then redirect to wallet
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval);
          router.replace("/wallet?funded=1");
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isSuccess) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center space-y-5 px-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-green-100 animate-pulse" />
        <div className="relative w-28 h-28 rounded-full bg-green-500 flex items-center justify-center shadow-xl shadow-green-500/30">
          <CheckCircle className="w-14 h-14 text-white" />
        </div>
      </div>
      <div>
        <h2 className="text-3xl font-extrabold text-green-600">Payment Successful!</h2>
        <p className="text-gray-400 mt-2 text-sm">Your wallet has been credited.</p>
        <p className="text-xs text-gray-300 mt-1">Redirecting in {countdown}s...</p>
      </div>
      <button
        onClick={() => router.replace("/wallet?funded=1")}
        className="flex items-center gap-2 bg-green-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-green-500/30 hover:bg-green-600 transition-all"
      >
        <Wallet size={18} /> Go to Wallet Now
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center space-y-5 px-6">
      <div className="w-28 h-28 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/30">
        <XCircle className="w-14 h-14 text-white" />
      </div>
      <div>
        <h2 className="text-3xl font-extrabold text-red-600">Payment Cancelled</h2>
        <p className="text-gray-500 mt-2 max-w-xs text-sm">Your payment was not completed. No charges were made.</p>
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
