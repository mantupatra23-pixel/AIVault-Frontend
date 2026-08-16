// app/about/page.tsx
import Link from "next/link";

export const metadata = {
  title: "About AI Vault — AI Intelligence Engine & Directory",
  description: "Learn how AI Vault analyzes, scores, and indexes cutting-edge artificial intelligence software.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-20">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>
          <Link href="/" className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition">
            ← Back to Directory
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-8">
        <div className="text-center mb-12">
          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">
            Editorial Mission & Methodology
          </span>
          <h1 className="text-3xl font-black text-slate-950 sm:text-5xl tracking-tight">
            About AI Vault
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-xs sm:text-sm text-slate-500 leading-relaxed">
            The premier intelligence directory and decision engine for modern AI tools, enterprise software, and automated workflows.
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-slate-700">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-black text-slate-950 mb-3">Our Mission</h2>
            <p>
              With thousands of generative artificial intelligence platforms launching every month, choosing the right software stack has become overwhelming for founders, engineers, and creators. AI Vault was built to bring clarity, transparency, and data-backed evaluations to the AI ecosystem.
            </p>
            <p className="mt-3">
              We independently index, verify, and benchmark AI tools across 8 key verticals—including Productivity, Coding, Marketing, Chatbots, Image Generation, Writing, Audio, and Video.
            </p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-black text-slate-950 mb-4">How The AI Vault Score (0-100) Works</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-bold text-slate-950">1. Operational Throughput & Reliability</p>
                <p className="mt-1 text-[11px] text-slate-500">We evaluate uptime, model response latency, output consistency, and API availability under scale.</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-bold text-slate-950">2. Pricing Transparency</p>
                <p className="mt-1 text-[11px] text-slate-500">Auditing true freemium value vs hidden usage paywalls and enterprise licensing terms.</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-bold text-slate-950">3. Integration Ecosystem</p>
                <p className="mt-1 text-[11px] text-slate-500">Evaluating compatibility with webhooks, Zapier, browser extensions, and developer APIs.</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-bold text-slate-950">4. Community Sentiment</p>
                <p className="mt-1 text-[11px] text-slate-500">Real feedback aggregated from engineering discussions, product launches, and verified reviews.</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-black text-slate-950 mb-3">Editorial Independence & Affiliate Disclosure</h2>
            <p>
              AI Vault maintains strict editorial standards. Some outbound links on our platform may be affiliate referral links, which means we may receive a commission at no additional cost to you if you purchase a subscription. Our ratings and AI Vault Scores are never influenced by affiliate partnerships.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
