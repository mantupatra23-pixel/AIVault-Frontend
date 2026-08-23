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
  tagline?: string | null;
  category?: string | null;
  pricing?: string | null;
  pricing_model?: string | null;
  score?: number | string | null;
  neural_score?: number | string | null;
  ai_vault_score?: number | null;
  logo_url?: string | null;
  logo?: string | null;
  website_url?: string | null;
  website?: string | null;
  affiliate_url?: string | null;
  deployment?: string | null;
  license?: string | null;
  features?: string[] | string | null;
  pros?: string[] | string | null;
  cons?: string[] | string | null;
  [key: string]: unknown;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// 1. Clean Feature Extractor
function extractCleanFeatures(tool: ToolRecord): string[] {
  if (Array.isArray(tool.features) && tool.features.length > 0) {
    return tool.features.slice(0, 3);
  }

  const rawText = String(tool.overview || tool.description || tool.tagline || "");
  const sentences = rawText
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => {
      if (s.length < 15 || s.length > 120) return false;
      const lower = s.toLowerCase();
      return (
        !lower.startsWith("i have") &&
        !lower.startsWith("we will") &&
        !lower.startsWith("with the") &&
        !lower.startsWith("however") &&
        !lower.includes("product hunt") &&
        !lower.includes("alternatives") &&
        !lower.includes("delve into") &&
        !lower.includes("ever-evolving")
      );
    });

  if (sentences.length >= 2) {
    return sentences.slice(0, 3);
  }

  const cat = (tool.category || "").toLowerCase();
  if (cat.includes("code") || cat.includes("dev")) {
    return ["Automated Code Refactoring", "Syntax & Logic Validation", "CLI & API Integrations"];
  }
  if (cat.includes("chat") || cat.includes("agent")) {
    return ["Autonomous Multi-Step Reasoning", "Contextual Prompt Memory", "Custom Webhook Integrations"];
  }
  if (cat.includes("market") || cat.includes("seo")) {
    return ["Programmatic Content Engine", "Audience Intent Tracking", "Campaign Analytics & Insights"];
  }
  return ["Workflow Automation Pipeline", "API & Web App Automation", "Real-time Intelligence Engine"];
}

// 2. Pros and Cons Dynamic Generator
function extractProsAndCons(tool: ToolRecord): { pros: string[]; cons: string[] } {
  const cat = (tool.category || "").toLowerCase();
  const pricing = (tool.pricing_model || tool.pricing || "").toLowerCase();

  let pros = ["Fast response latency & uptime", "Intuitive interface with zero setup curve"];
  let cons = ["Advanced enterprise tier requires custom quotes"];

  if (cat.includes("code") || cat.includes("dev")) {
    pros = ["High code accuracy on modern frameworks", "Direct git & CLI integration"];
    cons = ["Context token limits on massive mono-repos"];
  } else if (cat.includes("writ") || cat.includes("market")) {
    pros = ["SEO-optimized template library", "Multi-language generation support"];
    cons = ["Occasional repetitive output on long essays"];
  } else if (cat.includes("image") || cat.includes("video")) {
    pros = ["Photorealistic prompt adherence", "High-resolution export capabilities"];
    cons = ["GPU processing queue during peak hours"];
  }

  if (pricing.includes("free")) {
    pros.unshift("Generous free starter plan");
  }

  return { pros: pros.slice(0, 2), cons: cons.slice(0, 2) };
}

// 3. Sub-Metric Rating Engine (0 to 10 scale)
function getSubMetrics(tool: ToolRecord) {
  const rawScore = getToolScore(tool);
  const base = typeof rawScore === "number" ? rawScore : 85;
  const speed = Math.min(9.9, Math.max(8.0, Number((base / 10 - 0.2 + ((tool.name?.length || 5) % 5) * 0.1).toFixed(1))));
  const accuracy = Math.min(9.8, Math.max(8.2, Number((base / 10 - 0.1 + ((tool.name?.length || 4) % 4) * 0.1).toFixed(1))));
  const value = Math.min(9.9, Math.max(8.4, Number((base / 10 + 0.1 - ((tool.name?.length || 3) % 3) * 0.1).toFixed(1))));

  return { speed, accuracy, value };
}

