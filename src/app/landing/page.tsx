import Link from "next/link";
import {
  ArrowRight, Shield, Zap, Smartphone, ArrowDownCircle,
  Wallet, CheckCircle, Star, ChevronRight
} from "lucide-react";
import LandingNav from "./nav";

const features = [
  { icon: Wallet, title: "Digital Wallet", desc: "Store, manage, and track your money with a secure ledger-based wallet system.", color: "bg-teal-50 text-teal-600" },
  { icon: Smartphone, title: "E-Load", desc: "Buy mobile load for Globe, Smart, DITO, TM, TNT, Sun instantly.", color: "bg-blue-50 text-blue-600" },
  { icon: ArrowDownCircle, title: "Cash Out", desc: "Send money to GCash, Maya, or any bank account in minutes.", color: "bg-purple-50 text-purple-600" },
  { icon: Shield, title: "Secure & Safe", desc: "Bank-grade security with OTP verification, JWT auth, and encrypted transactions.", color: "bg-green-50 text-green-600" },
  { icon: Zap, title: "Instant Processing", desc: "Real-time transaction processing powered by BullMQ queue workers.", color: "bg-yellow-50 text-yellow-600" },
  { icon: CheckCircle, title: "Always Reliable", desc: "Idempotent webhooks and ledger-first design ensure zero double-charges.", color: "bg-red-50 text-red-600" },
];

const steps = [
  { step: "01", title: "Create Account", desc: "Register with your mobile number and verify via OTP in under 2 minutes." },
  { step: "02", title: "Fund Your Wallet", desc: "Add money via GCash, Maya, card, or bank transfer through Xendit." },
  { step: "03", title: "Use Services", desc: "Buy e-load, cash out to any account, or track all your transactions." },
];

