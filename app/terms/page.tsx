import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Terms of Service | AI Vault",
  description: "Terms of service and usage conditions for the AI Vault directory.",
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
  openGraph: {
    title: "Terms of Service | AI Vault",
    description: "Terms of service and usage conditions for the AI Vault directory.",
    url: `${SITE_URL}/terms`,
    siteName: "AI Vault",
    type: "website",
  },
};

export default function Terms() {
  return (
    <div className="bg-white min-h-screen selection:bg-blue-100 selection:text-blue-900 text-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-20 font-sans">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tight font-serif text-slate-950">
            Terms of Service<span className="text-blue-600">.</span>
          </h1>
          <p className="mb-6 text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">
            Last Updated: August 2026 • AI Vault Network
          </p>
        </header>

        {/* Terms Content Sections */}
        <section className="space-y-8">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h2 className="text-xl font-bold uppercase text-slate-950 mb-2">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              By accessing and using <strong>AI Vault</strong> (accessible at{" "}
              <a href={SITE_URL} className="text-blue-600 underline font-semibold">
                {SITE_URL}
              </a>
              ), you agree to comply with and be bound by these Terms of Service. If you do not agree, please discontinue use of the site immediately.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h2 className="text-xl font-bold uppercase text-slate-950 mb-2">
              2. Directory & Information Disclaimer
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              AI Vault is an independent artificial intelligence software directory and discovery engine. We curate, verify, and index AI tools for informational purposes. Tool specifications, pricing tiers, and operational features are subject to change by third-party vendors without prior notice.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h2 className="text-xl font-bold uppercase text-slate-950 mb-2">
              3. External Outbound Links
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              Our website contains links to external official software portals. AI Vault does not endorse, guarantee, or assume responsibility for any third-party products, transactions, or content encountered after clicking external outbound links.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h2 className="text-xl font-bold uppercase text-slate-950 mb-2">
              4. Intellectual Property
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              All registered trademarks, company names, logos, and product titles displayed on AI Vault belong to their respective brand owners and rights holders.
            </p>
          </div>

          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
            <h2 className="text-xl font-bold uppercase text-slate-950 mb-2">
              5. Legal Inquiries & Governance
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              For legal inquiries, copyright takedown requests, or directory updates, contact our governance team directly at:
            </p>
            <div className="mt-3 font-bold text-slate-900 text-sm">
              Email:{" "}
              <a
                href="mailto:support@aivault.pp.ua"
                className="text-blue-600 hover:underline"
              >
                support@aivault.pp.ua
              </a>
            </div>
          </div>
        </section>

        {/* Return Footer Link */}
        <footer className="mt-16 pt-8 border-t border-slate-100">
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
