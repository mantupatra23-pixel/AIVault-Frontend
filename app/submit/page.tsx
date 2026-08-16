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

const PRICING_MODELS = ["Free", "Freemium", "Paid"];

export default function SubmitPage() {
  const [tier, setTier] = useState<"standard" | "featured">("standard");
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [category, setCategory] = useState("Productivity");
  const [pricing, setPricing] = useState("Freemium");
  const [founderEmail, setFounderEmail] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !website.trim() || !description.trim()) {
      setErrorMsg("Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          website_url: website.trim(),
          logo_url: logoUrl.trim() || null,
          category,
          pricing,
          submitter_email: founderEmail.trim() || null,
          description: description.trim(),
          is_featured: tier === "featured",
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Submission failed");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error submitting tool");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="AI Vault"
              className="h-8 w-8 rounded-xl object-contain drop-shadow-sm transition-transform group-hover:scale-105"
            />
            <span className="text-lg font-black tracking-tight text-slate-950">
              AI Vault<span className="text-blue-600">.</span>
            </span>
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
        {/* Title Header */}
        <div className="text-center mb-10">
          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">
            ⚡ Founder Direct Placement
          </span>
          <h1 className="text-3xl font-black text-slate-950 sm:text-4xl tracking-tight">
            Submit Your AI Tool
          </h1>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-500">
            Get your AI product discovered by thousands of active founders, operators, and developers looking for workflow automation.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl font-black">
              ✓
            </div>
            <h2 className="text-2xl font-black text-slate-950">
              Tool Submitted to Editorial Queue!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Thank you for submitting <strong className="text-slate-900">{name}</strong>. Our editorial engineering team will review technical compliance and index your software live into AI Vault.
            </p>
            {tier === "featured" && (
              <div className="inline-block rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2 text-xs font-bold text-amber-800">
                ⚡ Priority Fast-Track Enabled — Verification within 24 hours.
              </div>
            )}
            <div className="pt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setName("");
                  setWebsite("");
                  setLogoUrl("");
                  setDescription("");
                  setFounderEmail("");
                }}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                Submit Another Product
              </button>
              <Link
                href="/"
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-black text-white hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
              >
                Explore Directory →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Listing Tier Selection */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5 block">
                Select Listing Tier
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Standard */}
                <div
                  onClick={() => setTier("standard")}
                  className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 ${
                    tier === "standard"
                      ? "border-2 border-blue-600 bg-blue-50/40 shadow-sm"
                      : "border border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900">Standard Listing</span>
                    <span className="text-xs font-black text-slate-500">$0 Free</span>
                  </div>
                  <ul className="mt-3 space-y-1 text-[11px] text-slate-600 font-medium">
                    <li>✓ Standard Catalog Indexation</li>
                    <li>✓ Permanent Dossier Page</li>
                    <li>✓ Basic Comparison Engine</li>
                  </ul>
                </div>

                {/* Featured */}
                <div
                  onClick={() => setTier("featured")}
                  className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 relative overflow-hidden ${
                    tier === "featured"
                      ? "border-2 border-blue-600 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-md shadow-blue-500/10"
                      : "border border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-slate-900">Featured Boost</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-700 uppercase">
                        Popular
                      </span>
                    </div>
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black text-white uppercase">
                      Priority Queue
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1 text-[11px] text-slate-700 font-bold">
                    <li>⚡ Top Search & Category Rank</li>
                    <li>⚡ Verified Partner Glow Badge</li>
                    <li>⚡ Instant 24h Review Fast-Track</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Input Form Fields */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4 text-xs">
              {errorMsg && (
                <div className="rounded-xl bg-red-50 p-3 text-red-600 font-bold text-[11px]">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">
                    Tool Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DocuSynth AI"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">
                    Official Website URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://yourproduct.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">
                  Logo Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://yourproduct.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">
                    Primary Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">
                    Pricing Model *
                  </label>
                  <select
                    value={pricing}
                    onChange={(e) => setPricing(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {PRICING_MODELS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">
                  Founder Contact Email
                </label>
                <input
                  type="email"
                  placeholder="founder@company.com"
                  value={founderEmail}
                  onChange={(e) => setFounderEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">
                  Product Description & Capabilities *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain the problem your tool solves, target audience, and key operational advantages..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white resize-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3.5 text-xs font-black text-white hover:bg-blue-700 transition shadow-md shadow-blue-500/25 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Tool to Editorial Queue 🚀"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
