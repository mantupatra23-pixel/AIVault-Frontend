// app/page.tsx
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface ToolItem {
  id?: string | number | null;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  overview?: string | null;
  category?: string | null;
  pricing_type?: string | null;
  pricing?: string | null;
  ai_vault_score?: number | string | null;
  score?: number | string | null;
  logo_url?: string | null;
  logo?: string | null;
  website_url?: string | null;
  [key: string]: unknown;
}

const ITEMS_PER_PAGE = 24;

const CATEGORIES = [
  { id: "all", label: "⚡ All Tools" },
  { id: "productivity", label: "⚡ Productivity" },
  { id: "marketing", label: "📈 Marketing" },
  { id: "coding", label: "💻 Coding" },
  { id: "chatbot", label: "🤖 Chatbot" },
  { id: "image", label: "🎨 Image" },
  { id: "writing", label: "✍️ Writing" },
  { id: "audio", label: "🎙️ Audio" },
  { id: "video", label: "🎥 Video" },
];

const PRICING_OPTIONS = ["All", "Free", "Freemium", "Paid"];

function cleanDescription(text: string, name: string, category: string): string {
  if (!text) return `${name} provides automated AI workflow solutions for ${category.toLowerCase()}.`;
  return text
    .replace(/I will provide an overview[^.]*\.\s*/gi, "")
    .replace(/As a Senior SEO[^.]*\.\s*/gi, "")
    .replace(/I conducted a thorough analysis[^.]*\.\s*/gi, "")
    .replace(/I had the opportunity to analyze[^.]*\.\s*/gi, "")
    .trim();
}

