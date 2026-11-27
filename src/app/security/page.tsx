import Link from "next/link";
import { Shield, Lock, Eye, Key, AlertTriangle, CheckCircle, ArrowRight, Server, RefreshCw, Fingerprint } from "lucide-react";
import LandingNav from "@/app/landing/nav";
import LandingFooter from "@/app/landing/footer";

const pillars = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    desc: "All data in transit is encrypted using TLS 1.3. Sensitive fields like passwords and PINs are hashed with bcrypt — never stored in plain text.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Key,
    title: "OTP Verification",
    desc: "Every login and sensitive action requires a one-time password sent to your registered mobile number via Firebase Phone Auth.",
    color: "bg-teal-50 text-teal-600",
  },
  {
    icon: Fingerprint,
    title: "MPIN & Biometrics",
    desc: "Protect your account with a 6-digit MPIN. The mobile app also supports biometric authentication for fast, secure access.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Eye,
    title: "Fraud Monitoring",
    desc: "Real-time transaction monitoring flags suspicious activity. Rate limiting and idempotency keys prevent duplicate charges and abuse.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: Server,
    title: "Immutable Ledger",
    desc: "Every balance change is recorded as an immutable ledger entry. Balances are always derived from the ledger — never manually edited.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: RefreshCw,
    title: "Webhook Verification",
    desc: "All payment provider webhooks are verified using HMAC-SHA256 signatures before any wallet credit is applied.",
    color: "bg-red-50 text-red-600",
  },
  {
    icon: AlertTriangle,
    title: "Reserve Before Debit",
    desc: "Funds are held via wallet holds before any provider call is made. This prevents overdrafts and ensures atomic transaction processing.",
    color: "bg-yellow-50 text-yellow-600",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    desc: "Admin, Finance, and Support roles have strictly scoped permissions. No single role has unrestricted access to all operations.",
    color: "bg-indigo-50 text-indigo-600",
  },
];

const practices = [
  "Passwords hashed with bcrypt (cost factor 12)",
  "JWT access tokens with short expiry + refresh token rotation",
  "All API routes protected with requireAuth middleware",
  "Rate limiting on sensitive endpoints (login, OTP, QR pay)",
  "Idempotency keys on all provider transactions",
  "Audit logs for every admin action",
  "Session tracking with IP address and location",
  "Automatic session expiry after 10 minutes of inactivity",
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white text-[#17202A]">
      <LandingNav />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-green-50/50 via-white to-teal-50/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Shield size={14} /> Bank-Grade Security
          </div>
          <h1 className="text-5xl font-extrabold mb-6">Your money is safe with us</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Security isn&apos;t an afterthought — it&apos;s built into every layer of CashIn Tap, from the database to the API to the mobile app.
          </p>
        </div>
      </section>

      {/* Security pillars */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold">Security pillars</h2>
          <p className="text-gray-500 mt-3">Eight layers of protection keeping your account and money safe.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon size={20} />
              </div>
              <h3 className="font-bold mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Best practices */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold">Security best practices</h2>
            <p className="text-gray-500 mt-3">Technical measures implemented across the entire platform.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {practices.map(p => (
              <div key={p} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100">
                <CheckCircle size={16} className="text-[#038E80] mt-0.5 shrink-0" />
                <p className="text-sm text-gray-700">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsible disclosure */}
      <section className="py-16 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl font-extrabold mb-4">Found a vulnerability?</h2>
        <p className="text-gray-500 mb-6">We take security reports seriously. If you discover a security issue, please contact us responsibly and we&apos;ll address it promptly.</p>
        <Link href="/contact" className="inline-flex items-center gap-2 bg-[#038E80] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#058174] transition-all">
          Report a Vulnerability <ArrowRight size={16} />
        </Link>
      </section>

      <LandingFooter />
    </div>
  );
}
