import Link from "next/link";
import { ArrowRight, Target, Heart, Zap } from "lucide-react";
import LandingNav from "@/app/landing/nav";
import LandingFooter from "@/app/landing/footer";

const values = [
  {
    icon: Target,
    title: "Built for Filipinos",
    desc: "Every feature is designed around the real needs of Filipino users — from sari-sari store owners to everyday consumers who need fast, affordable financial services.",
    color: "bg-teal-50 text-teal-600",
  },
  {
    icon: Heart,
    title: "Trust First",
    desc: "We believe financial services should be transparent and reliable. Every peso is accounted for with an immutable ledger, and every transaction is verified before it's processed.",
    color: "bg-red-50 text-red-600",
  },
  {
    icon: Zap,
    title: "Speed & Simplicity",
    desc: "Complex financial infrastructure shouldn't mean a complex user experience. We obsess over making every interaction fast, clear, and effortless.",
    color: "bg-yellow-50 text-yellow-600",
  },
];

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "₱50M+", label: "Processed" },
  { value: "99.9%", label: "Uptime" },
  { value: "6", label: "Networks Supported" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-[#17202A]">
      <LandingNav />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-[#038E80]/5 via-white to-blue-50/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#038E80] font-semibold text-sm uppercase tracking-wider mb-3">About Us</p>
          <h1 className="text-5xl font-extrabold mb-6">We&apos;re building the financial layer for everyday Filipinos</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            CashIn Tap started with a simple idea: financial services in the Philippines should be fast, affordable, and accessible to everyone — not just those with bank accounts.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-[#038E80]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="text-4xl font-extrabold text-white">{value}</p>
                <p className="text-white/70 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-extrabold mb-6">Our story</h2>
        <div className="space-y-5 text-gray-600 leading-relaxed">
          <p>
            CashIn Tap was founded by a team of Filipino engineers and entrepreneurs who saw firsthand how difficult it was for ordinary Filipinos to access basic financial services. Sending money, buying load, and cashing out often meant long queues, high fees, and unreliable services.
          </p>
          <p>
            We built CashIn Tap to change that. Starting with e-load and cash out — the two most common financial needs of everyday Filipinos — we created a platform that is fast, transparent, and built on solid engineering principles.
          </p>
          <p>
            Today, CashIn Tap serves thousands of users across the Philippines, from individual consumers to sari-sari store owners who use our platform to serve their communities. We&apos;re just getting started.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold">What we stand for</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-md transition-all">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${color}`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-bold text-lg mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join us */}
      <section className="py-16 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl font-extrabold mb-4">Want to be part of the mission?</h2>
        <p className="text-gray-500 mb-8">We&apos;re always looking for talented people who want to build meaningful financial products for Filipinos.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/careers" className="inline-flex items-center justify-center gap-2 bg-[#038E80] text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-[#058174] transition-all">
            View Open Roles <ArrowRight size={16} />
          </Link>
          <Link href="/contact" className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-semibold px-7 py-3.5 rounded-xl hover:border-[#038E80] hover:text-[#038E80] transition-all">
            Get in Touch
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
