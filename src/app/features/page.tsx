import Link from "next/link";
import { Wallet, Smartphone, ArrowDownCircle, Shield, Zap, CheckCircle, ArrowRight, RefreshCw, Bell, QrCode } from "lucide-react";
import LandingNav from "@/app/landing/nav";
import LandingFooter from "@/app/landing/footer";

const features = [
  {
    icon: Wallet,
    title: "Digital Wallet",
    desc: "A ledger-based wallet that gives you a real-time view of every peso in and out. Your balance is always accurate — no surprises.",
    color: "bg-teal-50 text-teal-600",
    details: ["Instant balance updates", "Full transaction history", "Multiple funding methods"],
  },
  {
    icon: Smartphone,
    title: "E-Load",
    desc: "Buy prepaid load for Globe, Smart, DITO, TM, TNT, and Sun in seconds. No need to go to a store.",
    color: "bg-blue-50 text-blue-600",
    details: ["All major networks", "Promo & data packages", "Instant delivery"],
  },
  {
    icon: ArrowDownCircle,
    title: "Cash Out",
    desc: "Send money directly to GCash, Maya, or any bank account in the Philippines. Fast, reliable disbursements.",
    color: "bg-purple-50 text-purple-600",
    details: ["GCash & Maya support", "All major banks", "Same-day processing"],
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    desc: "Every transaction is protected with OTP verification, encrypted storage, and real-time fraud monitoring.",
    color: "bg-green-50 text-green-600",
    details: ["OTP verification", "End-to-end encryption", "Fraud detection"],
  },
  {
    icon: Zap,
    title: "Instant Processing",
    desc: "Transactions are queued and processed in real time using our async worker system — no delays, no timeouts.",
    color: "bg-yellow-50 text-yellow-600",
    details: ["Real-time processing", "Queue-based reliability", "Zero double-charges"],
  },
  {
    icon: RefreshCw,
    title: "Wallet Funding",
    desc: "Top up your wallet via GCash, Maya, credit/debit card, or bank transfer through our secure checkout.",
    color: "bg-orange-50 text-orange-600",
    details: ["Multiple payment methods", "Secure checkout", "Instant credit on success"],
  },
  {
    icon: QrCode,
    title: "QR Pay",
    desc: "Generate and scan QR codes to send and receive money instantly between CashIn Tap users.",
    color: "bg-pink-50 text-pink-600",
    details: ["Instant QR generation", "Scan to pay", "10-minute expiry for safety"],
  },
  {
    icon: Bell,
    title: "Real-Time Notifications",
    desc: "Get push notifications for every transaction — credits, debits, and status updates delivered instantly.",
    color: "bg-indigo-50 text-indigo-600",
    details: ["Push notifications", "In-app alerts", "Transaction receipts"],
  },
  {
    icon: CheckCircle,
    title: "Always Reliable",
    desc: "Idempotency keys and webhook verification ensure every transaction is processed exactly once — guaranteed.",
    color: "bg-red-50 text-red-600",
    details: ["Idempotency protection", "Webhook verification", "Automatic reconciliation"],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white text-[#17202A]">
      <LandingNav />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-[#038E80]/5 via-white to-blue-50/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#038E80] font-semibold text-sm uppercase tracking-wider mb-3">Features</p>
          <h1 className="text-5xl font-extrabold mb-6">Everything you need, nothing you don&apos;t</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            CashIn Tap is a complete fintech platform built for Filipinos — from e-load to cash out, all in one secure app.
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, desc, color, details }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${color}`}>
                <Icon size={22} />
              </div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">{desc}</p>
              <ul className="space-y-1.5">
                {details.map(d => (
                  <li key={d} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle size={13} className="text-[#038E80] shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[#038E80] to-[#058174]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to experience it yourself?</h2>
          <p className="text-white/70 mb-8">Create a free account and start using all features today.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-[#038E80] font-bold px-8 py-4 rounded-2xl hover:bg-gray-50 transition-all shadow-xl">
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
