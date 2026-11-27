import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="bg-[#17202A] text-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/icons/icon-192.png" alt="CashIn Tap" className="w-12 h-12" />
            </div>
            <p className="text-sm leading-relaxed">Your trusted digital wallet for e-load, cash out, and more.</p>
          </div>
          {[
            { title: "Product", links: [{ label: "Features", href: "/features" }, { label: "Security", href: "/security" }] },
            { title: "Company", links: [{ label: "About", href: "/about" }, { label: "Blog", href: "/blog" }, { label: "Careers", href: "/careers" }] },
            { title: "Support", links: [{ label: "Help Center", href: "/help-center" }, { label: "Contact", href: "/contact" }, { label: "Privacy Policy", href: "/privacy-policy" }] },
          ].map(({ title, links }) => (
            <div key={title}>
              <p className="text-white font-semibold mb-4 text-sm">{title}</p>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm hover:text-white transition-colors">{label}</Link>
                  </li>
                ))}
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
  );
}
