// app/matcher/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import ToolLogo from "@/components/ToolLogo";

interface MatchedTool {
  id?: string | number;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  overview?: string;
  category?: string;
  pricing?: string;
  pricing_type?: string;
  fit_score: number;
  reason: string;
  logo_url?: string;
  logo?: string;
}

const PRESET_PROMPTS = [
  "⚡ Best free AI tool for coding & Next.js debugging",
  "🎨 AI generator for marketing banners & social media",
  "✍️ High-quality long form blog writer with SEO",
  "🎙️ Realistic voice clone & audio synthesis",
  "🤖 Customer support chatbot for web app",
];

export default function MatcherPage() {
  const [prompt, setPrompt] = useState("");
  const [pricing, setPricing] = useState("All");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchedTool[] | null>(null);

  const handleSearch = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : prompt).trim();
    if (!q) return;

    setLoading(true);
    setResults(null);

    try {
      const res = await fetch("/api/matcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q, pricing }),
      });

      const data = await res.json();
      if (data.matches && Array.isArray(data.matches)) {
        setResults(data.matches);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-24">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition"
            >
              ← Directory
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition"
            >
              <span>⚖️ Compare</span>
            </Link>
            <Link
              href="/vault"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition"
            >
              <span>★ Vault</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="bg-[#050714] px-4 py-14 text-center text-white sm:py-18 sm:px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-300 mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Neural Matcher Engine
        </div>

        <h1 className="mx-auto max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">
          Find the <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">Exact AI Tool</span> for Your Work.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-xs sm:text-sm text-slate-400 leading-relaxed">
          Describe your task, workflow, or budget in plain words. Our engine searches across 750+ verified tools to find the perfect software.
        </p>
      </section>

      <div className="mx-auto max-w-4xl px-4 -mt-7 sm:px-6">
        {/* Search Box Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xl space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. I need a free AI tool to create realistic thumbnails and edit YouTube video audio..."
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white transition resize-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {/* Pricing Filters */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Pricing:</span>
              {(["All", "Free", "Freemium", "Paid"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPricing(p)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    pricing === p
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Match Button */}
            <button
              onClick={() => handleSearch()}
              disabled={loading || !prompt.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Matching Tools...
                </>
              ) : (
                <>⚡ Match Tools</>
              )}
            </button>
          </div>
        </div>

        {/* Try Asking Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">TRY ASKING:</span>
          {PRESET_PROMPTS.map((sample, i) => (
            <button
              key={i}
              onClick={() => {
                setPrompt(sample);
                handleSearch(sample);
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition shadow-sm"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Results Section */}
        <div className="mt-10 space-y-4">
          {results && results.length > 0 && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                🎯 Top Matched Software ({results.length})
              </h2>
              <span className="text-xs font-bold text-blue-600">Ranked by Workflow Fit</span>
            </div>
          )}

          {results && results.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-sm font-bold text-slate-800">No matching AI software found.</p>
              <p className="text-xs text-slate-500 mt-1">Try rewording your prompt or selecting 'All' pricing.</p>
            </div>
          )}

          {results && (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((tool) => {
                const name = String(tool.name || "AI Tool");
                const slug = String(tool.slug || "").trim();
                const category = String(tool.category || "AI Software");
                const pricingTier = String(tool.pricing_type || tool.pricing || "Freemium");
                const desc = String(tool.tagline || tool.description || tool.overview || "");
                const logo = (tool.logo_url || tool.logo) as string | undefined;

                return (
                  <div
                    key={slug}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <ToolLogo src={logo} name={name} size="md" />
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-black text-slate-950 group-hover:text-blue-600 transition-colors">
                              {name}
                            </h3>
                            <p className="text-[11px] font-medium text-slate-400 capitalize">{category}</p>
                          </div>
                        </div>

                        {/* Fit Score Badge */}
                        <div className="shrink-0 text-right">
                          <div className="text-base font-black text-blue-600">{tool.fit_score}%</div>
                          <div className="text-[8px] font-black uppercase text-slate-400">Fit Score</div>
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600">
                        {desc}
                      </p>

                      {/* Reason Box */}
                      <div className="mt-3 rounded-xl bg-blue-50/70 border border-blue-100 p-2.5 text-[11px] text-blue-900 leading-snug">
                        <span className="font-bold text-blue-700">Why it fits: </span>
                        {tool.reason}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[9px] font-bold text-slate-600 uppercase">
                        {pricingTier}
                      </span>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tool/${encodeURIComponent(slug)}`}
                          className="text-xs font-bold text-slate-600 hover:text-blue-600 px-2 py-1"
                        >
                          Specs →
                        </Link>
                        <a
                          href={`/go/${encodeURIComponent(slug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-blue-700 shadow-sm transition"
                        >
                          Visit ↗
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