const testimonials = [
  { name: "Maria Santos", role: "Small Business Owner", text: "CashIn Tap made it so easy to manage my daily transactions. The e-load feature saves me so much time!", rating: 5 },
  { name: "Juan Dela Cruz", role: "Freelancer", text: "Cashing out my earnings is now instant. No more waiting days for bank transfers.", rating: 5 },
  { name: "Ana Reyes", role: "Online Seller", text: "The wallet system is transparent and I can see every transaction clearly. Very trustworthy.", rating: 5 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#17202A] overflow-x-hidden">

      <LandingNav />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#038E80]/5 via-white to-blue-50/30" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-[#038E80]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-[#038E80]/10 text-[#038E80] px-4 py-2 rounded-full text-sm font-semibold">
              <Zap size={14} /> Philippines&apos; Fastest Digital Wallet
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Your Money,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#038E80] to-[#058174]">Your Control</span>
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed max-w-lg">
              Fund your wallet, buy e-load for any network, and cash out to GCash or any bank — all in one secure platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-[#038E80] text-white font-semibold px-8 py-4 rounded-2xl hover:bg-[#058174] transition-all shadow-lg shadow-[#038E80]/25 text-base">
                Create Free Account <ArrowRight size={18} />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-2xl hover:border-[#038E80] hover:text-[#038E80] transition-all text-base">
                Sign In
              </Link>
            </div>
            <div className="flex items-center gap-8 pt-2">
              {[["10K+", "Users"], ["₱50M+", "Processed"], ["99.9%", "Uptime"]].map(([val, label]) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-[#038E80]">{val}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-72 h-[560px]">
              <div className="absolute inset-0 bg-gradient-to-b from-[#038E80] to-[#058174] rounded-[3rem] shadow-2xl shadow-[#038E80]/40" />
              <div className="absolute inset-2 bg-[#F7F9FA] rounded-[2.5rem] overflow-hidden">
                <div className="bg-gradient-to-br from-[#038E80] to-[#058174] p-6 pt-10">
                  <p className="text-white/70 text-xs">Good morning,</p>
                  <p className="text-white font-bold text-lg">Juan Dela Cruz 👋</p>
                  <div className="mt-4">
                    <p className="text-white/70 text-xs">Wallet Balance</p>
                    <p className="text-white text-3xl font-extrabold mt-1">₱5,250.00</p>
                  </div>
                  <div className="mt-4 bg-white/20 rounded-2xl px-4 py-2 inline-block">
                    <p className="text-white text-xs font-semibold">+ Fund Wallet</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Actions</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[["📱", "E-Load"], ["💸", "Cash Out"], ["📜", "History"], ["👤", "Profile"]].map(([icon, label]) => (
                      <div key={label} className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center text-lg">{icon}</div>
                        <span className="text-[9px] text-gray-500 font-medium">{label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">Recent</p>
                  {[
                    { icon: "📱", label: "Globe Load", amount: "-₱52", color: "text-red-500" },
                    { icon: "💰", label: "Wallet Funding", amount: "+₱1,000", color: "text-green-600" },
                    { icon: "💸", label: "Cash Out", amount: "-₱1,015", color: "text-red-500" },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{t.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-gray-700">{t.label}</p>
                          <p className="text-[9px] text-green-500">Success</p>
                        </div>
                      </div>
                      <p className={`text-xs font-bold ${t.color}`}>{t.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs font-bold">Load Sent!</p>
                <p className="text-[10px] text-gray-400">₱50 Globe</p>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-[#038E80]/10 rounded-xl flex items-center justify-center">
                <Wallet size={16} className="text-[#038E80]" />
              </div>
              <div>
                <p className="text-xs font-bold">Wallet Funded</p>
                <p className="text-[10px] text-gray-400">+₱1,000 added</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="py-10 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-gray-400 font-medium mb-6">POWERED BY TRUSTED PROVIDERS</p>
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16">
            {["Xendit", "GbitsAPI", "Globe", "Smart", "DITO", "GCash", "Maya"].map(p => (
              <span key={p} className="text-gray-400 font-bold text-sm tracking-wide">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-[#038E80] font-semibold text-sm uppercase tracking-wider mb-3">Features</p>
          <h2 className="text-4xl font-extrabold">Everything you need in one app</h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto">A complete fintech platform built for Filipinos — simple, fast, and secure.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
                <Icon size={22} />
              </div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-[#038E80]/5 to-blue-50/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-[#038E80] font-semibold text-sm uppercase tracking-wider mb-3">How It Works</p>
            <h2 className="text-4xl font-extrabold">Get started in 3 simple steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#038E80] to-[#058174] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#038E80]/25">
                  <span className="text-white font-extrabold text-xl">{step}</span>
                </div>
                <h3 className="font-bold text-xl mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p className="text-[#038E80] font-semibold text-sm uppercase tracking-wider mb-3">Pricing</p>
          <h2 className="text-4xl font-extrabold">Simple, transparent fees</h2>
          <p className="text-gray-500 mt-4">No hidden charges. No surprises.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { service: "Wallet Funding", fee: "₱15", desc: "Per top-up transaction", icon: "💰" },
            { service: "E-Load", fee: "₱2", desc: "Per load purchase", icon: "📱" },
            { service: "Cash Out", fee: "₱15", desc: "Per disbursement", icon: "💸" },
          ].map(({ service, fee, desc, icon }) => (
            <div key={service} className="bg-white border-2 border-gray-100 rounded-2xl p-8 text-center hover:border-[#038E80]/30 hover:shadow-lg transition-all">
              <span className="text-4xl">{icon}</span>
              <h3 className="font-bold text-lg mt-4 mb-1">{service}</h3>
              <p className="text-4xl font-extrabold text-[#038E80] my-3">{fee}</p>
              <p className="text-gray-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-[#038E80] font-semibold text-sm uppercase tracking-wider mb-3">Testimonials</p>
            <h2 className="text-4xl font-extrabold">Loved by thousands of Filipinos</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text, rating }) => (
              <div key={name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#038E80] to-[#058174] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-xs text-gray-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-[#038E80] to-[#058174] rounded-3xl p-12 lg:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">Ready to get started?</h2>
            <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">Join thousands of Filipinos who trust CashIn Tap for their daily financial needs.</p>
            <Link href="/register" className="inline-flex items-center gap-2 bg-white text-[#038E80] font-bold px-10 py-4 rounded-2xl hover:bg-gray-50 transition-all shadow-xl text-base">
              Create Free Account <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#17202A] text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#038E80] rounded-xl flex items-center justify-center">
                  <Wallet size={16} className="text-white" />
                </div>
                <span className="text-white font-bold">CashIn Tap</span>
              </div>
              <p className="text-sm leading-relaxed">Your trusted digital wallet for e-load, cash out, and more.</p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Security"] },
              { title: "Company", links: ["About", "Blog", "Careers"] },
              { title: "Support", links: ["Help Center", "Contact", "Privacy Policy"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="text-white font-semibold mb-4 text-sm">{title}</p>
                <ul className="space-y-2">
                  {links.map(l => <li key={l}><a href="#" className="text-sm hover:text-white transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2026 CashIn Tap. All rights reserved.</p>
            <p className="text-sm">cashin-tap.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
