// app/privacy/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — AI Vault",
  description: "AI Vault privacy policy and cookie disclosure compliant with Google AdSense and global standards.",
};

export default function PrivacyPage() {
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
            <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Privacy Policy</h1>
            <p className="text-[11px] text-slate-400 mt-1">Last Updated: August 2026</p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">1. Information We Collect</h2>
            <p>
              When you browse AI Vault (aivault.pp.ua), we may automatically collect standard diagnostic metrics such as IP address, browser type, referring URLs, and page visit durations to improve platform speed and usability.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">2. Cookies and Advertising Partners (Google AdSense)</h2>
            <p>
              Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to our website or other websites on the internet.
            </p>
            <p>
              Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to AI Vault and/or other sites on the Internet. Users may opt out of personalized advertising by visiting Google Ads Settings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">3. Email Submissions</h2>
            <p>
              When you submit an AI tool or subscribe to deal alerts, we collect your contact email solely to process listing updates, editorial status changes, or requested newsletter notifications. We never sell or distribute your personal data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">4. Contact Rights (GDPR & CCPA)</h2>
            <p>
              You have the right to request access to, update, or permanently delete any contact information provided to AI Vault by submitting a request via our Contact Portal.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
