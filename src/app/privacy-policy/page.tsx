import LandingNav from "@/app/landing/nav";
import LandingFooter from "@/app/landing/footer";

const sections = [
  {
    title: "1. Information We Collect",
    content: `We collect information you provide directly to us when you create an account, use our services, or contact support. This includes:

• Personal information: full name, mobile number, email address
• Identity verification: government-issued ID documents (for KYC)
• Financial information: transaction history, wallet balance, cash out destinations
• Device information: device type, operating system, IP address, location (with your permission)
• Usage data: pages visited, features used, timestamps of activity`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Process transactions and send related notifications
• Verify your identity and prevent fraud
• Comply with legal and regulatory requirements
• Send service-related communications (transaction receipts, security alerts)
• Respond to your support requests
• Monitor and analyze usage patterns to improve the platform`,
  },
  {
    title: "3. How We Share Your Information",
    content: `We do not sell your personal information. We may share your information with:

• Payment providers (PayMongo, GCash, Maya) to process transactions
• E-load providers (GBits) to fulfill load purchases
• Firebase for phone number OTP verification
• Law enforcement or regulators when required by law
• Service providers who assist in operating our platform, under strict confidentiality agreements

We require all third parties to maintain the security of your information and to use it only for the purposes we specify.`,
  },
  {
    title: "4. Data Security",
    content: `We implement industry-standard security measures to protect your information:

• All data in transit is encrypted using TLS 1.3
• Passwords and PINs are hashed using bcrypt — never stored in plain text
• Access tokens use short expiry with refresh token rotation
• All admin actions are logged in an immutable audit trail
• Rate limiting and fraud detection are applied to all sensitive endpoints
• Regular security reviews and vulnerability assessments

Despite these measures, no system is 100% secure. We encourage you to use a strong password and enable OTP verification.`,
  },
  {
    title: "5. Data Retention",
    content: `We retain your personal information for as long as your account is active or as needed to provide services. Transaction records are retained for a minimum of 5 years to comply with financial regulations in the Philippines.

You may request deletion of your account and personal data by contacting support. Note that some data may be retained for legal compliance purposes even after account deletion.`,
  },
  {
    title: "6. Your Rights",
    content: `Under the Data Privacy Act of 2012 (Republic Act 10173), you have the right to:

• Access the personal information we hold about you
• Correct inaccurate or incomplete information
• Object to the processing of your personal information
• Request deletion of your personal information (subject to legal retention requirements)
• File a complaint with the National Privacy Commission

To exercise any of these rights, contact us at privacy@cashin-tap.com.`,
  },
  {
    title: "7. Cookies and Tracking",
    content: `We use cookies and similar technologies to maintain your session, remember your preferences, and analyze how our platform is used. You can control cookie settings through your browser, but disabling cookies may affect the functionality of the platform.

We do not use third-party advertising cookies or sell your browsing data to advertisers.`,
  },
  {
    title: "8. Children's Privacy",
    content: `CashIn Tap is not intended for users under the age of 18. We do not knowingly collect personal information from minors. If you believe a minor has created an account, please contact us immediately and we will delete the account.`,
  },
  {
    title: "9. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification at least 7 days before the changes take effect. Your continued use of the platform after the effective date constitutes acceptance of the updated policy.`,
  },
  {
    title: "10. Contact Us",
    content: `If you have questions about this Privacy Policy or how we handle your data, contact us at:

Email: privacy@cashin-tap.com
Address: CashIn Tap, Philippines

For data privacy concerns, you may also contact our Data Protection Officer at dpo@cashin-tap.com.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-[#17202A]">
      <LandingNav />

      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-[#038E80]/5 via-white to-blue-50/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <p className="text-[#038E80] font-semibold text-sm uppercase tracking-wider mb-3">Legal</p>
          <h1 className="text-5xl font-extrabold mb-4">Privacy Policy</h1>
          <p className="text-gray-500">Last updated: January 1, 2026</p>
          <p className="text-gray-600 mt-4 leading-relaxed">
            CashIn Tap (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform, in compliance with the Data Privacy Act of 2012 (Republic Act 10173) of the Philippines.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 pb-20 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="space-y-10">
          {sections.map(({ title, content }) => (
            <div key={title}>
              <h2 className="text-xl font-bold mb-4 text-[#17202A]">{title}</h2>
              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{content}</div>
            </div>
          ))}
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