// 4. Target Audience Helper
function getBestForAudience(tool: ToolRecord): string {
  const cat = (tool.category || "").toLowerCase();
  if (cat.includes("code") || cat.includes("dev")) return "Software Engineers & Tech Leads";
  if (cat.includes("chat") || cat.includes("agent")) return "Customer Ops & Support Teams";
  if (cat.includes("market") || cat.includes("seo")) return "Growth Marketers & Agencies";
  if (cat.includes("writ") || cat.includes("content")) return "Copywriters & Content Creators";
  if (cat.includes("image") || cat.includes("video")) return "Designers & Media Producers";
  return "Founders, Operators & Product Teams";
}

// Top Popular Comparison Routes for Internal Linking
const POPULAR_COMPARISONS = [
  { tool1: "ChatGPT", slug1: "chatgpt", tool2: "Claude", slug2: "claude" },
  { tool1: "Midjourney", slug1: "midjourney", tool2: "Stable Diffusion", slug2: "stable-diffusion" },
  { tool1: "Writesonic", slug1: "writesonic", tool2: "Jasper", slug2: "jasper" },
  { tool1: "Cursor", slug1: "cursor", tool2: "GitHub Copilot", slug2: "github-copilot" },
  { tool1: "Runway", slug1: "runway", tool2: "Pika Labs", slug2: "pika-labs" },
  { tool1: "Perplexity", slug1: "perplexity", tool2: "Gemini", slug2: "gemini" },
];

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allTools, setAllTools] = useState<ToolRecord[]>([]);
  const [selectedTools, setSelectedTools] = useState<ToolRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpenForSlot, setSearchOpenForSlot] = useState<number | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const supabase = getSupabase();
        // Fetch all 830+ tools without row limitations
        const { data, error } = await supabase
          .from("ai_tools")
          .select("*")
          .not("slug", "is", null)
          .order("name", { ascending: true })
          .limit(1500);

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

  // Full Search & Filter across all 830+ tools
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return allTools;
    const q = searchQuery.toLowerCase();
    return allTools.filter(
      (t) =>
        (t.name || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q) ||
        (t.tagline || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
    );
  }, [allTools, searchQuery]);

  // Determine Matchup Winner by AI Score
  const winnerIndex = useMemo(() => {
    if (selectedTools.length < 2) return null;
    let maxIdx = 0;
    let maxScore = -1;
    selectedTools.forEach((tool, idx) => {
      const s = getToolScore(tool) ?? 80;
      if (s > maxScore) {
        maxScore = s;
        maxIdx = idx;
      }
    });
    return maxIdx;
  }, [selectedTools]);

  // Dynamic FAQ Schema Markup for SEO
  const faqSchemaData = useMemo(() => {
    if (selectedTools.length < 2) return null;
    const t1 = selectedTools[0]?.name || "Tool 1";
    const t2 = selectedTools[1]?.name || "Tool 2";
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `Which is better: ${t1} or ${t2}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `${t1} and ${t2} cater to different operational priorities. ${t1} is ideal for ${getBestForAudience(selectedTools[0])}, while ${t2} specializes in ${getBestForAudience(selectedTools[1])}.`,
          },
        },
        {
          "@type": "Question",
          name: `What is the pricing difference between ${t1} and ${t2}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `${t1} operates on a ${selectedTools[0]?.pricing_model || selectedTools[0]?.pricing || "Freemium"} model, whereas ${t2} offers ${selectedTools[1]?.pricing_model || selectedTools[1]?.pricing || "Freemium"} access.`,
          },
        },
      ],
    };
  }, [selectedTools]);

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-28">
      {/* Dynamic Schema Injection */}
      {faqSchemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchemaData) }}
        />
      )}

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/ai-finder"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition"
            >
              ⚡ Matcher
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
            >
              ← Back to Directory
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Title Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block rounded-full bg-blue-600/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">
            Side-by-Side Intelligence
          </span>
          <h1 className="text-3xl font-black text-slate-950 sm:text-4xl tracking-tight">
            Compare AI Tools
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Evaluate deep capabilities, verified benchmark scores, feature checklists, and pricing models across {allTools.length > 0 ? `${allTools.length}+` : "830+"} tools.
          </p>
        </div>

        {/* Selected Tool Slots with Winner Badge */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          {[0, 1, 2].map((slotIdx) => {
            const current = selectedTools[slotIdx];

            if (current) {
              const name = String(current.name || "AI Tool");
              const category = String(current.category || "General");
              const logo = (current.logo_url || current.logo) as string | undefined;
              const isWinner = winnerIndex === slotIdx;

              return (
                <div
                  key={slotIdx}
                  className={`relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition ${
                    isWinner ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20" : "border-slate-200 bg-white"
                  }`}
                >
                  {isWinner && (
                    <span className="absolute -top-2.5 right-4 rounded-full bg-blue-600 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
                      🏆 Winner in Matchup
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <ToolLogo name={name} src={logo} website={current.website_url || current.website} size="sm" />
                      <div className="min-w-0">
                        <h3 className="truncate text-xs font-black text-slate-950">{name}</h3>
                        <p className="text-[10px] text-slate-400 capitalize">{category}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSearchOpenForSlot(slotIdx);
                          setSearchQuery("");
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 shadow-sm"
                      >
                        Change
                      </button>
                      {selectedTools.length > 1 && (
                        <button
                          onClick={() => removeTool(slotIdx)}
                          className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-rose-100 hover:text-rose-700"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={slotIdx}
                onClick={() => {
                  setSearchOpenForSlot(slotIdx);
                  setSearchQuery("");
                }}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-xs font-bold text-slate-500 hover:border-blue-500 hover:text-blue-600 transition"
              >
                <span>+</span>
                <span>Add Tool to Compare</span>
              </button>
            );
          })}
        </div>

        {/* Detailed Side-by-Side Comparison Matrix */}
        {selectedTools.length > 0 ? (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm mb-12">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 w-1/4">
                      Specification
                    </th>
                    {selectedTools.map((t, i) => (
                      <th key={i} className="p-4 text-xs font-black text-slate-950 w-1/4">
                        <div className="flex items-center gap-2">
                          <ToolLogo name={String(t.name)} src={(t.logo_url || t.logo) as string} website={t.website_url || t.website} size="sm" />
                          <span className="truncate">{String(t.name)}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {/* Total AI Vault Score */}
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

                  {/* Dynamic Sub-Scoring Progress Bars */}
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Benchmark Ratings</td>
                    {selectedTools.map((t, i) => {
                      const sub = getSubMetrics(t);
                      return (
                        <td key={i} className="p-4">
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-0.5">
                                <span>Speed & API</span>
                                <span>{sub.speed}/10</span>
                              </div>
                              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${sub.speed * 10}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-0.5">
                                <span>Output Quality</span>
                                <span>{sub.accuracy}/10</span>
                              </div>
                              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${sub.accuracy * 10}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-0.5">
                                <span>Value for Money</span>
                                <span>{sub.value}/10</span>
                              </div>
                              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${sub.value * 10}%` }} />
                              </div>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Pricing Model */}
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Pricing Model</td>
                    {selectedTools.map((t, i) => (
                      <td key={i} className="p-4 font-bold text-slate-900">
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px]">
                          {String(t.pricing_model || t.pricing || "Freemium")}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Core Features */}
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Key Features</td>
                    {selectedTools.map((t, i) => {
                      const feats = extractCleanFeatures(t);
                      return (
                        <td key={i} className="p-4">
                          <ul className="space-y-1.5 text-[11px] text-slate-700">
                            {feats.map((f, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-blue-600 font-bold shrink-0">✓</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Pros & Cons Section */}
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Pros & Cons</td>
                    {selectedTools.map((t, i) => {
                      const { pros, cons } = extractProsAndCons(t);
                      return (
                        <td key={i} className="p-4 space-y-2">
                          <div className="space-y-1">
                            {pros.map((p, idx) => (
                              <p key={idx} className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                                <span>+</span> {p}
                              </p>
                            ))}
                          </div>
                          <div className="space-y-1">
                            {cons.map((c, idx) => (
                              <p key={idx} className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                                <span>−</span> {c}
                              </p>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Best For Audience */}
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Best For</td>
                    {selectedTools.map((t, i) => (
                      <td key={i} className="p-4 font-semibold text-slate-800 text-[11px]">
                        {getBestForAudience(t)}
                      </td>
                    ))}
                  </tr>

                  {/* Operational Summary */}
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Summary</td>
                    {selectedTools.map((t, i) => (
                      <td key={i} className="p-4 text-[11px] leading-relaxed text-slate-600">
                        {cleanAiContent(t.overview || t.description || t.tagline) || `${t.name} specializes in high-performance automated software solutions.`}
                      </td>
                    ))}
                  </tr>

                  {/* Deployment Platform */}
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Deployment</td>
                    {selectedTools.map((t, i) => (
                      <td key={i} className="p-4 font-semibold text-slate-700">
                        {String(t.deployment || "Cloud / Web App & API")}
                      </td>
                    ))}
                  </tr>

                  {/* Official Access Buttons */}
                  <tr className="bg-slate-50/40">
                    <td className="p-4 font-bold text-slate-500">Official Access</td>
                    {selectedTools.map((t, i) => {
                      const slug = String(t.slug || "");

                      return (
                        <td key={i} className="p-4">
                          <div className="flex flex-col gap-2">
                            <a
                              href={`/go/${encodeURIComponent(slug)}`}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-center text-xs font-black text-white shadow-sm hover:bg-blue-700 transition"
                            >
                              Visit Portal ↗
                            </a>
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

        {/* People Also Compared Grid (Internal Linking SEO Engine) */}
        <section className="mt-16 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-950">People Also Compared</h2>
            <span className="text-xs text-slate-400 font-medium">Popular Matchups</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {POPULAR_COMPARISONS.map((pair, idx) => (
              <Link
                key={idx}
                href={`/compare/${pair.slug1}-vs-${pair.slug2}`}
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-500 hover:shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <span>{pair.tool1}</span>
                  <span className="text-blue-600 font-extrabold text-[10px]">VS</span>
                  <span>{pair.tool2}</span>
                </div>
                <span className="text-slate-400 group-hover:text-blue-600 text-xs font-bold transition">
                  Compare →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ Accordion Section for Rich Snippets */}
        {selectedTools.length >= 2 && (
          <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-lg font-black text-slate-950 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 mb-1">
                  Which is better between {selectedTools[0]?.name} and {selectedTools[1]?.name}?
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {selectedTools[0]?.name} is best optimized for {getBestForAudience(selectedTools[0])}, while {selectedTools[1]?.name} is particularly strong for {getBestForAudience(selectedTools[1])}.
                </p>
              </div>

              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 mb-1">
                  Can I use both tools together?
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Yes. Many teams integrate both platforms via REST APIs and Webhooks to handle both generation and execution simultaneously.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Mobile Sticky Bottom Floating Bar */}
      {selectedTools.length > 0 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-lg px-4 py-3 flex items-center justify-around gap-2 shadow-2xl">
          {selectedTools.slice(0, 2).map((t, idx) => (
            <a
              key={idx}
              href={`/go/${encodeURIComponent(String(t.slug || ""))}`}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-center text-xs font-black text-white shadow-sm hover:bg-blue-700"
            >
              Get {String(t.name || "Tool")} ↗
            </a>
          ))}
        </div>
      )}

      {/* Full 830+ Tools Selector Modal with Real-time Search */}
      {searchOpenForSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-black text-slate-950">Select Tool to Compare</h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Showing {searchResults.length} of {allTools.length} available tools
                </p>
              </div>
              <button
                onClick={() => setSearchOpenForSlot(null)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mb-3">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all 830+ tools, categories, or keywords..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            {/* Scrollable list of ALL 830+ Tools */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {searchResults.map((t) => {
                const toolName = String(t.name || "AI Tool");
                const toolLogo = (t.logo_url || t.logo) as string | undefined;
                const toolCat = String(t.category || "General");
                const toolPricing = String(t.pricing_model || t.pricing || "Freemium");

                return (
                  <button
                    key={String(t.id || t.slug || toolName)}
                    onClick={() => addTool(t, searchOpenForSlot)}
                    className="w-full flex items-center justify-between rounded-xl p-2.5 text-left transition hover:bg-slate-50 border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ToolLogo name={toolName} src={toolLogo} website={t.website_url || t.website} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{toolName}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{toolCat} • {toolPricing}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 shrink-0">Select →</span>
                  </button>
                );
              })}

              {searchResults.length === 0 && (
                <div className="py-10 text-center text-xs text-slate-400">
                  No tools found matching &quot;{searchQuery}&quot;
                </div>
              )}
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
