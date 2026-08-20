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
  affiliate_url?: string | null;
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

  // Quick Face-off custom input states
  const [quick1, setQuick1] = useState("");
  const [quick2, setQuick2] = useState("");

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from("ai_tools")
          .select("*")
          .order("name", { ascending: true });
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

  useEffect(() => {
    if (allTools.length === 0) return;

    const rawParam = searchParams.get("tools") || "";
    const slugs = rawParam
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (slugs.length > 0) {
      const matched = slugs
        .map((s) =>
          allTools.find(
            (t) =>
              (t.slug || "").toLowerCase() === s ||
              (t.name || "").toLowerCase() === s
          )
        )
        .filter((t): t is ToolRecord => Boolean(t));

      if (matched.length > 0) {
        setSelectedTools(matched.slice(0, 3));
        return;
      }
    }

    if (allTools.length >= 2) {
      setSelectedTools([allTools[0], allTools[1]]);
    }
  }, [allTools, searchParams]);

  const updateComparisonUrl = (tools: ToolRecord[]) => {
    const slugs = tools
      .map((t) => t.slug || t.name || "")
      .filter(Boolean)
      .join(",");
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

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return allTools.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return allTools
      .filter(
        (t) =>
          (t.name || "").toLowerCase().includes(q) ||
          (t.category || "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [allTools, searchQuery]);

  return (
    <main className="min-h-screen bg-[#07090e] text-slate-100 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-800/80 bg-[#07090e]/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight text-white">
              AI Vault<span className="text-[#00FF66]">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-bold text-neutral-400 hover:text-[#00FF66] transition"
            >
              ← Back to Directory
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block rounded-full bg-[#00FF66]/10 border border-[#00FF66]/20 px-3.5 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-[#00FF66] mb-3">
            Side-by-Side Intelligence
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Compare <span className="text-[#00FF66]">AI Tools</span>
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-neutral-400">
            Evaluate capabilities, verified scores, pricing tiers, and workflows across 2–3 software platforms simultaneously.
          </p>
        </div>

        {/* Quick Launch SEO Face-Off Card */}
        <div className="bg-[#0e131f] border border-neutral-800 p-5 rounded-2xl mb-8 max-w-2xl mx-auto text-center shadow-xl">
          <p className="text-xs text-neutral-400 mb-3 font-mono">Quick Static Head-to-Head Comparison:</p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <input
              type="text"
              placeholder="e.g. writesonic"
              value={quick1}
              onChange={(e) => setQuick1(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              className="bg-[#07090e] border border-neutral-700 text-white px-3.5 py-2 rounded-xl text-xs outline-none focus:border-[#00FF66] w-36 sm:w-44"
            />
            <span className="text-[#00FF66] font-bold text-xs">VS</span>
            <input
              type="text"
              placeholder="e.g. jasper"
              value={quick2}
              onChange={(e) => setQuick2(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              className="bg-[#07090e] border border-neutral-700 text-white px-3.5 py-2 rounded-xl text-xs outline-none focus:border-[#00FF66] w-36 sm:w-44"
            />
            <Link
              href={`/compare/${quick1 || "tool1"}-vs-${quick2 || "tool2"}`}
              className="bg-[#00FF66] text-black font-bold px-4 py-2 rounded-xl text-xs hover:bg-[#00e65c] transition shadow-[0_0_15px_rgba(0,255,102,0.25)]"
            >
              Launch Face-Off ↗
            </Link>
          </div>
        </div>

        {/* 3 Interactive Tool Slots */}
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
                  className="relative flex items-center justify-between rounded-2xl border border-[#00FF66]/30 bg-[#0e131f] p-4 shadow-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ToolLogo name={name} src={logo} website={current.website_url || current.website} size="sm" />
                    <div className="min-w-0">
                      <h3 className="truncate text-xs font-bold text-white">{name}</h3>
                      <p className="text-[10px] text-neutral-400 capitalize font-mono">{category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSearchOpenForSlot(slotIdx)}
                      className="rounded-lg border border-neutral-700 bg-[#07090e] px-2.5 py-1 text-[10px] font-bold text-neutral-300 hover:border-[#00FF66] hover:text-[#00FF66] transition"
                    >
                      Change
                    </button>
                    {selectedTools.length > 1 && (
                      <button
                        onClick={() => removeTool(slotIdx)}
                        className="rounded-lg bg-neutral-800/80 px-2 py-1 text-[10px] font-bold text-neutral-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
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
                className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-800 bg-[#0b0e14] p-4 text-xs font-bold text-neutral-400 hover:border-[#00FF66]/60 hover:text-[#00FF66] transition"
              >
                <span>+</span>
                <span>Add Tool to Compare</span>
              </button>
            );
          })}
        </div>

        {/* Detailed Comparison Table */}
        {selectedTools.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0b0e14] shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-neutral-800 bg-[#0e131f]/70">
                    <th className="p-4 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 w-1/4">
                      Specification
                    </th>
                    {selectedTools.map((t, i) => (
                      <th key={i} className="p-4 text-xs font-bold text-white w-1/4">
                        <div className="flex items-center gap-2.5">
                          <ToolLogo name={String(t.name)} src={(t.logo_url || t.logo) as string} website={t.website_url || t.website} size="sm" />
                          <span className="truncate">{String(t.name)}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-800/60 text-xs">
                  <tr>
                    <td className="p-4 font-bold text-neutral-400 bg-[#07090e]/40">AI Vault Score</td>
                    {selectedTools.map((t, i) => {
                      const s = getToolScore(t);
                      return (
                        <td key={i} className="p-4">
                          <span className="text-base font-black text-[#00FF66]">{formatAIScore(s)}</span>
                          {s !== null && (
                            <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-neutral-800">
                              <div className="h-full bg-[#00FF66] rounded-full shadow-[0_0_8px_rgba(0,255,102,0.4)]" style={{ width: getScoreBarWidth(s) }} />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-neutral-400 bg-[#07090e]/40">Pricing Tier</td>
                    {selectedTools.map((t, i) => (
                      <td key={i} className="p-4 font-bold text-white">
                        <span className="rounded-md border border-[#00FF66]/20 bg-[#00FF66]/10 text-[#00FF66] px-2.5 py-1 text-[10px] font-mono">
                          {String(t.pricing_model || t.pricing || "Freemium")}
                        </span>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-neutral-400 bg-[#07090e]/40">Category</td>
                    {selectedTools.map((t, i) => (
                      <td key={i} className="p-4 capitalize font-semibold text-neutral-200">
                        {String(t.category || "Productivity")}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-neutral-400 bg-[#07090e]/40">Summary</td>
                    {selectedTools.map((t, i) => (
                      <td key={i} className="p-4 text-[11px] leading-relaxed text-neutral-300">
                        {cleanAiContent(t.overview || t.description) || `${t.name} specializes in enterprise workflow automation.`}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-neutral-400 bg-[#07090e]/40">Deployment</td>
                    {selectedTools.map((t, i) => (
                      <td key={i} className="p-4 font-semibold text-neutral-300">
                        {String(t.deployment || "Cloud / Web App")}
                      </td>
                    ))}
                  </tr>

                  {/* Smart Affiliate Outbound Action */}
                  <tr className="bg-[#07090e]/60">
                    <td className="p-4 font-bold text-neutral-400">Official Access</td>
                    {selectedTools.map((t, i) => {
                      const slug = String(t.slug || "");

                      return (
                        <td key={i} className="p-4">
                          <div className="flex flex-col gap-2">
                            <a
                              href={`/go/${encodeURIComponent(slug)}`}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              className="inline-flex items-center justify-center rounded-xl bg-[#00FF66] px-4 py-2 text-center text-xs font-bold text-black shadow-[0_0_15px_rgba(0,255,102,0.25)] hover:bg-[#00e65c] transition"
                            >
                              Visit Portal ↗
                            </a>
                            <Link
                              href={`/tool/${encodeURIComponent(slug)}`}
                              className="text-center text-[10px] font-bold text-neutral-400 hover:text-[#00FF66] underline transition"
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

      {/* Tool Selector Search Modal */}
      {searchOpenForSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-[#0e131f] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Select Tool to Compare</h3>
              <button
                onClick={() => setSearchOpenForSlot(null)}
                className="text-neutral-400 hover:text-white text-sm font-bold p-1"
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
              className="w-full rounded-xl border border-neutral-700 bg-[#07090e] px-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-[#00FF66]"
            />

            <div className="mt-4 max-h-60 overflow-y-auto space-y-1.5">
              {searchResults.map((t) => (
                <button
                  key={String(t.id || t.slug)}
                  onClick={() => addTool(t, searchOpenForSlot)}
                  className="w-full flex items-center justify-between rounded-xl p-2.5 text-left transition hover:bg-[#07090e] border border-transparent hover:border-neutral-800"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ToolLogo name={String(t.name)} src={(t.logo_url || t.logo) as string} website={t.website_url || t.website} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{String(t.name)}</p>
                      <p className="text-[10px] text-neutral-400 capitalize font-mono">{String(t.category || "AI")}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#00FF66]">Select →</span>
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
        <div className="flex min-h-screen items-center justify-center bg-[#07090e]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-800 border-t-[#00FF66]" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
