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
  pricing_type?: string | null;
  score?: number | string | null;
  ai_vault_score?: number | string | null;
  logo_url?: string | null;
  logo?: string | null;
  is_featured?: boolean | null;
  featured?: boolean | null;
  affiliate_status?: string | null;
  [key: string]: unknown;
};

const ITEMS_PER_PAGE = 24;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATEGORIES = [
  { name: "All", icon: "⚡" },
  { name: "Marketing", icon: "📈" },
  { name: "Productivity", icon: "🚀" },
  { name: "Chatbot", icon: "🤖" },
  { name: "Coding", icon: "💻" },
  { name: "Image", icon: "🎨" },
  { name: "Writing", icon: "✍️" },
  { name: "Audio", icon: "🎵" },
  { name: "Video", icon: "🎬" },
];

const PRICING_OPTIONS = ["All", "Free", "Freemium", "Paid"];
const SORT_OPTIONS = [
  { label: "Top Rated & Featured", value: "score" },
  { label: "Name (A-Z)", value: "name" },
];

function isToolFeatured(tool: ToolRecord): boolean {
  if (tool.is_featured === true || tool.featured === true) return true;
  if (tool.affiliate_status === "featured") return true;
  const score = getToolScore(tool);
  return typeof score === "number" && score >= 96;
}

