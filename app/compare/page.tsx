// app/compare/page.tsx
"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
  neural_score?: number | string | null;
  logo_url?: string | null;
  logo?: string | null;
  website_url?: string | null;
  website?: string | null;
  deployment?: string | null;
  license?: string | null;
  [key: string]: unknown;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allTools, setAllTools] = useState<ToolRecord[]>([]);
  const [selectedTools, setSelectedTools] = useState<ToolRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpenForSlot, setSearchOpenForSlot] = useState<number | null>(null);

  // Load Catalog
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const supabase = getSupabase();
        const { data, error } = await supabase.from("ai_tools").select("*").order("name", { ascending: true });
        if (error) throw error;
        setAllTools((data as ToolRecord[]) || []);
      } catch (err) {
        console.error("Failed to load catalog for comparison:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Sync with URL params
  useEffect(() => {
    if (allTools.length === 0) return;

    const rawParam = searchParams.get("tools") || "";
    const slugs = rawParam.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

    if (slugs.length > 0) {
      const matched = slugs
        .map((s) => allTools.find((t) => (t.slug || "").toLowerCase() === s || (t.name || "").toLowerCase() === s))
        .filter((t): t is ToolRecord => Boolean(t));

      if (matched.length > 0) {
        setSelectedTools(matched.slice(0, 3));
        return;
      }
    }

    // Default: Pick top 2 tools if no URL params
    if (allTools.length >= 2) {
      setSelectedTools([allTools[0], allTools[1]]);
    }
  }, [allTools, searchParams]);

  // Update URL on Tool Selection
  const updateComparisonUrl = (tools: ToolRecord[]) => {
    const slugs = tools.map((t) => t.slug || t.name || "").filter(Boolean).join(",");
    if (slugs) {
      router.push(`/compare?tools=${encodeURIComponent(slugs)}`);
    } else {
      router.push("/compare");
    }
  };

  const addTool = (tool: ToolRecord, slotIndex?: number) => {
    let next: ToolRecord[] = [...selectedTools];
    if (typeof slotIndex === "number" && slotIndex < next.length) {
      next[slotIndex] = tool;
    } else if (next.length < 3) {
      next.push(tool);
    } else {
      next[2] = tool;
    }
    setSelectedTools(next);
    updateComparisonUrl(next);
    setSearchOpenForSlot(null);
    setSearchQuery("");
  };

  const removeTool = (index: number) => {
    const next = selectedTools.filter((_, i) => i !== index);
    setSelectedTools(next);
    updateComparisonUrl(next);
  };

  // Filter for Search Modal
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return allTools.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return allTools
      .filter((t) => (t.name || "").toLowerCase().includes(q) || (t.category || "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [allTools, searchQuery]);

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-20">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs font-bold text-slate-600 hover:text-blue-600">
              ← Back to Directory
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block rounded-full bg-blue-600/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">
            Side-by-Side Intelligence
          </span>
          <h1 className="text-3xl font-black text-slate-950 sm:text-4xl tracking-tight">
            Compare AI Tools
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Evaluate capabilities, verified scores, pricing tiers, and workflows across 2–3 software platforms simultaneously.
          </p>
        </div>

        {/* TOOL SELECTOR BAR (SLOTS) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          {[0, 1, 2].map((slotIdx) => {
            const current = selectedTools[slotIdx];

            if (current) {
              const name = String(current.name || "AI Tool");
              const category = String(current.category || "General");
              const logo = (current.logo_url || current.logo) as string | undefined;

              return (
                <div
                  key={slotIdx}
                  className="relative flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ToolLogo name={name} src={logo} size="sm" />
                    <div className="min-w-0">
                      <h3 className="truncate text-xs font-black text-slate-950">{name}</h3>
                      <p className="text-[10px] text-slate-400 capitalize">{category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSearchOpenForSlot(slotIdx)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Change
                    </button>
                    {selectedTools.length > 1 && (
                      <button
                        onClick={() => removeTool(slotIdx)}
                        className="rounded-lg bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-rose-100 hover:text-rose-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <button
                key={slotIdx}
                onClick={() => setSearchOpenForSlot(slotIdx)}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-xs font-bold text-slate-500 hover:border-blue-500 hover:text-blue-600 transition"
              >
                <span>+</span>
                <span>Add Tool to Compare</span>
              </button>
            );
          })}
        </div>

        {/* COMPARISON MATRIX TABLE */}
        {selectedTools.length > 0 ? (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 w-1/4">
                      Specification
                    </th>
                    {selectedTools.map((t, i) => (
                      <th key={i} className="p-4 text-xs font-black text-slate-950 w-1/4">
                        <div className="flex items-center gap-2">
                          <ToolLogo name={String(t.name)} src={(t.logo_url || t.logo) as string} size="xs" />
                          <span className="truncate">{String(t.name)}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {/* AI Vault Score */}
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">AI Vault Score</td>
                    {selectedTools.map((t, i) => {
                      const s = getToolScore(t);
                      return (
                        <td key={i} className="p-4">
                          <span className="text-base font-black text-blue-600">{formatAIScore(s)}</span>
                          {s !== null && (
                            <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: getScoreBarWidth(s) }} />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Pricing Tier */}
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Pricing Tier</td>
                    {selectedTools.map((t, i) => (
                      <td key={i} className="p-4 font-bold text-slate-900">
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px]">
                          {String(t.pricing_model || t.pricing || "Freemium")}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Primary Category */}
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Category</td>
                    {selectedTools.map((t, i) => (
                      <td key={i} className="p-4 capitalize font-semibold text-slate-700">
                        {String(t.category || "Productivity")}
                      </td>
                    ))}
                  </tr>

                  {/* Overview Breakdown */}
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Summary</td>
                    {selectedTools.map((t, i) => (
                      <td key={i} className="p-4 text-[11px] leading-relaxed text-slate-600">
                        {cleanAiContent(t.overview || t.description) || `${t.name} specializes in workflow automation.`}
                      </td>
                    ))}
                  </tr>

                  {/* Deployment Model */}
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Deployment</td>
                    {selectedTools.map((t, i) => (
                      <td key={i} className="p-4 font-semibold text-slate-700">
                        {String(t.deployment || "Cloud / Web App")}
                      </td>
                    ))}
                  </tr>

                  {/* Direct Action Link */}
                  <tr className="bg-slate-50/40">
                    <td className="p-4 font-bold text-slate-500">Official Access</td>
                    {selectedTools.map((t, i) => {
                      const url = String(t.website_url || t.website || "");
                      const slug = String(t.slug || "");

                      return (
                        <td key={i} className="p-4">
                          <div className="flex flex-col gap-2">
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-center text-xs font-black text-white shadow-sm hover:bg-blue-700 transition"
                              >
                                Visit Portal ↗
                              </a>
                            ) : null}
                            <Link
                              href={`/tool/${encodeURIComponent(slug)}`}
                              className="text-center text-[10px] font-bold text-slate-600 hover:text-blue-600 underline"
                            >
                              View Full Dossier →
                            </Link>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      {/* TOOL SEARCH MODAL */}
      {searchOpenForSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-950">Select Tool to Compare</h3>
              <button
                onClick={() => setSearchOpenForSlot(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tool name or category..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
            />

            <div className="mt-4 max-h-60 overflow-y-auto space-y-1.5">
              {searchResults.map((t) => (
                <button
                  key={String(t.id || t.slug)}
                  onClick={() => addTool(t, searchOpenForSlot)}
                  className="w-full flex items-center justify-between rounded-xl p-2.5 text-left transition hover:bg-slate-50 border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ToolLogo name={String(t.name)} src={(t.logo_url || t.logo) as string} size="xs" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{String(t.name)}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{String(t.category || "AI")}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-blue-600">Select →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#fafbfc]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
