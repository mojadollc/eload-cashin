"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/components/shared/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";

const CHANNELS = ["GCASH", "MAYA", "BDO", "BPI", "METROBANK", "UNIONBANK"];
const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export default function CashoutPage() {
  const api = useApi();
  const [amount, setAmount] = useState(1000);
  const [channel, setChannel] = useState("GCASH");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [wallet, setWallet] = useState<any>(null);
  const [step, setStep] = useState<"form" | "confirm" | "result">("form");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fee = 15;

  useEffect(() => { api.get("/api/wallet").then(setWallet); }, []);

  const handleCashout = async () => {
    setLoading(true);
    const data = await api.post("/api/cashout/request", { amount, channel, accountNumber, accountName });
    setLoading(false);
    setResult(data);
    setStep("result");
  };

  if (step === "result") return (
    <div className="p-4 lg:p-8 max-w-md mx-auto">
      <Card>
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          {result?.error ? (
            <><XCircle size={56} className="text-red-500 mx-auto" /><h2 className="text-xl font-bold text-red-600">Failed</h2><p className="text-gray-500">{result.error}</p></>
          ) : (
            <><CheckCircle size={56} className="text-blue-500 mx-auto" /><h2 className="text-xl font-bold">Send Processing</h2><p className="text-gray-500">Your send request is being processed. You'll be notified once completed.</p><p className="text-xs text-gray-400">Ref: {result?.transactionNumber}</p></>
          )}
          <Button className="w-full" onClick={() => { setStep("form"); setResult(null); }}>Done</Button>
        </CardContent>
      </Card>
    </div>
  );

  if (step === "confirm") return (
    <div className="p-4 lg:p-8 max-w-md mx-auto">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="text-xl font-bold">Confirm Send</h2>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Send to</span><span className="font-medium">{channel}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Account</span><span className="font-medium">{accountNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{accountName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-medium">{formatCurrency(amount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Fee</span><span className="font-medium">{formatCurrency(fee)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-semibold">Total Deducted</span><span className="font-bold text-red-500">{formatCurrency(amount + fee)}</span></div>
            <div className="flex justify-between text-xs text-gray-400 pt-1"><span>You'll receive</span><span className="font-semibold text-green-600">{formatCurrency(amount)}</span></div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep("form")}>Back</Button>
            <Button className="flex-1" loading={loading} onClick={handleCashout}>Confirm</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Send</h1>
      <div className="bg-gray-50 rounded-xl p-4 text-sm flex justify-between">
        <span className="text-gray-500">Available Balance</span>
        <span className="font-bold text-[#038E80]">{formatCurrency(wallet?.availableBalance || 0)}</span>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Amount</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(a)} className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${amount === a ? "border-[#038E80] bg-[#038E80]/5 text-[#038E80]" : "border-gray-200 text-gray-600"}`}>
                  ₱{a.toLocaleString()}
                </button>
              ))}
            </div>
            <Input type="number" placeholder="Custom amount" value={amount} onChange={e => setAmount(Number(e.target.value))} min={100} />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Send To</p>
            <div className="grid grid-cols-3 gap-2">
              {CHANNELS.map(c => (
                <button key={c} onClick={() => setChannel(c)} className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${channel === c ? "border-[#038E80] bg-[#038E80]/5 text-[#038E80]" : "border-gray-200 text-gray-600"}`}>{c}</button>
              ))}
            </div>
          </div>

          <Input label="Account Number" placeholder="09XXXXXXXXX" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
          <Input label="Account Name" placeholder="Full name" value={accountName} onChange={e => setAccountName(e.target.value)} />

          <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Fee</span><span>{formatCurrency(fee)}</span></div>
            <div className="flex justify-between font-semibold border-t pt-2"><span>You'll receive</span><span className="text-green-600">{formatCurrency(amount)}</span></div>
          </div>

          <Button className="w-full" size="lg" disabled={!accountNumber || !accountName} onClick={() => setStep("confirm")}>
            Send {formatCurrency(amount)}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