function ToolCard({ tool }: { tool: ToolRecord }) {
  const name = String(tool.name || "AI Tool");
  const slug = String(tool.slug || "").trim();
  const category = String(tool.category || "AI Tool");
  const pricing = String(tool.pricing_type || tool.pricing || "Freemium");
  const featured = isToolFeatured(tool);

  const rawDesc = String(tool.description || tool.overview || "")
    .replace(/I will provide an overview[^.]*\.\s*/gi, "")
    .replace(/As a Senior SEO[^.]*\.\s*/gi, "")
    .replace(/I conducted a thorough analysis[^.]*\.\s*/gi, "")
    .replace(/I had the opportunity to analyze[^.]*\.\s*/gi, "");

  const desc =
    cleanAiContent(rawDesc) ||
    `${name} provides software solutions for ${category.toLowerCase()}.`;
  const score = getToolScore(tool);
  const formattedScore = formatAIScore(score);
  const barWidth = getScoreBarWidth(score);
  const logo = (tool.logo_url || tool.logo) as string | undefined;

  const href = slug ? `/tool/${encodeURIComponent(slug)}` : "#";

  return (
    <Link
      href={href}
      className={`group relative flex flex-col justify-between rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
        featured
          ? "border-2 border-blue-500/80 bg-gradient-to-b from-blue-50/50 via-white to-white shadow-md shadow-blue-500/10 hover:border-blue-600 hover:shadow-xl"
          : "border border-slate-200/90 bg-white shadow-sm hover:border-blue-300 hover:shadow-md"
      }`}
    >
      {/* Featured Boost Pill */}
      {featured && (
        <div className="absolute -top-3 right-4 flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-md shadow-blue-500/30">
          <span>⚡ Featured</span>
        </div>
      )}

      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <ToolLogo src={logo} name={name} size="md" />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black text-slate-950 group-hover:text-blue-600 transition-colors">
                {name}
              </h3>
              <p className="text-[11px] font-medium text-slate-400 capitalize">
                {category}
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
              featured
                ? "border border-blue-200 bg-blue-100/60 text-blue-700 font-black"
                : "border border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            {pricing}
          </span>
        </div>

        <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-slate-600">
          {desc}
        </p>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            AI Vault Score
          </span>
          <span
            className={`text-xs font-black ${
              featured ? "text-indigo-600" : "text-blue-600"
            }`}
          >
            {formattedScore}
          </span>
        </div>
        {score !== null && (
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 mb-3">
            <div
              className={`h-full rounded-full ${
                featured
                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500"
                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600"
              }`}
              style={{ width: barWidth }}
            />
          </div>
        )}
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className="text-slate-400 uppercase tracking-wider">
            {featured ? "★ Sponsored Partner" : "Verified Tool"}
          </span>
          <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform">
            Explore →
          </span>
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
    if (cat) {
      const match = CATEGORIES.find(
        (c) => c.name.toLowerCase() === cat.toLowerCase()
      );
      if (match) setSelectedCat(match.name);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
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

  const filteredTools = useMemo(() => {
    return tools
      .filter((t) => {
        if (t.affiliate_status === "pending_submission") return false;

        if (selectedCat !== "All") {
          const toolCat = (t.category || "").toLowerCase();
          const targetCat = selectedCat.toLowerCase();
          if (!toolCat.includes(targetCat) && toolCat !== targetCat) {
            return false;
          }
        }

        if (selectedPricing !== "All") {
          const p = (t.pricing_type || t.pricing || "").toLowerCase();
          if (
            selectedPricing === "Free" &&
            (!p.includes("free") || p.includes("freemium"))
          )
            return false;
          if (selectedPricing === "Freemium" && !p.includes("freemium"))
            return false;
          if (selectedPricing === "Paid" && !p.includes("paid")) return false;
        }

        if (search.trim()) {
          const query = search.toLowerCase();
          const name = (t.name || "").toLowerCase();
          const desc = (t.description || t.overview || "").toLowerCase();
          const cat = (t.category || "").toLowerCase();
          return (
            name.includes(query) ||
            desc.includes(query) ||
            cat.includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const featA = isToolFeatured(a) ? 1 : 0;
        const featB = isToolFeatured(b) ? 1 : 0;

        // Pinned priority for featured listings
        if (featA !== featB) {
          return featB - featA;
        }

        if (sortBy === "score") {
          return (getToolScore(b) ?? 0) - (getToolScore(a) ?? 0);
        }
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [tools, selectedCat, selectedPricing, search, sortBy]);

  const spotlightTools = useMemo(() => {
    return tools
      .filter(
        (t) =>
          isToolFeatured(t) && t.affiliate_status !== "pending_submission"
      )
      .slice(0, 3);
  }, [tools]);

  const popularComparisons = useMemo(() => {
    const valid = tools.filter(
      (t) => t.slug && t.affiliate_status !== "pending_submission"
    );
    const pairs: { toolA: ToolRecord; toolB: ToolRecord }[] = [];
    for (let i = 0; i < Math.min(valid.length - 1, 8); i += 2) {
      if (valid[i] && valid[i + 1]) {
        pairs.push({ toolA: valid[i], toolB: valid[i + 1] });
      }
    }
    return pairs;
  }, [tools]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCat, selectedPricing, sortBy]);

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
          <Link
            href="/"
            className="text-lg font-black tracking-tight text-slate-950"
          >
            AI Vault<span className="text-blue-600">.</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/matcher"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition"
            >
              <span>⚡ Matcher</span>
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

            <Link
              href="/submit"
              className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition shadow-sm"
            >
              <span>+ Submit</span>
            </Link>
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
          Discover the{" "}
          <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
            Right AI
          </span>{" "}
          for Your Workflow.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-xs sm:text-sm text-slate-400 leading-relaxed">
          Search, compare and explore verified AI tools across productivity,
          coding, marketing, and creative industries.
        </p>

        {/* Global Search Bar */}
        <div className="mx-auto mt-8 max-w-2xl">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${
                tools.length > 0 ? tools.length : 750
              } verified AI software...`}
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

      {/* Featured AI Spotlight Shelf */}
      {spotlightTools.length > 0 && !search && selectedCat === "All" && (
        <section className="border-b border-slate-200/80 bg-gradient-to-r from-slate-950 via-[#070b1e] to-slate-950 py-8 px-4 sm:px-8 text-white">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Featured AI Spotlight
                </span>
              </div>
              <Link
                href="/submit"
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300"
              >
                Promote Your Tool ↗
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {spotlightTools.map((tool) => (
                <Link
                  key={String(tool.id || tool.slug)}
                  href={`/tool/${encodeURIComponent(String(tool.slug))}`}
                  className="group rounded-2xl border border-blue-500/30 bg-white/5 p-4 backdrop-blur-md transition hover:-translate-y-1 hover:border-blue-400 hover:bg-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ToolLogo
                        src={tool.logo_url as string}
                        name={String(tool.name)}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-white group-hover:text-blue-300">
                          {String(tool.name)}
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {String(tool.category)}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                      Featured
                    </span>
                  </div>
                  <p className="mt-2.5 line-clamp-2 text-[11px] text-slate-300">
                    {String(tool.description || tool.overview || "")}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Programmatic Head-to-Head Comparisons */}
      {popularComparisons.length > 0 && !search && selectedCat === "All" && (
        <section className="border-b border-slate-200/80 bg-white py-8 px-4 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-600">
                  🔥 Trending Face-Offs
                </span>
                <h2 className="text-base font-black text-slate-950 sm:text-lg mt-1">
                  Popular AI Head-to-Head Comparisons
                </h2>
              </div>
              <Link
                href="/compare"
                className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Build Custom Comparison →
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {popularComparisons.map(({ toolA, toolB }, idx) => {
                const slugA = encodeURIComponent(String(toolA.slug || ""));
                const slugB = encodeURIComponent(String(toolB.slug || ""));
                const nameA = String(toolA.name || "Tool A");
                const nameB = String(toolB.name || "Tool B");
                const vsHref = `/vs/${slugA}-vs-${slugB}`;

                return (
                  <Link
                    key={idx}
                    href={vsHref}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <ToolLogo
                          src={toolA.logo_url as string}
                          name={nameA}
                          size="sm"
                        />
                        <span className="truncate text-xs font-black text-slate-900">
                          {nameA}
                        </span>
                      </div>
                      <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black text-white">
                        VS
                      </span>
                      <div className="flex items-center gap-2 min-w-0 justify-end">
                        <span className="truncate text-xs font-black text-slate-900">
                          {nameB}
                        </span>
                        <ToolLogo
                          src={toolB.logo_url as string}
                          name={nameB}
                          size="sm"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[10px]">
                      <span className="font-semibold text-slate-400 capitalize">
                        {String(toolA.category || "AI")} Stack
                      </span>
                      <span className="font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                        Compare Now →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Category & Pricing Filters */}
        <section className="mb-8 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCat(cat.name)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  selectedCat === cat.name
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 font-black"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200/80 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                Pricing:
              </span>
              <div className="flex gap-1.5">
                {PRICING_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPricing(p)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      selectedPricing === p
                        ? "bg-blue-600 text-white font-black shadow-sm"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                Sort:
              </span>
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
                (Showing{" "}
                {filteredTools.length > 0
                  ? (currentPage - 1) * ITEMS_PER_PAGE + 1
                  : 0}
                –
                {Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  filteredTools.length
                )}{" "}
                of {filteredTools.length})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
          ) : paginatedTools.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedTools.map((tool) => (
                  <ToolCard key={String(tool.id || tool.slug)} tool={tool} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-50 hover:text-blue-600"
                  >
                    ← Prev
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: Math.min(totalPages, 5) }).map(
                      (_, idx) => {
                        let p = idx + 1;
                        if (currentPage > 3 && totalPages > 5) {
                          p = currentPage - 2 + idx;
                          if (p > totalPages) p = totalPages - (4 - idx);
                        }
                        const isActive = currentPage === p;
                        return (
                          <button
                            key={p}
                            onClick={() => handlePageChange(p)}
                            className={`h-9 w-9 rounded-xl text-xs font-black transition ${
                              isActive
                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-600 ring-offset-2"
                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-50 hover:text-blue-600"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-sm font-bold text-slate-800">
                No matching AI tools found.
              </p>
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
