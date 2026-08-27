"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ToolLogo from "@/components/ToolLogo";
import { cleanAiContent } from "@/lib/content-quality";
import { getToolScore, formatAIScore, getScoreBarWidth } from "@/lib/score";

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
  neural_score?: number | string | null;
  logo_url?: string | null;
  logo?: string | null;
  website_url?: string | null;
  website?: string | null;
  affiliate_url?: string | null;
  affiliate_status?: string | null;
  deployment?: string | null;
  [key: string]: unknown;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATEGORIES = ["all", "coding", "marketing", "productivity", "chatbot", "image", "writing", "audio", "video"];

export default function VaultPage() {
  const [allCatalog, setAllCatalog] = useState<ToolRecord[]>([]);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [savedTools, setSavedTools] = useState<ToolRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Tool Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    async function loadVault() {
      try {
        setLoading(true);

        // 1. Fetch entire catalog for the Quick Add modal
        const { data: catalogData, error: catalogErr } = await supabase
          .from("ai_tools")
          .select("*")
          .not("slug", "is", null)
          .neq("affiliate_status", "pending_submission")
          .order("score", { ascending: false });

        if (catalogErr) throw catalogErr;
        const catalog = (catalogData as ToolRecord[]) || [];
        setAllCatalog(catalog);

        // 2. Read local storage saved tools
        let slugs: string[] = [];
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("aivault_saved_tools");
          if (stored) {
            slugs = JSON.parse(stored);
          }
        }

        setSavedSlugs(slugs);

        if (slugs.length > 0) {
          const matched = catalog.filter((t) =>
            slugs.some((s) => s.toLowerCase() === (t.slug || "").toLowerCase())
          );
          setSavedTools(matched);
        } else {
          setSavedTools([]);
        }
      } catch (err) {
        console.error("Error loading vault:", err);
      } finally {
        setLoading(false);
      }
    }

    loadVault();
  }, []);

  const handleAddTool = (tool: ToolRecord) => {
    const slug = (tool.slug || tool.name || "").toLowerCase();
    if (!slug) return;

    if (!savedSlugs.some((s) => s.toLowerCase() === slug)) {
      const updatedSlugs = [...savedSlugs, slug];
      const updatedTools = [...savedTools, tool];
      setSavedSlugs(updatedSlugs);
      setSavedTools(updatedTools);

      if (typeof window !== "undefined") {
        localStorage.setItem("aivault_saved_tools", JSON.stringify(updatedSlugs));
      }
    }
  };

  const handleRemove = (slugToRemove: string) => {
    const updatedSlugs = savedSlugs.filter((s) => s.toLowerCase() !== slugToRemove.toLowerCase());
    setSavedSlugs(updatedSlugs);
    setSavedTools((prev) => prev.filter((t) => (t.slug || "").toLowerCase() !== slugToRemove.toLowerCase()));

    if (typeof window !== "undefined") {
      localStorage.setItem("aivault_saved_tools", JSON.stringify(updatedSlugs));
    }
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear your entire saved stack?")) {
      setSavedSlugs([]);
      setSavedTools([]);
      if (typeof window !== "undefined") {
        localStorage.removeItem("aivault_saved_tools");
      }
    }
  };

  const modalFilteredTools = useMemo(() => {
    return allCatalog.filter((t) => {
      const matchesCategory =
        selectedCategory === "all" ||
        (t.category && t.category.toLowerCase().includes(selectedCategory.toLowerCase()));

      if (!matchesCategory) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        (t.name || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q) ||
        (t.tagline || "").toLowerCase().includes(q)
      );
    });
  }, [allCatalog, searchQuery, selectedCategory]);

  const compareUrl = savedTools.length > 1
    ? `/compare?tools=${encodeURIComponent(savedTools.slice(0, 3).map((t) => t.slug).join(","))}`
    : "/compare";

  return (
    <main className="min-h-screen bg-[#FAFBFD] text-slate-900 pb-28 font-sans">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-950">
            <img src="/logo.png" alt="AI Vault" className="h-7 w-7 object-contain" />
            <span>AI Vault<span className="text-blue-600">.</span></span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/ai-finder"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition"
            >
              ⚡ Matcher
            </Link>
            <Link
              href="/compare"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition"
            >
              ⚖️ Compare
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

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* HEADER BAR WITH (1) TOP ACTION BUTTON */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200/60 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700 mb-2">
              <span>★</span>
              <span>Personal Saved Workbench</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              My Saved AI Stack ({savedTools.length})
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Your bookmarked software tools, benchmarked scores, and quick deployment links.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* PLACE 1: TOP ACTION BUTTON */}
            <button
              onClick={() => {
                setSearchQuery("");
                setAddModalOpen(true);
              }}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700 shadow-sm transition flex items-center gap-1.5"
            >
              <span className="text-base font-bold leading-none">+</span> Add Tool to Stack
            </button>

            {savedTools.length > 1 && (
              <Link
                href={compareUrl}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 shadow-sm transition"
              >
                ⚖️ Compare ({Math.min(3, savedTools.length)})
              </Link>
            )}

            {savedTools.length > 0 && (
              <button
                onClick={handleClearAll}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:border-rose-200 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && savedTools.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm max-w-xl mx-auto my-10">
            <span className="text-4xl">★</span>
            <h2 className="mt-4 text-xl font-black text-slate-950">No Saved Tools in Your Stack</h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              You haven&apos;t added any tools to your stack yet. Click below to quickly search and add any tool from the 840+ catalog.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setAddModalOpen(true)}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-700 shadow-sm transition"
              >
                + Add Tool to Stack Now
              </button>
              <Link
                href="/"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Explore Directory →
              </Link>
            </div>
          </div>
        )}

        {/* SAVED TOOLS GRID WITH (2) IN-GRID ADD CARD */}
        {!loading && savedTools.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedTools.map((tool) => {
              const slug = String(tool.slug || "");
              const name = String(tool.name || "AI Tool");
              const category = String(tool.category || "Productivity");
              const pricing = String(tool.pricing_model || tool.pricing_type || tool.pricing || "Freemium");
              const score = getToolScore(tool) ?? 92;
              const barWidth = getScoreBarWidth(score);

              return (
                <div
                  key={slug}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                >
                  <div>
                    {/* CARD TOP */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <ToolLogo
                          name={name}
                          src={(tool.logo_url || tool.logo) as string}
                          website={String(tool.website_url || tool.website || "")}
                          slug={slug}
                          size="md"
                        />
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-slate-950 truncate">{name}</h3>
                          <span className="text-[10px] text-slate-400 capitalize font-medium">{category}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemove(slug)}
                        title="Remove from saved stack"
                        className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                      {cleanAiContent(tool.tagline || tool.overview || tool.description)}
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="rounded-md bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                        {pricing}
                      </span>
                      <span className="rounded-md bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                        Verified AI
                      </span>
                    </div>
                  </div>

                  <div>
                    {/* SCORE BAR */}
                    <div className="border-t border-slate-100 pt-3 mb-3">
                      <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                        <span className="text-slate-400 uppercase tracking-wider">AI Vault Score</span>
                        <span className="text-blue-600 font-black">{formatAIScore(score)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-full"
                          style={{ width: barWidth }}
                        />
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-2">
                      <a
                        href={`/go/${encodeURIComponent(slug)}`}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="flex-1 rounded-xl bg-blue-600 py-2.5 text-center text-xs font-black text-white hover:bg-blue-700 shadow-sm transition"
                      >
                        Visit Portal ↗
                      </a>
                      <Link
                        href={`/tool/${slug}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                      >
                        Dossier →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* PLACE 2: IN-GRID "+ ADD ANOTHER TOOL" CARD */}
            <button
              onClick={() => {
                setSearchQuery("");
                setAddModalOpen(true);
              }}
              className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 p-8 text-center hover:border-blue-500 hover:bg-blue-50/20 transition min-h-[300px]"
            >
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-2xl font-bold">
                +
              </div>
              <span className="text-sm font-black text-slate-900">Add Another Tool</span>
              <span className="text-xs text-slate-400 max-w-[200px]">Click to search and bookmark from 840+ catalog tools</span>
            </button>
          </div>
        )}
      </div>

      {/* QUICK ADD SEARCH MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-black text-slate-950">Add Tool to Saved Stack</h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {modalFilteredTools.length} tools available in catalog
                </p>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* CATEGORIES CHIPS */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-xl px-3 py-1 text-[11px] font-bold capitalize whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* SEARCH INPUT */}
            <div className="mb-3">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name (Claude, Cursor, DeepSeek)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            {/* TOOLS LIST */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {modalFilteredTools.map((t) => {
                const toolSlug = (t.slug || t.name || "").toLowerCase();
                const isAlreadySaved = savedSlugs.some((s) => s.toLowerCase() === toolSlug);

                return (
                  <div
                    key={toolSlug}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 p-3 hover:border-slate-200 hover:bg-slate-50/60 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ToolLogo name={t.name} src={t.logo_url || t.logo} website={t.website_url || t.website} slug={t.slug} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{t.name}</p>
                        <p className="text-[10px] text-slate-400 capitalize font-mono">{t.category || "AI Tool"} • {String(t.pricing_model || t.pricing || "Freemium")}</p>
                      </div>
                    </div>

                    <button
                      disabled={isAlreadySaved}
                      onClick={() => handleAddTool(t)}
                      className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        isAlreadySaved
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      }`}
                    >
                      {isAlreadySaved ? "✓ Added" : "+ Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
