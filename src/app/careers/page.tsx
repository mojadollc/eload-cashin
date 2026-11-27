import Link from "next/link";
import { ArrowRight, MapPin, Clock, Zap, Heart, Users } from "lucide-react";
import LandingNav from "@/app/landing/nav";
import LandingFooter from "@/app/landing/footer";

const openRoles = [
  {
    title: "Senior Full-Stack Engineer",
    team: "Engineering",
    type: "Full-time",
    location: "Remote (Philippines)",
    desc: "Build and scale the core CashIn Tap platform. You'll work across Next.js, PostgreSQL, Redis, and BullMQ to ship features that impact thousands of users.",
  },
  {
    title: "Mobile Engineer (React Native)",
    team: "Engineering",
    type: "Full-time",
    location: "Remote (Philippines)",
    desc: "Own the CashIn Tap mobile app experience. You'll work with Expo, React Native, and our REST API to build fast, reliable mobile features.",
  },
  {
    title: "Product Designer",
    team: "Design",
    type: "Full-time",
    location: "Remote (Philippines)",
    desc: "Design intuitive financial experiences for everyday Filipinos. You'll own end-to-end design from research to high-fidelity prototypes.",
  },
  {
    title: "Customer Support Specialist",
    team: "Support",
    type: "Full-time",
    location: "Remote (Philippines)",
    desc: "Be the first point of contact for our users. Help resolve issues quickly and feed insights back to the product team.",
  },
];

const perks = [
  { icon: Zap, title: "Fully Remote", desc: "Work from anywhere in the Philippines. We care about output, not office hours." },
  { icon: Heart, title: "Health Benefits", desc: "HMO coverage for you and one dependent from day one." },
  { icon: Users, title: "Small, Focused Team", desc: "Work directly with founders and senior engineers. No bureaucracy, high impact." },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white text-[#17202A]">
      <LandingNav />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-[#038E80]/5 via-white to-blue-50/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#038E80] font-semibold text-sm uppercase tracking-wider mb-3">Careers</p>
          <h1 className="text-5xl font-extrabold mb-6">Build the future of Filipino fintech</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            We&apos;re a small, ambitious team building financial infrastructure for millions of Filipinos. If that excites you, we&apos;d love to meet you.
          </p>
        </div>
      </section>

      {/* Perks */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {perks.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
                <div className="w-12 h-12 bg-[#038E80]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-[#038E80]" />
                </div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open roles */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-extrabold mb-10">Open roles</h2>
        <div className="space-y-4">
          {openRoles.map(({ title, team, type, location, desc }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-md hover:border-[#038E80]/30 transition-all group">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs font-semibold bg-[#038E80]/10 text-[#038E80] px-3 py-1 rounded-full">{team}</span>
                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full flex items-center gap-1"><Clock size={10} /> {type}</span>
                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full flex items-center gap-1"><MapPin size={10} /> {location}</span>
                  </div>
                  <h3 className="font-bold text-xl mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
                <Link href="/contact" className="inline-flex items-center gap-2 bg-[#038E80] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#058174] transition-all text-sm shrink-0">
                  Apply <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* No role? */}
      <section className="py-12 bg-gradient-to-br from-[#038E80] to-[#058174]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-3">Don&apos;t see a role that fits?</h2>
          <p className="text-white/70 mb-6">We&apos;re always open to hearing from talented people. Send us your resume and tell us how you&apos;d contribute.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-white text-[#038E80] font-bold px-7 py-3.5 rounded-xl hover:bg-gray-50 transition-all">
            Send an Open Application <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
