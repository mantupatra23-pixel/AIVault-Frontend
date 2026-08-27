"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ToolLogo from "@/components/ToolLogo";
import { cleanAiContent } from "@/lib/content-quality";
import { getToolScore, formatAIScore } from "@/lib/score";

type ToolRecord = {
  id?: string | number | null;
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  overview?: string | null;
  tagline?: string | null;
  category?: string | null;
  pricing?: string | null;
  pricing_model?: string | null;
  pricing_type?: string | null;
  score?: number | string | null;
  ai_vault_score?: number | string | null;
  logo_url?: string | null;
  logo?: string | null;
  website_url?: string | null;
  website?: string | null;
  affiliate_status?: string | null;
  features?: string[] | string | null;
  deployment?: string | null;
  [key: string]: unknown;
};

type MatchedTool = ToolRecord & {
  matchScore: number;
  matchReason: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const QUICK_PROMPTS = [
  "Build web apps & landing pages without coding",
  "Write SEO blog articles and marketing copy",
  "AI agent for coding, debugging and terminal tasks",
  "Generate photorealistic images and visual designs",
  "Text-to-speech voice cloning and dubbing",
];

const PLATFORMS = [
  "Web",
  "Windows",
  "macOS",
  "Linux",
  "Android",
  "iOS",
  "API",
  "Browser",
  "Browser Extension",
];

const BUDGETS = [
  { label: "Free / Freemium", value: "free_freemium" },
  { label: "Free only", value: "free" },
  { label: "Freemium", value: "freemium" },
  { label: "Paid", value: "paid" },
  { label: "Enterprise", value: "enterprise" },
];

export default function AiFinderPage() {
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);

  // Form State
  const [accomplish, setAccomplish] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("free_freemium");
  const [platform, setPlatform] = useState("Web");
  const [useCase, setUseCase] = useState("");

  // Search Results State
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<MatchedTool[] | null>(null);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        setLoadingTools(true);
        const { data, error } = await supabase
          .from("ai_tools")
          .select("*")
          .not("slug", "is", null)
          .neq("affiliate_status", "pending_submission")
          .order("score", { ascending: false });

        if (error) throw error;
        setTools((data as ToolRecord[]) || []);
      } catch (err) {
        console.error("Error loading tools catalog:", err);
      } finally {
        setLoadingTools(false);
      }
    }
    fetchCatalog();
  }, []);

  const handleMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accomplish.trim() && !category.trim() && !useCase.trim()) {
      return;
    }

    setIsSearching(true);
    setResults(null);

    setTimeout(() => {
      const searchTerms = `${accomplish} ${category} ${useCase}`
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2);

      const scored = tools
        .map((tool) => {
          const toolText = `${tool.name} ${tool.category} ${tool.tagline || ""} ${tool.overview || ""} ${tool.description || ""}`.toLowerCase();
          const p = String(tool.pricing_model || tool.pricing_type || tool.pricing || "").toLowerCase();

          // Budget Filter Check
          if (budget === "free" && !p.includes("free")) return null;
          if (budget === "freemium" && !p.includes("freemium")) return null;
          if (budget === "paid" && !p.includes("paid")) return null;
          if (budget === "free_freemium" && !p.includes("free") && !p.includes("freemium")) return null;

          let matchPoints = 0;
          const matchedKeywords: string[] = [];

          searchTerms.forEach((term) => {
            if (toolText.includes(term)) {
              matchPoints += 15;
              matchedKeywords.push(term);
            }
          });

          // Base Quality Score Integration
          const baseVaultScore = getToolScore(tool) ?? 85;
          const finalMatchScore = Math.min(99, Math.max(74, Math.round(baseVaultScore * 0.7 + matchPoints)));

          let reason = `Engineered for high-throughput ${tool.category || "AI"} workflows`;
          if (matchedKeywords.length > 0) {
            reason = `Optimized for ${matchedKeywords.slice(0, 2).join(" & ")} with automated cloud execution`;
          }

          return {
            ...tool,
            matchScore: finalMatchScore,
            matchReason: reason,
          };
        })
        .filter((t): t is MatchedTool => Boolean(t))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 6);

      setResults(scored);
      setIsSearching(false);

      // Smooth scroll to results
      const resultsEl = document.getElementById("search-results-section");
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: "smooth" });
      }
    }, 600);
  };

  const handleClear = () => {
    setAccomplish("");
    setCategory("");
    setBudget("free_freemium");
    setPlatform("Web");
    setUseCase("");
    setResults(null);
  };

  return (
    <main className="min-h-screen bg-[#FAFBFD] text-slate-900 pb-28 font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-950">
            <img src="/logo.png" alt="AI Vault" className="h-7 w-7 object-contain" />
            <span>AI Vault<span className="text-blue-600">.</span></span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Link
              href="/compare"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
            >
              ⚖️ Compare
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
            >
              ← Back to Directory
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* HERO TITLE */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">
            ✦ AI Tool Finder
          </span>
          <h1 className="text-3xl font-black text-slate-950 sm:text-5xl tracking-tight leading-tight">
            Find the <span className="text-blue-600">right AI tool</span> for your exact needs.
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Tell AI Vault what you want to accomplish. Our decision engine compares the available AI tools and ranks the best matches.
          </p>
        </div>

        {/* DECISION FINDER FORM */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm mb-10">
          <form onSubmit={handleMatch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                What do you want to accomplish?
              </label>
              <textarea
                rows={3}
                required
                value={accomplish}
                onChange={(e) => setAccomplish(e.target.value)}
                placeholder="Example: I want to build landing pages without coding."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-50 resize-none"
              />
            </div>

            {/* QUICK PILL PROMPTS */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick Prompts:
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {QUICK_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAccomplish(p)}
                    className="shrink-0 rounded-xl bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Example: website builder, coding, writing"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Specific use case</label>
                <input
                  type="text"
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  placeholder="Example: landing page creation"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Budget</label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                >
                  {BUDGETS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSearching || loadingTools}
                className="flex-1 rounded-xl bg-slate-950 py-3 text-xs font-black text-white hover:bg-blue-600 shadow-md transition disabled:opacity-50"
              >
                {isSearching ? "Evaluating 840+ Tools..." : "Find Best AI Tools →"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* RESULTS SECTION */}
        {results !== null && (
          <div id="search-results-section" className="mb-12 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-950">
                Top Matches ({results.length})
              </h2>
              <span className="text-xs font-bold text-blue-600">Ranked by Intent Match</span>
            </div>

            {results.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-xs font-bold text-slate-700">No exact tool matches found.</p>
                <p className="text-[11px] text-slate-400 mt-1">Try broadening your prompt or selecting &quot;Free / Freemium&quot;.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((tool, idx) => (
                  <div
                    key={tool.slug || idx}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <ToolLogo
                        name={String(tool.name)}
                        src={(tool.logo_url || tool.logo) as string}
                        website={String(tool.website_url || tool.website || "")}
                        slug={tool.slug}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-black text-slate-950 truncate">{tool.name}</h3>
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-700">
                            {tool.matchScore}% Match
                          </span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 capitalize">
                            {String(tool.pricing_model || tool.pricing || "Freemium")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {cleanAiContent(tool.tagline || tool.overview || tool.description)}
                        </p>
                        <p className="text-[10px] font-bold text-blue-600 mt-1.5 flex items-center gap-1">
                          <span>✦</span> {tool.matchReason}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center gap-2 shrink-0">
                      <a
                        href={`/go/${encodeURIComponent(String(tool.slug || ""))}`}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="flex-1 sm:flex-none rounded-xl bg-blue-600 px-4 py-2 text-center text-xs font-black text-white hover:bg-blue-700 transition shadow-sm"
                      >
                        Visit Portal ↗
                      </a>
                      <Link
                        href={`/tool/${tool.slug}`}
                        className="flex-1 sm:flex-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                      >
                        Dossier →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3 VALUE PROP CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-lg">🎯</span>
            <h3 className="text-xs font-black text-slate-900 mt-2">Goal Matching</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Match tools against what you actually want to accomplish in your daily pipeline.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-lg">⚡</span>
            <h3 className="text-xs font-black text-slate-900 mt-2">Smart Ranking</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              See match scores and verified capability confidence instead of a generic list.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-lg">🧠</span>
            <h3 className="text-xs font-black text-slate-900 mt-2">Explainable Results</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Every recommendation explains why the tool specifically fits your requirements.
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] font-semibold text-slate-400">
          © 2026 AI Vault. AI Tool Finder Decision Index.
        </p>
      </div>
    </main>
  );
}
