"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import ToolLogo from "@/components/ToolLogo";

const CATEGORIES = [
  "Productivity",
  "Coding",
  "Chatbot",
  "Marketing",
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

const TIERS = [
  {
    id: "standard",
    name: "Standard Queue",
    price: "$0",
    badge: "Free",
    turnaround: "7–14 Days Review",
    perks: [
      "Standard Directory Indexation",
      "Permanent Dossier & Backlink",
      "Side-by-Side Comparison Inclusion",
    ],
  },
  {
    id: "featured",
    name: "⚡ Fast-Track Featured",
    price: "$29",
    badge: "Popular 🔥",
    turnaround: "24-Hour Express Publish",
    perks: [
      "Guaranteed 24-Hour Review & Publish",
      "Homepage Top Featured Carousel (30 Days)",
      "Verified Blue Partner Glow Badge",
      "Priority Placement in AI Matcher Quiz",
    ],
  },
  {
    id: "spotlight",
    name: "👑 Category Takeover",
    price: "$79",
    badge: "Maximum ROI",
    turnaround: "Instant 12h Priority",
    perks: [
      "All Fast-Track Featured Benefits",
      "#1 Sticky Podium in Primary Category Hub",
      "Dofollow Editorial SEO Anchor Link",
      "Email Blast Feature to 1,200+ Subscribers",
    ],
  },
];

export default function SubmitToolPage() {
  const [selectedTier, setSelectedTier] = useState("featured");

  // Form Fields
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [category, setCategory] = useState("Productivity");
  const [pricing, setPricing] = useState("Freemium");
  const [founderEmail, setFounderEmail] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const activeTierObj = useMemo(() => {
    return TIERS.find((t) => t.id === selectedTier) || TIERS[0];
  }, [selectedTier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !website.trim() || !description.trim()) {
      setStatus("error");
      setFeedbackMsg("Please fill out all required fields marked with *.");
      return;
    }

    try {
      setStatus("loading");
      setFeedbackMsg("");

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          website_url: website.trim(),
          website: website.trim(),
          logo_url: logoUrl.trim() || null,
          category,
          pricing,
          founder_email: founderEmail.trim() || null,
          description: description.trim(),
          overview: description.trim(),
          tier: selectedTier,
          is_featured: selectedTier !== "standard",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Submission failed. Please check inputs.");
      }

      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setFeedbackMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setName("");
    setWebsite("");
    setLogoUrl("");
    setTagline("");
    setDescription("");
    setFounderEmail("");
    setSelectedTier("featured");
  };

  return (
    <main className="min-h-screen bg-[#FAFBFD] text-slate-900 pb-28 font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-950">
            <img src="/logo.png" alt="AI Vault" className="h-7 w-7 object-contain" />
            <span>AI Vault<span className="text-blue-600">.</span></span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/ai-finder"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
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

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* TITLE */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200/60 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600 mb-3">
            <span>⚡ Founder Direct Placement</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Submit & Boost Your AI Product
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            Get discovered by 25,000+ monthly active founders, software engineers, and growth teams evaluating AI workflow automation.
          </p>
        </div>

        {status === "success" ? (
          /* SUCCESS CONFIRMATION STATE */
          <div className="max-w-2xl mx-auto rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm text-center space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl font-black shadow-inner">
              ✓
            </div>
            <h2 className="text-2xl font-black text-slate-950">
              Tool Placed in Review Queue!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you for submitting <strong className="text-slate-950 font-black">{name}</strong>. Our editorial team will review technical compliance and index your software into AI Vault.
            </p>

            <div className="inline-block rounded-2xl bg-blue-50 border border-blue-200/60 px-5 py-3 text-xs font-bold text-blue-800 text-left space-y-1">
              <p>🎯 <strong>Selected Tier:</strong> {activeTierObj.name} ({activeTierObj.price})</p>
              <p>⏱️ <strong>Estimated Verification:</strong> {activeTierObj.turnaround}</p>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleReset}
                className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
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
          /* MAIN SUBMISSION GRID */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: FORM & TIER SELECTION (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              {/* TIER SELECTION CARDS */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3">
                  1. Select Placement Tier
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TIERS.map((t) => {
                    const isSelected = selectedTier === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTier(t.id)}
                        className={`cursor-pointer rounded-2xl p-4 transition-all duration-150 flex flex-col justify-between ${
                          isSelected
                            ? "border-2 border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/10 shadow-sm"
                            : "border border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              {t.name.split(" ")[0]}
                            </span>
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-black uppercase text-amber-800">
                              {t.badge}
                            </span>
                          </div>
                          <div className="text-xl font-black text-slate-950 mt-1">
                            {t.price}
                          </div>
                          <p className="text-[10px] text-blue-600 font-bold mt-1">
                            {t.turnaround}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* INPUT FORM CONTAINER */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                  <h2 className="text-sm font-black text-slate-950">
                    2. Tool Metadata & Specifications
                  </h2>
                  <span className="text-[10px] font-bold text-slate-400">Required fields marked with *</span>
                </div>

                {status === "error" && (
                  <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700 leading-relaxed">
                    {feedbackMsg}
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Logo Image URL (Optional — Auto-detected from domain if empty)
                    </label>
                    <input
                      type="url"
                      placeholder="https://yourproduct.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
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
                      Short Tagline (One Sentence)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Autonomous AI engineer that builds and deploys full-stack web apps."
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Founder / Submitter Email
                    </label>
                    <input
                      type="email"
                      placeholder="founder@company.com"
                      value={founderEmail}
                      onChange={(e) => setFounderEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Product Description & Core Capabilities <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Explain the problem your tool solves, target audience, API support, and workflow advantages..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full rounded-xl bg-blue-600 py-3.5 text-xs font-black text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition disabled:opacity-50 mt-2"
                  >
                    {status === "loading"
                      ? "Submitting to Editorial Queue..."
                      : `Submit to ${activeTierObj.name} (${activeTierObj.price}) 🚀`}
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT COLUMN: LIVE CARD PREVIEW (5 COLS) */}
            <div className="lg:col-span-5 sticky top-20 space-y-6">
              <div>
                <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3">
                  Live Catalog Card Preview
                </span>

                {/* REAL-TIME CARD PREVIEW */}
                <div className="rounded-3xl border-2 border-dashed border-blue-300/80 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                      Previewing #{name ? name : "Your Product"}
                    </span>
                    {selectedTier !== "standard" && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[9px] font-black text-amber-800 uppercase">
                        ⚡ Featured
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-3.5 mb-4">
                    <ToolLogo
                      name={name || "AI Product"}
                      src={logoUrl || null}
                      website={website || null}
                      size="md"
                    />
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-slate-950 truncate">
                        {name || "Your AI Product Name"}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 capitalize">
                          {category}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] font-bold text-emerald-600">
                          {pricing}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {tagline || description || "Your tool description and capabilities will appear here live across search results, category pages, and comparison tables."}
                  </p>

                  <div className="border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                      <span className="text-slate-400 uppercase tracking-wider">AI Vault Score</span>
                      <span className="text-blue-600 font-black">{selectedTier !== "standard" ? "96/100" : "92/100"}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 mb-4">
                      <div className="h-full bg-blue-600 rounded-full w-[94%]" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex-1 rounded-xl bg-blue-600 py-2 text-center text-xs font-black text-white shadow-sm opacity-90">
                        Visit Portal ↗
                      </span>
                      <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                        Dossier →
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TIER PERKS SUMMARY BOX */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3">
                  Included in {activeTierObj.name}
                </h3>
                <ul className="space-y-2 text-xs text-slate-600">
                  {activeTierObj.perks.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
