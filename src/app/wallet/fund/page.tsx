"use client";
import { useState, useEffect } from "react";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const PAYMENT_CHANNELS = [
  { group: "E-Wallets", items: [
    { id: "QRPH", label: "QRPh", icon: "📷" },
    { id: "PAYMAYA", label: "Maya", icon: "💚" },
    { id: "SHOPEEPAY", label: "ShopeePay", icon: "🟠" },
    { id: "GRABPAY", label: "GrabPay", icon: "🟢" },
  ]},
  { group: "Online Banking", items: [
    { id: "BPI", label: "BPI", icon: "🏦" },
    { id: "UNIONBANK", label: "UnionBank", icon: "🏦" },
    { id: "RCBC", label: "RCBC", icon: "🏦" },
  ]},
  { group: "Others", items: [
    { id: "GOOGLEPAY", label: "Google Pay", icon: "🔵" },
    { id: "APPLEPAY", label: "Apple Pay", icon: "🍎" },
  ]},
];

export default function FundWalletPage() {
  const api = useApi();
  const [amount, setAmount] = useState<number>(1000);
  const [method, setMethod] = useState("QRPH");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fee, setFee] = useState(0);

  useEffect(() => {
    api.get(`/api/fees?service=WALLET_FUND&amount=${amount}`).then(d => { if (d?.fee !== undefined) setFee(d.fee); });
  }, [amount]);

  const handleFund = async () => {
    setLoading(true); setError("");
    try {
      const data = await api.post("/api/wallet/fund", { amount, paymentMethod: method });
      if (data?.checkoutUrl) {
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

          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Payment Method</p>
            <div className="space-y-4">
              {PAYMENT_CHANNELS.map(group => (
                <div key={group.group}>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">{group.group}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map(m => (
                      <label key={m.id} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${method === m.id ? "border-[#038E80] bg-[#038E80]/5" : "border-gray-200"}`}>
                        <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="accent-[#038E80]" />
                        <span className="text-base">{m.icon}</span>
                        <span className="text-sm font-medium">{m.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-medium">{formatCurrency(amount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Service Fee</span><span className="font-medium">{formatCurrency(fee)}</span></div>
            <div className="flex justify-between border-t pt-2 mt-2"><span className="font-semibold">Total</span><span className="font-bold text-[#038E80]">{formatCurrency(amount + fee)}</span></div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button className="w-full" size="lg" loading={loading} onClick={handleFund} disabled={amount < 100}>
            Continue to Payment
          </Button>
          <p className="text-xs text-gray-400 text-center">You will be redirected to Xendit's secure payment page</p>
        </CardContent>
      </Card>
    </div>
  );
}
