// app/page.tsx
"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import ToolLogo from "@/components/ToolLogo";
import { cleanAiContent } from "@/lib/content-quality";
import { getToolScore, formatAIScore, getScoreBarWidth } from "@/lib/score";

type ToolRecord = {
  id?: string | number | null;
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  overview?: string | null;
  category?: string | null;
  pricing?: string | null;
  pricing_model?: string | null;
  score?: number | string | null;
  logo_url?: string | null;
  logo?: string | null;
  is_verified?: boolean;
  [key: string]: unknown;
};

const ITEMS_PER_PAGE = 24;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const CATEGORIES = [
  { name: "All", icon: "⚡" },
  { name: "Productivity", icon: "🚀" },
  { name: "Chatbot", icon: "🤖" },
  { name: "Coding", icon: "💻" },
  { name: "Marketing", icon: "📈" },
  { name: "Image", icon: "🎨" },
  { name: "Writing", icon: "✍️" },
  { name: "Audio", icon: "🎵" },
  { name: "Video", icon: "🎬" },
];

const PRICING_OPTIONS = ["All", "Free", "Freemium", "Paid"];
const SORT_OPTIONS = [
  { label: "Top Rated", value: "score" },
  { label: "Name (A-Z)", value: "name" },
];

function ToolCard({ tool }: { tool: ToolRecord }) {
  const name = String(tool.name || "AI Tool");
  const slug = String(tool.slug || "").trim();
  const category = String(tool.category || "AI Tool");
  const pricing = String(tool.pricing_model || tool.pricing || "Freemium");
  const rawDesc = String(tool.description || tool.overview || "");
  const desc = cleanAiContent(rawDesc) || `${name} provides software solutions for ${category.toLowerCase()}.`;
  const score = getToolScore(tool);
  const formattedScore = formatAIScore(score);
  const barWidth = getScoreBarWidth(score);
  const logo = (tool.logo_url || tool.logo) as string | undefined;

  const href = slug ? `/tool/${encodeURIComponent(slug)}` : "#";

  return (
    <Link
      href={href}
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
          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[9px] font-bold text-slate-600">
            {pricing}
          </span>
        </div>

        <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-slate-600">
          {desc}
        </p>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">AI Vault Score</span>
          <span className="text-xs font-black text-blue-600">{formattedScore}</span>
        </div>
        {score !== null && (
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600"
              style={{ width: barWidth }}
            />
          </div>
        )}
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className="text-slate-400 uppercase tracking-wider">Verified Tool</span>
          <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform">Explore →</span>
        </div>
      </div>
    </Link>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [selectedPricing, setSelectedPricing] = useState("All");
  const [sortBy, setSortBy] = useState("score");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const cat = searchParams.get("cat");
    if (cat) setSelectedCat(cat);
  }, [searchParams]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const supabase = getSupabase();
        const { data, error } = await supabase.from("ai_tools").select("*");
        if (error) throw error;
        setTools((data as ToolRecord[]) || []);
      } catch (err) {
        console.error("Error loading tools:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Filtered List
  const filteredTools = useMemo(() => {
    return tools
      .filter((t) => {
        if (selectedCat !== "All" && (t.category || "").toLowerCase() !== selectedCat.toLowerCase()) {
          return false;
        }
        if (selectedPricing !== "All") {
          const p = (t.pricing_model || t.pricing || "").toLowerCase();
          if (selectedPricing === "Free" && (!p.includes("free") || p.includes("freemium"))) return false;
          if (selectedPricing === "Freemium" && !p.includes("freemium")) return false;
          if (selectedPricing === "Paid" && !p.includes("paid")) return false;
        }
        if (search.trim()) {
          const query = search.toLowerCase();
          const name = (t.name || "").toLowerCase();
          const desc = (t.description || t.overview || "").toLowerCase();
          const cat = (t.category || "").toLowerCase();
          return name.includes(query) || desc.includes(query) || cat.includes(query);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "score") {
          return (getToolScore(b) ?? 0) - (getToolScore(a) ?? 0);
        }
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [tools, selectedCat, selectedPricing, search, sortBy]);

  // Reset to page 1 on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCat, selectedPricing, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTools.length / ITEMS_PER_PAGE) || 1;
  const paginatedTools = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTools.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTools, currentPage]);

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">
              {tools.length} AI Tools
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#050714] px-4 py-16 text-center text-white sm:py-20 sm:px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-300 mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          AI Vault Intelligence Engine
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
          Discover the <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">Right AI</span> for Your Workflow.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-xs sm:text-sm text-slate-400 leading-relaxed">
          Search, compare and explore verified AI tools across productivity, coding, marketing, and creative industries.
        </p>

        {/* Global Search Bar */}
        <div className="mx-auto mt-8 max-w-2xl">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${tools.length} verified AI software...`}
              className="h-13 w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-5 pr-12 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Category & Pricing Filters */}
        <section className="mb-8 space-y-4">
          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCat(cat.name)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  selectedCat === cat.name
                    ? "bg-slate-950 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Pricing & Sort Control Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200/80 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Pricing:</span>
              <div className="flex gap-1.5">
                {PRICING_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPricing(p)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      selectedPricing === p
                        ? "bg-blue-50 text-blue-600 font-bold"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 outline-none"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">
              {selectedCat === "All" ? "All AI Tools" : `${selectedCat} Tools`}
              <span className="ml-2 text-xs font-bold text-slate-400">
                (Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredTools.length)} of {filteredTools.length})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
              ))}
            </div>
          ) : paginatedTools.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedTools.map((tool) => (
                  <ToolCard key={String(tool.id || tool.slug)} tool={tool} />
                ))}
              </div>

              {/* PAGINATION CONTROLS (PAGES DATA) */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    ← Prev
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                      let p = idx + 1;
                      if (currentPage > 3 && totalPages > 5) {
                        p = currentPage - 2 + idx;
                        if (p > totalPages) p = totalPages - (4 - idx);
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`h-9 w-9 rounded-xl text-xs font-bold transition ${
                            currentPage === p
                              ? "bg-slate-950 text-white shadow-sm"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-sm font-bold text-slate-800">No matching AI tools found.</p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCat("All");
                  setSelectedPricing("All");
                }}
                className="mt-3 text-xs font-bold text-blue-600 underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#050714]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-blue-500" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
