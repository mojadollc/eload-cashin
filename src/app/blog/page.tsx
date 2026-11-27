import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import LandingNav from "@/app/landing/nav";
import LandingFooter from "@/app/landing/footer";

const posts = [
  {
    category: "Product",
    title: "Introducing QR Pay: Send Money Instantly with a Scan",
    excerpt: "We're excited to launch QR Pay — the fastest way to send and receive money between CashIn Tap users. No account numbers, no typos, just scan and pay.",
    date: "January 15, 2026",
    readTime: "3 min read",
    color: "bg-teal-50 text-teal-600",
  },
  {
    category: "Security",
    title: "How We Keep Your Money Safe: A Deep Dive into Our Security Architecture",
    excerpt: "From immutable ledgers to HMAC-verified webhooks, here's a transparent look at the technical measures we've built to protect every peso in your wallet.",
    date: "January 8, 2026",
    readTime: "6 min read",
    color: "bg-green-50 text-green-600",
  },
  {
    category: "Company",
    title: "CashIn Tap Reaches 10,000 Active Users",
    excerpt: "We're humbled and grateful. Ten thousand Filipinos now trust CashIn Tap for their daily financial needs. Here's a look back at how we got here.",
    date: "December 28, 2025",
    readTime: "4 min read",
    color: "bg-blue-50 text-blue-600",
  },
  {
    category: "Tips",
    title: "5 Ways to Save Money on E-Load Every Month",
    excerpt: "Smart load buying habits can save you hundreds of pesos a month. Here are five practical tips for getting the most out of your mobile data and calls.",
    date: "December 20, 2025",
    readTime: "4 min read",
    color: "bg-purple-50 text-purple-600",
  },
  {
    category: "Product",
    title: "New: Cash Out to Any Bank Account in the Philippines",
    excerpt: "You can now send money directly to any bank account in the Philippines — not just GCash and Maya. Faster disbursements, more options.",
    date: "December 10, 2025",
    readTime: "2 min read",
    color: "bg-orange-50 text-orange-600",
  },
  {
    category: "Community",
    title: "How Sari-Sari Store Owners Are Using CashIn Tap to Grow Their Business",
    excerpt: "We spoke to store owners across Luzon, Visayas, and Mindanao about how digital wallets and e-load reselling are changing their livelihoods.",
    date: "November 30, 2025",
    readTime: "7 min read",
    color: "bg-yellow-50 text-yellow-600",
  },
];

export default function BlogPage() {
  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-white text-[#17202A]">
      <LandingNav />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-[#038E80]/5 via-white to-blue-50/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#038E80] font-semibold text-sm uppercase tracking-wider mb-3">Blog</p>
          <h1 className="text-5xl font-extrabold mb-6">News, updates & insights</h1>
          <p className="text-xl text-gray-500 max-w-xl mx-auto">Product updates, security deep-dives, and stories from the Filipino fintech community.</p>
        </div>
      </section>

      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Featured post */}
        <div className="bg-gradient-to-br from-[#038E80]/5 to-blue-50/30 border border-gray-100 rounded-3xl p-8 sm:p-10 mb-12 hover:shadow-lg transition-all">
          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${featured.color}`}>{featured.category}</span>
          <h2 className="text-3xl font-extrabold mb-4 max-w-2xl">{featured.title}</h2>
          <p className="text-gray-500 leading-relaxed mb-6 max-w-2xl">{featured.excerpt}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <Clock size={13} /> {featured.readTime}
            </div>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-400">{featured.date}</span>
            <Link href="#" className="ml-auto inline-flex items-center gap-1.5 text-[#038E80] font-semibold text-sm hover:gap-2.5 transition-all">
              Read more <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Post grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map(({ category, title, excerpt, date, readTime, color }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${color}`}>{category}</span>
              <h3 className="font-bold text-lg mb-3 leading-snug">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-3">{excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Clock size={11} /> {readTime}</span>
                  <span>·</span>
                  <span>{date}</span>
                </div>
                <Link href="#" className="text-[#038E80] text-sm font-semibold hover:underline">Read →</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
