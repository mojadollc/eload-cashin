"use client";
import { useState } from "react";
import { Mail, MessageCircle, Clock, CheckCircle } from "lucide-react";
import LandingNav from "@/app/landing/nav";
import LandingFooter from "@/app/landing/footer";

const channels = [
  {
    icon: MessageCircle,
    title: "In-App Support",
    desc: "The fastest way to get help. Open a support ticket directly from the app and track its status in real time.",
    action: "Open the App",
    color: "bg-teal-50 text-teal-600",
  },
  {
    icon: Mail,
    title: "Email Support",
    desc: "Send us an email and we'll get back to you within 24 hours on business days.",
    action: "support@cashin-tap.com",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Clock,
    title: "Support Hours",
    desc: "Our team is available Monday to Saturday, 8:00 AM – 8:00 PM Philippine Standard Time.",
    action: null,
    color: "bg-purple-50 text-purple-600",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-white text-[#17202A]">
      <LandingNav />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-[#038E80]/5 via-white to-blue-50/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#038E80] font-semibold text-sm uppercase tracking-wider mb-3">Contact</p>
          <h1 className="text-5xl font-extrabold mb-6">We&apos;re here to help</h1>
          <p className="text-xl text-gray-500 max-w-xl mx-auto">Have a question, issue, or feedback? Reach out and we&apos;ll get back to you as soon as possible.</p>
        </div>
      </section>

      {/* Channels */}
      <section className="py-14 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-3 gap-6">
          {channels.map(({ icon: Icon, title, desc, action, color }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-md transition-all text-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5 ${color}`}>
                <Icon size={22} />
              </div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{desc}</p>
              {action && (
                <span className="text-[#038E80] font-semibold text-sm">{action}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact form */}
      <section className="py-10 pb-20 max-w-2xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-extrabold mb-2">Send us a message</h2>
          <p className="text-gray-500 text-sm mb-8">Fill out the form below and we&apos;ll respond within 24 hours.</p>

          {sent ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-600" />
              </div>
              <h3 className="font-bold text-xl mb-2">Message sent!</h3>
              <p className="text-gray-500 text-sm">We&apos;ll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Juan Dela Cruz"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E80]/20 focus:border-[#038E80]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <input
                    required
                    type="email"
                    placeholder="juan@email.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E80]/20 focus:border-[#038E80]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
                <input
                  required
                  type="text"
                  placeholder="What is this about?"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E80]/20 focus:border-[#038E80]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Describe your question or issue in detail..."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#038E80]/20 focus:border-[#038E80] resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-[#038E80] text-white font-semibold py-3.5 rounded-xl hover:bg-[#058174] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Sending...</>
                ) : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
