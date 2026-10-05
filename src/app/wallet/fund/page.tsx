"use client";
import { useState, useEffect, useRef } from "react";
import { useApi } from "@/components/shared/use-api";
import { useAuth } from "@/components/shared/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];
const PENDING_KEY = "pending_fund_txn";

export default function FundWalletPage() {
  const api = useApi();
  const { accessToken } = useAuth();
  const [amount, setAmount] = useState<number>(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fee, setFee] = useState(0);
  const pendingTxn = useRef<string | null>(null);

  useEffect(() => {
    api.get(`/api/fees?service=WALLET_FUND&amount=${amount}`).then(d => {
      if (d?.fee !== undefined) setFee(d.fee);
    });
  }, [amount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Clear any leftover session key — do NOT cancel, Xendit may still settle it
    sessionStorage.removeItem(PENDING_KEY);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFund = async () => {
    setLoading(true); setError("");
    try {
      const data = await api.post("/api/wallet/fund", { amount });
      if (data?.checkoutUrl) {
        // Store txn so we can cancel if user comes back without paying
        pendingTxn.current = data.transactionNumber;
        sessionStorage.setItem(PENDING_KEY, data.transactionNumber);
        window.location.href = data.checkoutUrl;
      } else {
        setError(data?.error || "Failed to create payment. Please try again.");
        setLoading(false);
      }
    } catch (e: any) {
      setError(e?.message || "Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Fund Wallet</h1>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">How much?</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(a)} className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${amount === a ? "border-[#038E80] bg-[#038E80]/5 text-[#038E80]" : "border-gray-200 text-gray-600"}`}>
                  ₱{a.toLocaleString()}
                </button>
              ))}
            </div>
            <Input type="number" placeholder="Custom amount (min ₱100)" value={amount} onChange={e => setAmount(Number(e.target.value))} min={100} max={50000} />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-medium">{formatCurrency(amount)}</span></div>
            {fee > 0 && <div className="flex justify-between"><span className="text-gray-500">Service Fee</span><span className="font-medium">{formatCurrency(fee)}</span></div>}
            <div className="flex justify-between border-t pt-2 mt-2"><span className="font-semibold">Total</span><span className="font-bold text-[#038E80]">{formatCurrency(amount + fee)}</span></div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button className="w-full" size="lg" loading={loading} onClick={handleFund} disabled={amount < 100}>
            Continue to Payment
          </Button>
          <p className="text-xs text-gray-400 text-center">You will be redirected to Xendit&apos;s secure payment page</p>
        </CardContent>
      </Card>
    </div>
  );
}
