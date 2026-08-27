"use client";

import React, { useState } from "react";
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

const PRICING_MODELS = [
  "Freemium",
  "Free",
  "Free Trial",
  "Paid",
  "Enterprise",
];

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
      setErrorMsg("Please fill all required fields (Tool Name, Website URL, Description).");
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
          website: website.trim(),
          logo_url: logoUrl.trim() || null,
          category,
          pricing,
          pricing_model: pricing,
          founder_email: founderEmail.trim() || null,
          submitter_email: founderEmail.trim() || null,
          description: description.trim(),
          overview: description.trim(),
          is_featured: tier === "featured",
          tier,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Submission failed. Please try again.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error submitting tool");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setName("");
    setWebsite("");
    setLogoUrl("");
    setDescription("");
    setFounderEmail("");
    setErrorMsg("");
    setTier("standard");
  };

  return (
    <main className="min-h-screen bg-[#FAFBFD] text-slate-900 pb-24 font-sans">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-950">
            <img src="/logo.png" alt="AI Vault" className="h-7 w-7 object-contain" />
            <span>AI Vault<span className="text-blue-600">.</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/ai-finder"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition"
            >
              ⚡ Matcher
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
            >
              ← Back to Directory
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* TITLE */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">
            ✦ Founder Direct Placement
          </span>
          <h1 className="text-3xl font-black text-slate-950 sm:text-5xl tracking-tight">
            Submit Your AI Tool
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Get your AI product discovered by thousands of active founders, operators, and developers looking for workflow automation.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm text-center space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl font-black">
              ✓
            </div>
            <h2 className="text-2xl font-black text-slate-950">
              Tool Placed in Review Queue!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you for submitting <strong className="text-slate-950">{name}</strong>. Our editorial team will review technical compliance and verify your tool before publishing it live to the catalog.
            </p>

            {tier === "featured" && (
              <div className="inline-block rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2 text-xs font-bold text-amber-800">
                ⚡ Priority Fast-Track Enabled — Verification expedited within 24 hours.
              </div>
            )}

            <div className="pt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={handleReset}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                Submit Another Tool
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
          <div className="space-y-6">
            {/* LISTING TIER SELECTION */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5 block">
                Select Listing Tier
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Standard */}
                <div
                  onClick={() => setTier("standard")}
                  className={`cursor-pointer rounded-3xl p-5 transition ${
                    tier === "standard"
                      ? "border-2 border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-sm"
                      : "border border-slate-200 bg-white/60 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-950">Standard Listing</span>
                    <span className="text-xs font-bold text-slate-500">$0 Free</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-600">
                    <li>✓ Standard Catalog Indexation</li>
                    <li>✓ Permanent Dossier Page</li>
                    <li>✓ Basic Comparison Engine</li>
                  </ul>
                </div>

                {/* Featured */}
                <div
                  onClick={() => setTier("featured")}
                  className={`cursor-pointer rounded-3xl p-5 transition ${
                    tier === "featured"
                      ? "border-2 border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-sm"
                      : "border border-slate-200 bg-white/60 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-950">Featured Boost</span>
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-700 uppercase">
                        Popular
                      </span>
                    </div>
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black text-white uppercase">
                      Priority Queue
                    </span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-700 font-bold">
                    <li>⚡ Top Search & Category Rank</li>
                    <li>⚡ Verified Partner Glow Badge</li>
                    <li>⚡ Instant 24h Review Fast-Track</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* FORM CONTAINER */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              {errorMsg && (
                <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-700 leading-relaxed">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Tool Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DocuSynth AI"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Official Website URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://yourproduct.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Logo Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourproduct.com/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Primary Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Pricing Model <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={pricing}
                      onChange={(e) => setPricing(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition"
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
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Founder Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="founder@company.com"
                    value={founderEmail}
                    onChange={(e) => setFounderEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Product Description & Capabilities <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Explain the problem your tool solves, target audience, and key operational advantages..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white resize-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 py-3.5 text-xs font-black text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  {loading ? "Submitting to Editorial Queue..." : "Submit Tool to Editorial Queue 🚀"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