function parseScore(val: unknown): number {
  if (typeof val === "number" && !isNaN(val)) return Math.min(100, Math.max(70, val));
  if (typeof val === "string") {
    const num = parseInt(val, 10);
    if (!isNaN(num)) return Math.min(100, Math.max(70, num));
  }
  return 95;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [selectedPricing, setSelectedPricing] = useState("All");
  const [sortBy, setSortBy] = useState("Top Rated");
  const [currentPage, setCurrentPage] = useState(1);
  const [vaultSlugs, setVaultSlugs] = useState<string[]>([]);

  // Sync category from URL query parameters (?cat=xyz)
  useEffect(() => {
    const cat = searchParams.get("cat");
    if (cat) {
      const match = CATEGORIES.find(
        (c) => c.id.toLowerCase() === cat.toLowerCase() || c.label.toLowerCase().includes(cat.toLowerCase())
      );
      if (match) setSelectedCat(match.id);
    }
  }, [searchParams]);

  // Load tools and saved bookmarks
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("ai_tools")
          .select("*")
          .not("slug", "is", null);

        if (!error && data) {
          setTools(data as ToolItem[]);
        }
      } catch (err) {
        console.error("Failed to fetch catalog:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();

    try {
      const saved = JSON.parse(localStorage.getItem("aivault_saved") || "[]");
      if (Array.isArray(saved)) setVaultSlugs(saved);
    } catch {}
  }, []);

  const toggleSave = (slug: string) => {
    const next = vaultSlugs.includes(slug)
      ? vaultSlugs.filter((s) => s !== slug)
      : [...vaultSlugs, slug];
    setVaultSlugs(next);
    localStorage.setItem("aivault_saved", JSON.stringify(next));
  };

  const filteredTools = useMemo(() => {
    return tools.filter((t) => {
      const toolName = String(t.name || "").toLowerCase();
      const toolDesc = String(t.tagline || t.description || t.overview || "").toLowerCase();
      const toolCat = String(t.category || "").toLowerCase();
      const toolPrice = String(t.pricing_type || t.pricing || "freemium").toLowerCase();

      // Category matching
      if (selectedCat !== "all") {
        if (!toolCat.includes(selectedCat.toLowerCase())) return false;
      }

      // Pricing matching
      if (selectedPricing !== "All") {
        const target = selectedPricing.toLowerCase();
        if (target === "free" && (!toolPrice.includes("free") || toolPrice.includes("freemium"))) return false;
        if (target === "freemium" && !toolPrice.includes("freemium")) return false;
        if (target === "paid" && !toolPrice.includes("paid")) return false;
      }

      // Search query matching
      if (search.trim()) {
        const query = search.toLowerCase();
        return toolName.includes(query) || toolDesc.includes(query) || toolCat.includes(query);
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "Top Rated") {
        const scoreA = parseScore(a.ai_vault_score ?? a.score);
        const scoreB = parseScore(b.ai_vault_score ?? b.score);
        return scoreB - scoreA;
      }
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }, [tools, selectedCat, selectedPricing, search, sortBy]);

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
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#06080F] text-white selection:bg-emerald-500 selection:text-black">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-gray-800/80 bg-[#0B0F19]/90 backdrop-blur-md px-4 sm:px-8">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-white">
              AI <span className="text-emerald-400">Vault.</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold">
            <Link
              href="/matcher"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black transition"
            >
              ⚡ Matcher
            </Link>

            <Link
              href="/compare"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-800 bg-[#0D1322] text-gray-300 hover:border-emerald-500/40 hover:text-white transition"
            >
              ⚖️ Compare
            </Link>

            <Link
              href="/vault"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-800 bg-[#0D1322] text-gray-300 hover:border-emerald-500/40 hover:text-emerald-400 transition"
            >
              ★ Vault ({vaultSlugs.length})
            </Link>

            <Link
              href="/submit"
              className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-xl bg-gray-800 text-gray-200 hover:text-white border border-gray-700 transition"
            >
              + Submit
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 pt-12 pb-8 text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-widest">
          ⚡ 750+ Verified AI Software Catalog
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
          Discover the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-teal-300">Right AI</span> for Your Workflow.
        </h1>

        <p className="text-gray-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          Search, compare, and deploy production-ready AI tools across productivity, coding, marketing, and creative industries.
        </p>

        {/* Global Search Bar */}
        <div className="max-w-2xl mx-auto relative pt-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${tools.length > 0 ? tools.length : 750}+ verified AI software...`}
            className="w-full h-14 pl-12 pr-10 bg-[#0D1322] border border-gray-800 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 shadow-2xl transition text-sm sm:text-base"
          />
          <svg className="w-5 h-5 text-gray-500 absolute left-4 top-[26px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-[24px] text-gray-400 hover:text-white text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </section>

      {/* Category Pills & Filters */}
      <section className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCat === cat.id
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black"
                  : "bg-[#0D1322] text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-800/80">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">PRICING:</span>
            <div className="flex gap-1.5">
              {PRICING_OPTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPricing(p)}
                  className={`text-xs px-3 py-1 rounded-lg font-bold transition ${
                    selectedPricing === p
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                      : "bg-[#0D1322] text-gray-400 border border-gray-800 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">SORT:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#0D1322] text-gray-300 text-xs font-bold border border-gray-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="Top Rated">Top Rated</option>
              <option value="Name A-Z">Name A-Z</option>
            </select>
          </div>
        </div>
      </section>

      {/* Directory Grid */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-sm font-bold text-gray-400">
            Showing {filteredTools.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredTools.length)} of {filteredTools.length} AI Tools
          </h2>
          {selectedCat !== "all" && (
            <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">
              Category: {selectedCat}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-48 bg-[#0D1322] border border-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : paginatedTools.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedTools.map((tool) => {
                const name = String(tool.name || "AI Tool");
                const slug = String(tool.slug || "").trim();
                const category = String(tool.category || "AI Software");
                const pricing = String(tool.pricing_type || tool.pricing || "Freemium");
                const score = parseScore(tool.ai_vault_score ?? tool.score);
                const desc = cleanDescription(
                  String(tool.tagline || tool.description || tool.overview || ""),
                  name,
                  category
                );
                const isSaved = vaultSlugs.includes(slug);

                return (
                  <div
                    key={String(tool.id || slug)}
                    className="bg-[#0B0F19] border border-gray-800/80 hover:border-emerald-500/50 rounded-2xl p-5 flex flex-col justify-between transition group hover:shadow-2xl hover:shadow-emerald-500/5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400 text-sm">
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate font-extrabold text-base text-white group-hover:text-emerald-400 transition leading-tight">
                              {name}
                            </h3>
                            <span className="text-xs text-gray-400 capitalize">{category}</span>
                          </div>
                        </div>

                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-md bg-gray-800/90 text-gray-300 font-bold uppercase border border-gray-700">
                          {pricing}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {desc}
                      </p>

                      {/* AI Vault Score Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-gray-500 uppercase tracking-wider">AI Vault Score</span>
                          <span className="text-emerald-400">{score}/100</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-3 border-t border-gray-800/60 flex items-center justify-between">
                      <button
                        onClick={() => toggleSave(slug)}
                        className={`text-xs font-bold flex items-center gap-1 transition ${
                          isSaved ? "text-emerald-400" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {isSaved ? "★ Saved" : "☆ Save"}
                      </button>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/tool/${slug}`}
                          className="text-xs font-bold text-gray-300 hover:text-white px-2 py-1 transition"
                        >
                          Specs →
                        </Link>
                        <a
                          href={`/go/${slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition shadow-md shadow-emerald-500/20"
                        >
                          Visit ↗
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-10 pb-6">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl bg-[#0D1322] border border-gray-800 text-xs font-bold disabled:opacity-40 hover:border-emerald-500/40 hover:text-white transition"
                >
                  ← Prev
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
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
                        className={`h-8 w-8 rounded-xl text-xs font-black transition ${
                          isActive
                            ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25"
                            : "border border-gray-800 bg-[#0D1322] text-gray-300 hover:border-emerald-500/40"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl bg-[#0D1322] border border-gray-800 text-xs font-bold disabled:opacity-40 hover:border-emerald-500/40 hover:text-white transition"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-[#0D1322] border border-gray-800 rounded-2xl p-12 text-center space-y-3">
            <p className="text-sm font-bold text-gray-300">No matching AI software found.</p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCat("all");
                setSelectedPricing("All");
              }}
              className="text-xs font-bold text-emerald-400 underline hover:text-emerald-300"
            >
              Reset all filters
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 bg-[#070A11] mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-gray-500 font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-white font-black text-sm">AI Vault.</span>
            <span>© 2026 Intelligence Engine.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/matcher" className="hover:text-emerald-400 transition">AI Matcher</Link>
            <Link href="/compare" className="hover:text-emerald-400 transition">Compare Matrix</Link>
            <Link href="/admin" className="hover:text-emerald-400 transition">Admin Console</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#06080F]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-800 border-t-emerald-500" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
