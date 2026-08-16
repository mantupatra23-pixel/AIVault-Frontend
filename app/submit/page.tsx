// app/submit/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORIES = [
  "Productivity",
  "Marketing",
  "Coding",
  "Chatbot",
  "Image",
  "Writing",
  "Audio",
  "Video",
];

export default function SubmitToolPage() {
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [category, setCategory] = useState("Productivity");
  const [pricing, setPricing] = useState("Freemium");
  const [description, setDescription] = useState("");
  const [founderEmail, setFounderEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"free" | "featured">("free");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          website_url: websiteUrl,
          logo_url: logoUrl,
          category,
          pricing,
          description,
          founder_email: founderEmail,
          plan: selectedPlan,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to submit tool.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            ← Back to Directory
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">
            Founder Direct Placement
          </div>
          <h1 className="text-3xl font-black text-slate-950 sm:text-4xl tracking-tight">
            Submit Your AI Tool
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-xs sm:text-sm text-slate-500 leading-relaxed">
            Get your AI product discovered by thousands of active founders, operators, and developers looking for workflow automation.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-8 text-center sm:p-12 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl font-black text-white shadow-md shadow-emerald-600/30">
              ✓
            </div>
            <h2 className="mt-4 text-2xl font-black text-slate-950">
              Tool Submitted Successfully!
            </h2>
            <p className="mt-2 text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              {selectedPlan === "featured"
                ? "Your product has been granted priority fast-track placement. Our editorial desk will verify it within 12-24 hours."
                : "Your tool is now queued in our catalog moderation pipeline for review."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/"
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-black transition shadow-md"
              >
                View Live Directory →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-600">
                {errorMsg}
              </div>
            )}

            {/* Plan Selector */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">
                Select Listing Tier
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div
                  onClick={() => setSelectedPlan("free")}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    selectedPlan === "free"
                      ? "border-blue-600 bg-blue-50/40 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-950">Standard Listing</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      $0 Free
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-[11px] text-slate-500 font-medium">
                    <li>✓ Standard Catalog Indexation</li>
                    <li>✓ Permanent Dossier Page</li>
                    <li>✓ Basic Comparison Engine</li>
                  </ul>
                </div>

                <div
                  onClick={() => setSelectedPlan("featured")}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    selectedPlan === "featured"
                      ? "border-blue-600 bg-blue-50/40 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-slate-950">Featured Boost</span>
                      <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[9px] font-black uppercase">
                        ⚡ Popular
                      </span>
                    </div>
                    <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white">
                      Priority Queue
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-[11px] text-slate-500 font-medium">
                    <li>✓ Top Search & Category Rank</li>
                    <li>✓ Verified Catalog Entry Badge</li>
                    <li>✓ Instant 24h Queue Fast-Track</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">
                    Tool Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DocuSynth AI"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">
                    Official Website URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://yourproduct.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Logo URL Input & Live Preview */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Logo Image URL (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    placeholder="https://yourproduct.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                  {logoUrl && (
                    <div className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoUrl}
                        alt="Logo preview"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">
                    Primary Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">
                    Pricing Model *
                  </label>
                  <select
                    value={pricing}
                    onChange={(e) => setPricing(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="Free">Free</option>
                    <option value="Freemium">Freemium</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Founder Contact Email
                </label>
                <input
                  type="email"
                  placeholder="founder@company.com"
                  value={founderEmail}
                  onChange={(e) => setFounderEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Product Description & Capabilities *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain the problem your tool solves, target audience, and key operational advantages..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-blue-600 py-3.5 text-xs font-black text-white hover:bg-blue-700 transition shadow-md shadow-blue-500/25 disabled:opacity-50"
              >
                {submitting ? "Publishing Tool..." : "Submit Tool to Editorial Queue 🚀"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
