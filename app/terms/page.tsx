// app/terms/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Terms of Service — AI Vault",
  description: "Terms and conditions governing the use of AI Vault intelligence directory.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-20">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>
          <Link href="/" className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition">
            ← Directory
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700">
          <div>
            <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Terms of Service</h1>
            <p className="text-[11px] text-slate-400 mt-1">Last Updated: August 2026</p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing and using AI Vault (aivault.pp.ua), you agree to comply with and be bound by these Terms of Service. If you do not agree, please discontinue using the platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">2. Directory Information & Disclaimers</h2>
            <p>
              AI Vault indexes third-party software products for discovery and comparison purposes. Pricing models, capability tiers, and promotional details are subject to change by respective tool owners at any time without notice.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">3. Outbound Links & External Sites</h2>
            <p>
              Our platform contains links to external websites. We do not control, endorse, or accept liability for third-party software performance, security practices, or content.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">4. Intellectual Property</h2>
            <p>
              Third-party logos, company trademarks, and product names belong to their respective copyright holders. AI Vault's scoring framework and custom software matrix are protected under copyright laws.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
