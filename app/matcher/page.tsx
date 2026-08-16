// app/matcher/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

interface MatchedTool {
  id?: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  category?: string;
  pricing_type?: string;
  fit_score: number;
  reason: string;
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
    const q = queryText || prompt;
    if (!q.trim()) return;

    setLoading(true);
    setResults(null);

    try {
      const res = await fetch("/api/matcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q, pricing }),
      });

      const data = await res.json();
      if (data.matches) {
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
    <main className="min-h-screen bg-[#06080F] text-white selection:bg-emerald-500 selection:text-black">
      {/* Header Bar */}
      <header className="border-b border-gray-800 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-white">
              AI <span className="text-emerald-400">Vault.</span>
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/" className="text-gray-400 hover:text-white transition">Directory</Link>
            <Link href="/compare" className="text-gray-400 hover:text-white transition">Compare</Link>
            <Link href="/vault" className="text-gray-400 hover:text-white transition">My Stack</Link>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-12">
        {/* Title Badge */}
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest">
            ⚡ AI Intelligence Engine
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Find the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Exact AI Tool</span> for Your Workflow
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
            Describe your project, use case, or requirements in plain English. Our neural matching engine will find and score the best software from 750+ verified tools.
          </p>
        </div>

        {/* Input Box */}
        <div className="bg-[#0D1322] border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 focus-within:border-emerald-500/50 transition">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. I need an AI to automate YouTube video subtitles and translate them to Hindi and Spanish for free..."
            rows={3}
            className="w-full bg-transparent text-white placeholder-gray-500 text-base focus:outline-none resize-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-800/80">
            {/* Pricing Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">PRICING:</span>
              {(["All", "Free", "Freemium", "Paid"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPricing(p)}
                  className={`text-xs px-3 py-1 rounded-lg font-semibold transition ${
                    pricing === p
                      ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                      : "bg-gray-800/60 text-gray-400 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Submit Button */}
            <button
              onClick={() => handleSearch()}
              disabled={loading || !prompt.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Matching Tools...
                </>
              ) : (
                <>⚡ Match Tools</>
              )}
            </button>
          </div>
        </div>

        {/* Preset Prompt Badges */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-500 mr-1">TRY ASKING:</span>
          {PRESET_PROMPTS.map((sample, i) => (
            <button
              key={i}
              onClick={() => {
                setPrompt(sample);
                handleSearch(sample);
              }}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-gray-300 hover:border-emerald-500/50 hover:text-emerald-400 transition"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Results Stream */}
        <div className="mt-12 space-y-6">
          {results && results.length > 0 && (
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                🎯 Top Matched AI Tools ({results.length})
              </h2>
              <span className="text-xs text-emerald-400 font-semibold">Ranked by Workflow Fit</span>
            </div>
          )}

          {results && results.length === 0 && (
            <div className="text-center py-16 bg-[#0D1322] border border-gray-800 rounded-2xl space-y-2">
              <p className="text-lg font-bold text-white">No exact match found</p>
              <p className="text-sm text-gray-400">Try broadening your prompt or changing pricing filters.</p>
            </div>
          )}

          {results && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((tool) => (
                <div
                  key={tool.slug}
                  className="bg-[#0B0F19] border border-gray-800 hover:border-emerald-500/50 rounded-2xl p-5 flex flex-col justify-between transition group shadow-xl"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-lg text-white group-hover:text-emerald-400 transition">
                            {tool.name}
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 font-semibold uppercase">
                            {tool.pricing_type || "Freemium"}
                          </span>
                        </div>
                        <span className="text-xs text-emerald-400/90 font-medium capitalize">
                          {tool.category || "AI Tool"}
                        </span>
                      </div>

                      {/* Fit Score Badge */}
                      <div className="text-right">
                        <div className="text-xl font-black text-emerald-400">{tool.fit_score}%</div>
                        <div className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Fit Score</div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                      {tool.tagline || tool.description}
                    </p>

                    {/* AI Workflow Reason */}
                    <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-300/90 leading-snug">
                      <span className="font-bold text-emerald-400">Why it fits: </span>
                      {tool.reason}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-4 border-t border-gray-800/80 flex items-center justify-between gap-3">
                    <Link
                      href={`/tool/${tool.slug}`}
                      className="text-xs font-bold text-gray-300 hover:text-white transition"
                    >
                      View Specs →
                    </Link>
                    <a
                      href={`/go/${tool.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition"
                    >
                      Open Tool ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
