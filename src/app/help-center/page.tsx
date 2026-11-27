import Link from "next/link";
import { Search, Wallet, Smartphone, ArrowDownCircle, Shield, ChevronRight, MessageCircle } from "lucide-react";
import LandingNav from "@/app/landing/nav";
import LandingFooter from "@/app/landing/footer";

const categories = [
  {
    icon: Wallet,
    title: "Wallet & Funding",
    color: "bg-teal-50 text-teal-600",
    articles: [
      "How to fund your wallet",
      "Why is my funding pending?",
      "What payment methods are accepted?",
      "How long does funding take?",
      "How to check your wallet balance",
    ],
  },
  {
    icon: Smartphone,
    title: "E-Load",
    color: "bg-blue-50 text-blue-600",
    articles: [
      "How to buy e-load",
      "Which networks are supported?",
      "My load wasn't delivered — what do I do?",
      "Can I buy load for someone else?",
      "What are promo packages?",
    ],
  },
  {
    icon: ArrowDownCircle,
    title: "Cash Out",
    color: "bg-purple-50 text-purple-600",
    articles: [
      "How to cash out to GCash or Maya",
      "How to cash out to a bank account",
      "Cash out fees explained",
      "Why is my cash out pending?",
      "Cash out limits and requirements",
    ],
  },
  {
    icon: Shield,
    title: "Account & Security",
    color: "bg-green-50 text-green-600",
    articles: [
      "How to reset your password",
      "How to change your MPIN",
      "What to do if your account is locked",
      "How to enable biometric login",
      "How to verify your mobile number",
    ],
  },
];

const faqs = [
  {
    q: "How long does it take to fund my wallet?",
    a: "Wallet funding via GCash or Maya is typically instant. Bank transfers may take 1–3 business days depending on your bank.",
  },
  {
    q: "Is there a fee for cashing out?",
    a: "Yes, a small fee applies to cash out transactions. The exact fee is shown before you confirm the transaction. You can view all fee rules in the app.",
  },
  {
    q: "What happens if my e-load wasn't delivered?",
    a: "If your load wasn't delivered within 5 minutes, your wallet will be automatically refunded. You can also contact support for manual resolution.",
  },
  {
    q: "How do I contact support?",
    a: "You can reach us through the in-app support ticket system, or by emailing support@cashin-tap.com. We respond within 24 hours.",
  },
  {
    q: "Is my money safe?",
    a: "Yes. All funds are held securely and every transaction is recorded in an immutable ledger. We use bank-grade encryption and OTP verification on all sensitive actions.",
  },
  {
    q: "Can I use CashIn Tap without a bank account?",
    a: "Absolutely. You can fund your wallet via GCash or Maya and cash out to the same. No bank account required.",
  },
];

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-white text-[#17202A]">
      <LandingNav />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-[#038E80]/5 via-white to-blue-50/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#038E80] font-semibold text-sm uppercase tracking-wider mb-3">Help Center</p>
          <h1 className="text-5xl font-extrabold mb-6">How can we help?</h1>
          <div className="relative max-w-xl mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for answers..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E80]/20 focus:border-[#038E80] bg-white shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map(({ icon: Icon, title, color, articles }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-all">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon size={20} />
              </div>
              <h3 className="font-bold mb-4">{title}</h3>
              <ul className="space-y-2">
                {articles.map(a => (
                  <li key={a}>
                    <a href="#" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#038E80] transition-colors group">
                      <ChevronRight size={12} className="text-gray-300 group-hover:text-[#038E80] shrink-0" />
                      {a}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold mb-10 text-center">Frequently asked questions</h2>
          <div className="space-y-4">
            {faqs.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-bold mb-2">{q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still need help */}
      <section className="py-16 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className="bg-[#038E80]/5 rounded-3xl p-10 border border-[#038E80]/10">
          <MessageCircle size={36} className="text-[#038E80] mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold mb-3">Still need help?</h2>
          <p className="text-gray-500 mb-6">Our support team is available Monday–Saturday, 8AM–8PM. We typically respond within a few hours.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-[#038E80] text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-[#058174] transition-all">
            Contact Support
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
