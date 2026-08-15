// app/category/[slug]/page.tsx
"use client";

import { use, useEffect, useState, useMemo } from "react";
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
  category?: string | null;
  pricing?: string | null;
  pricing_model?: string | null;
  score?: number | string | null;
  logo_url?: string | null;
  logo?: string | null;
  website_url?: string | null;
  website?: string | null;
  [key: string]: unknown;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const rawCategory = decodeURIComponent(resolvedParams.slug || "").trim();

  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPricing, setSelectedPricing] = useState("All");
  const [search, setSearch] = useState("");

  const formattedCatName =
    rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();

  useEffect(() => {
    async function loadCategoryTools() {
      try {
        setLoading(true);
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from("ai_tools")
          .select("*")
          .ilike("category", `%${rawCategory}%`);

        if (error) throw error;
        setTools((data as ToolRecord[]) || []);
      } catch (err) {
        console.error("Error loading category tools:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCategoryTools();
  }, [rawCategory]);

  const filteredTools = useMemo(() => {
    return tools
      .filter((t) => {
        if (selectedPricing !== "All") {
          const p = (t.pricing_model || t.pricing || "").toLowerCase();
          if (selectedPricing === "Free" && (!p.includes("free") || p.includes("freemium"))) return false;
          if (selectedPricing === "Freemium" && !p.includes("freemium")) return false;
          if (selectedPricing === "Paid" && !p.includes("paid")) return false;
        }
        if (search.trim()) {
          const q = search.toLowerCase();
          const name = (t.name || "").toLowerCase();
          const desc = (t.overview || t.description || "").toLowerCase();
          return name.includes(q) || desc.includes(q);
        }
        return true;
      })
      .sort((a, b) => (getToolScore(b) ?? 0) - (getToolScore(a) ?? 0));
  }, [tools, selectedPricing, search]);

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-20">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/find"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600"
            >
              ⚡ Matcher
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600"
            >
              ⚖️ Compare
            </Link>
            <Link
              href="/vault"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600"
            >
              ★ Vault
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="bg-[#050714] px-4 py-14 text-center text-white sm:py-16 sm:px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-300 mb-3">
          Verified Category Hub
        </div>
        <h1 className="text-3xl font-black sm:text-5xl tracking-tight">
          Best <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">{formattedCatName}</span> AI Tools
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-xs sm:text-sm text-slate-400">
          Explore {tools.length} benchmarked and verified AI software platforms designed for {formattedCatName.toLowerCase()} automation.
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex gap-2">
            {["All", "Free", "Freemium", "Paid"].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPricing(p)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedPricing === p
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Filter ${formattedCatName} tools...`}
            className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-600"
          />
        </div>

        {/* Tools Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
            ))}
          </div>
        ) : filteredTools.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((tool) => {
              const name = String(tool.name || "AI Tool");
              const slug = String(tool.slug || "");
              const pricing = String(tool.pricing_model || tool.pricing || "Freemium");
              const score = getToolScore(tool);
              const formattedScore = formatAIScore(score);
              const barWidth = getScoreBarWidth(score);
              const rawDesc = String(tool.overview || tool.description || "")
                .replace(/I will provide an overview[^.]*\.\s*/gi, "")
                .replace(/I conducted a thorough analysis[^.]*\.\s*/gi, "");
              const desc = cleanAiContent(rawDesc) || `${name} provides specialized capabilities.`;

              return (
                <Link
                  key={String(tool.id || slug)}
                  href={`/tool/${encodeURIComponent(slug)}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <ToolLogo name={name} src={(tool.logo_url || tool.logo) as string} size="md" />
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-black text-slate-950 group-hover:text-blue-600 transition-colors">
                            {name}
                          </h3>
                          <p className="text-[10px] text-slate-400 capitalize">{formattedCatName}</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[9px] font-bold text-slate-600">
                        {pricing}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-600">
                      {desc}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-slate-400">Score</span>
                      <span className="text-xs font-black text-blue-600">{formattedScore}</span>
                    </div>
                    {score !== null && (
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 mb-2.5">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: barWidth }} />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-400">Verified Dossier</span>
                      <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform">Explore →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-sm font-bold text-slate-800">No tools found matching your criteria.</p>
          </div>
        )}
      </div>
    </main>
  );
}
