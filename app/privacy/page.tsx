import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Privacy Policy | AI Vault",
  description: "Privacy policy and data governance statement for AI Vault.",
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
  openGraph: {
    title: "Privacy Policy | AI Vault",
    description: "Privacy policy and data governance statement for AI Vault.",
    url: `${SITE_URL}/privacy`,
    siteName: "AI Vault",
    type: "website",
  },
};

export default function PrivacyPolicy() {
  return (
    <div className="bg-white min-h-screen selection:bg-blue-100 selection:text-blue-900 text-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-24">
        {/* Header */}
        <header className="mb-20">
          <h1 className="text-6xl md:text-8xl font-black font-serif tracking-tight text-slate-950">
            Privacy<span className="text-blue-600">.</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-4">
            Last Updated: August 2026 • AI Vault Infrastructure
          </p>
        </header>

        {/* Content Section */}
        <div className="prose prose-lg max-w-none text-slate-700 space-y-12">
          <section>
            <h2 className="text-3xl font-black text-slate-950 font-serif mb-4">
              1. Information We Collect
            </h2>
            <p className="leading-relaxed">
              Welcome to <strong>AI Vault</strong> (accessible at{" "}
              <a href={SITE_URL} className="text-blue-600 underline font-semibold">
                {SITE_URL}
              </a>
              ). Your privacy is critically important to us. We collect minimal operational data required to deliver verified AI directory services.
            </p>
          </section>

          <section className="border-l-4 border-blue-600 pl-6 py-2 bg-blue-50/50 rounded-r-2xl space-y-3">
            <h2 className="text-3xl font-black text-slate-950 font-serif">
              2. Data Usage & Log Protocol
            </h2>
            <p className="leading-relaxed">
              We do not require users to create accounts to browse our primary directory.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>
                <strong>Log Data:</strong> IP addresses, browser types, and access timestamps are collected for security and analytics.
              </li>
              <li>
                <strong>Cookies:</strong> Used to store session preferences and optimize navigation caching.
              </li>
              <li>
                <strong>Search Queries:</strong> Processed in-memory to filter directory results without personal profiling.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-black text-slate-950 font-serif">
              3. Google AdSense & Third-Party Advertising
            </h2>
            <p className="leading-relaxed">
              AI Vault uses Google AdSense and third-party advertising networks to serve relevant contextual ads.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Google uses cookies to serve ads based on prior visits. Users may opt out of personalized advertising by visiting Google Ad Settings or AboutAds.info.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-3xl font-black text-slate-950 font-serif">
              4. External Outbound Links
            </h2>
            <p className="leading-relaxed">
              Our directory contains direct links to external third-party official websites. AI Vault is not responsible for the privacy practices or content of external destinations.
            </p>
          </section>

          <section className="bg-gray-50 p-8 rounded-3xl border border-slate-100 space-y-4">
            <h2 className="text-3xl font-black text-slate-950 font-serif">
              5. Contact Support & Governance
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              If you have questions about this privacy policy or data compliance, contact our team:
            </p>
            <div className="font-bold text-slate-900 text-sm space-y-1">
              <p>
                Email:{" "}
                <a
                  href="mailto:support@aivault.pp.ua"
                  className="text-blue-600 hover:underline"
                >
                  support@aivault.pp.ua
                </a>
              </p>
              <p>Location: Brahmapur, Odisha, India</p>
            </div>
          </section>
        </div>

        {/* Back Link Footer */}
        <footer className="mt-20 pt-10 border-t border-slate-100">
          <Link
            href="/"
            className="text-sm font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Return to Vault
          </Link>
        </footer>
      </div>
    </div>
  );
}
