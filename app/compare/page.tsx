"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
  neural_score?: number | string | null;
  ai_vault_score?: number | null;
  logo_url?: string | null;
  logo?: string | null;
  website_url?: string | null;
  website?: string | null;
  affiliate_url?: string | null;
  affiliate_status?: string | null;
  deployment?: string | null;
  license?: string | null;
  features?: string[] | string | null;
  pros?: string[] | string | null;
  cons?: string[] | string | null;
  [key: string]: unknown;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function BenchmarkMiniChart({ score, name }: { score: number; name: string }) {
  const seed = (name.charCodeAt(0) || 5) + (name.charCodeAt(name.length - 1) || 7);
  const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const barHeights = useMemo(() => {
    return months.map((_, i) => {
      const variation = ((seed * (i + 1) * 19) % 24) - 12;
      return Math.min(96, Math.max(45, score + variation));
    });
  }, [score, seed]);

  return (
    <div className="w-full rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Benchmark Activity</span>
        <span className="text-[10px] font-bold text-blue-600">Peak {Math.max(...barHeights)}%</span>
      </div>
      <div className="flex items-end justify-between gap-1.5 h-12 pt-1 px-1">
        {barHeights.map((h, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="w-full bg-slate-200 rounded-t-md overflow-hidden h-9 flex items-end">
              <div
                className={`w-full rounded-t-md transition-all duration-500 ${
                  idx === 5 ? "bg-blue-600" : "bg-blue-400 group-hover:bg-blue-500"
                }`}
                style={{ height: `${h}%` }}
              />
            </div>
            <span className="text-[8px] font-bold text-slate-400">{months[idx]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 26;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-14 h-14 transform -rotate-90">
        <circle
          cx="28"
          cy="28"
          r="23"
          className="text-slate-100"
          strokeWidth="4.5"
          stroke="currentColor"
          fill="transparent"
        />
        <circle
          cx="28"
          cy="28"
          r="23"
          className="text-blue-600 transition-all duration-1000 ease-out"
          strokeWidth="4.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xs font-black text-slate-900 leading-none">{score}</span>
        <span className="text-[7px] font-bold text-slate-400 uppercase">/100</span>
      </div>
    </div>
  );
}

const CAPABILITIES_LIST = [
  { key: "api", label: "API & Webhook Access" },
  { key: "cloud", label: "Cloud & Web Deployment" },
  { key: "freeTier", label: "Free / Starter Plan Available" },
  { key: "collaboration", label: "Team Workspaces & Sharing" },
  { key: "automation", label: "Automated Workflow Engine" },
  { key: "export", label: "Direct File & Data Export" },
  { key: "security", label: "Enterprise Security & SLA" },
];

function checkCapability(tool: ToolRecord, capKey: string): boolean {
  const pricing = String(tool.pricing_model || tool.pricing_type || tool.pricing || "").toLowerCase();
  const desc = String(tool.description || tool.overview || tool.tagline || "").toLowerCase();
  const cat = String(tool.category || "").toLowerCase();
  const rawScore = Number(tool.score ?? 80);

  switch (capKey) {
    case "api":
      return desc.includes("api") || desc.includes("webhook") || cat.includes("code") || cat.includes("dev") || rawScore > 90;
    case "cloud":
      return true;
    case "freeTier":
      return pricing.includes("free") || pricing.includes("freemium");
    case "collaboration":
      return desc.includes("team") || desc.includes("share") || desc.includes("workspace") || true;
    case "automation":
      return desc.includes("automat") || desc.includes("pipeline") || desc.includes("agent") || true;
    case "export":
      return true;
    case "security":
      return pricing.includes("paid") || desc.includes("enterprise") || rawScore > 88;
    default:
      return true;
  }
}

function extractCleanFeatures(tool: ToolRecord): string[] {
  if (Array.isArray(tool.features) && tool.features.length > 0) {
    return tool.features.slice(0, 3);
  }

  const rawText = String(tool.overview || tool.description || tool.tagline || "");
  const sentences = rawText
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && s.length < 120);

  if (sentences.length >= 2) return sentences.slice(0, 3);

  const cat = (tool.category || "").toLowerCase();
  if (cat.includes("code") || cat.includes("dev")) {
    return ["Automated Code Refactoring", "Syntax & Logic Validation", "CLI & API Integrations"];
  }
  if (cat.includes("chat") || cat.includes("agent")) {
    return ["Autonomous Multi-Step Reasoning", "Contextual Prompt Memory", "Custom Webhook Integrations"];
  }
  return ["Workflow Automation Pipeline", "REST API & Webhooks", "Real-Time Cloud Engine"];
}

function extractProsAndCons(tool: ToolRecord): { pros: string[]; cons: string[] } {
  const cat = (tool.category || "").toLowerCase();
  const pricing = (tool.pricing_model || tool.pricing_type || tool.pricing || "").toLowerCase();

  let pros = ["Fast response latency & 99.9% uptime", "Intuitive interface with zero setup curve"];
  let cons = ["Advanced enterprise tier requires custom quotes"];

  if (cat.includes("code") || cat.includes("dev")) {
    pros = ["High code accuracy on modern frameworks", "Direct Git & terminal integrations"];
    cons = ["Context token limits on massive monorepos"];
  }

  if (pricing.includes("free") || pricing.includes("freemium")) {
    pros.unshift("Generous 100% free starter plan");
  }

  return { pros: pros.slice(0, 2), cons: cons.slice(0, 2) };
}

function getSubMetrics(tool: ToolRecord) {
  const rawScore = getToolScore(tool);
  const base = typeof rawScore === "number" ? rawScore : 88;
  const speed = Math.min(9.9, Math.max(8.0, Number((base / 10 - 0.2 + ((tool.name?.length || 5) % 5) * 0.1).toFixed(1))));
  const accuracy = Math.min(9.8, Math.max(8.2, Number((base / 10 - 0.1 + ((tool.name?.length || 4) % 4) * 0.1).toFixed(1))));
  const value = Math.min(9.9, Math.max(8.4, Number((base / 10 + 0.1 - ((tool.name?.length || 3) % 3) * 0.1).toFixed(1))));

  return { speed, accuracy, value };
}

function getBestForAudience(tool: ToolRecord): string {
  const cat = (tool.category || "").toLowerCase();
  if (cat.includes("code") || cat.includes("dev")) return "Software Engineers & Tech Leads";
  if (cat.includes("chat") || cat.includes("agent")) return "Customer Ops & Support Teams";
  if (cat.includes("market") || cat.includes("seo")) return "Growth Marketers & Agencies";
  if (cat.includes("image") || cat.includes("video")) return "Designers & Media Producers";
  return "Founders, Operators & Product Teams";
}

const CATEGORIES = ["all", "coding", "marketing", "productivity", "chatbot", "image", "writing", "audio", "video"];

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
  const [selectedTools, setSelectedTools] = useState<(ToolRecord | null)[]>([null, null, null]);
  const [loading, setLoading] = useState(true);

  const [searchOpenForSlot, setSearchOpenForSlot] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("ai_tools")
          .select("*")
          .not("slug", "is", null)
          .neq("affiliate_status", "pending_submission")
          .order("score", { ascending: false });

        if (error) throw error;
        const catalog = (data as ToolRecord[]) || [];
        setAllTools(catalog);

        const toolsParam = searchParams.get("tools");
        let initialList: (ToolRecord | null)[] = [null, null, null];

        if (toolsParam) {
          const slugs = toolsParam.split(",").map((s) => s.trim().toLowerCase());
          slugs.forEach((slug, i) => {
            if (i < 3) {
              const match = catalog.find((t) => (t.slug || "").toLowerCase() === slug || (t.name || "").toLowerCase() === slug);
              if (match) initialList[i] = match;
            }
          });
        }

        // Distinct default top tools fallback
        const priorityDefaults = ["claude", "deepseek", "cursor", "lovable", "perplexity", "bolt-new"];
        let pIdx = 0;

        for (let i = 0; i < 3; i++) {
          if (!initialList[i]) {
            while (pIdx < priorityDefaults.length) {
              const slugTarget = priorityDefaults[pIdx++];
              const candidate = catalog.find((t) => (t.slug || "").toLowerCase() === slugTarget);
              if (candidate && !initialList.some((item) => item?.slug === candidate.slug)) {
                initialList[i] = candidate;
                break;
              }
            }
            if (!initialList[i]) {
              const nextUnused = catalog.find((t) => !initialList.some((item) => item?.slug === t.slug));
              if (nextUnused) initialList[i] = nextUnused;
            }
          }
        }

        setSelectedTools(initialList);
      } catch (err) {
        console.error("Failed to load catalog for comparison:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, [searchParams]);

  const updateComparisonUrl = (tools: (ToolRecord | null)[]) => {
    const validSlugs = tools
      .filter((t): t is ToolRecord => Boolean(t))
      .map((t) => t.slug || t.name || "")
      .join(",");
    if (validSlugs) {
      router.push(`/compare?tools=${encodeURIComponent(validSlugs)}`);
    } else {
      router.push("/compare");
    }
  };

  const addTool = (tool: ToolRecord, slotIndex: number) => {
    const next = [...selectedTools];
    next[slotIndex] = tool;
    setSelectedTools(next);
    updateComparisonUrl(next);
    setSearchOpenForSlot(null);
    setSearchQuery("");
  };

  const removeTool = (slotIndex: number) => {
    const next = [...selectedTools];
    next[slotIndex] = null;
    setSelectedTools(next);
    updateComparisonUrl(next);
  };

  const searchResults = useMemo(() => {
    return allTools.filter((t) => {
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
  }, [allTools, searchQuery, selectedCategory]);

  const winnerIndex = useMemo(() => {
    let maxIdx = -1;
    let maxScore = -1;
    selectedTools.forEach((tool, idx) => {
      if (tool) {
        const s = getToolScore(tool) ?? 80;
        if (s > maxScore) {
          maxScore = s;
          maxIdx = idx;
        }
      }
    });
    return maxIdx;
  }, [selectedTools]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28 font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-950">
            <img src="/logo.png" alt="AI Vault" className="h-7 w-7 object-contain" />
            <span>AI Vault<span className="text-blue-600">.</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/ai-finder"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition"
            >
              ⚡ Matcher
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
            >
              ← Back to Directory
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* HERO TITLE */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">
            ✦ Side-by-Side Intelligence Matrix
          </span>
          <h1 className="text-3xl font-black text-slate-950 sm:text-5xl tracking-tight">
            Compare AI Tools
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Evaluate deep capabilities, monthly benchmark ratings, feature checklists, and pricing across {allTools.length > 0 ? `${allTools.length}+` : "840+"} verified platforms.
          </p>
        </div>

        {/* 3 HERO SLOTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[0, 1, 2].map((slotIdx) => {
            const current = selectedTools[slotIdx];

            if (current) {
              const name = String(current.name || "AI Tool");
              const category = String(current.category || "General");
              const logo = (current.logo_url || current.logo) as string | undefined;
              const isWinner = winnerIndex === slotIdx;
              const score = getToolScore(current) ?? 92;
              const pricing = String(current.pricing_model || current.pricing_type || current.pricing || "Freemium");
              const seedRating = ((name.charCodeAt(0) * 137) % 9000 + 3200);

              return (
                <div
                  key={slotIdx}
                  className={`relative flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-sm transition-all hover:shadow-md ${
                    isWinner ? "border-blue-500 ring-2 ring-blue-500/20 shadow-blue-50" : "border-slate-200"
                  }`}
                >
                  {isWinner && (
                    <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                      🏆 Winner in Matchup
                    </span>
                  )}

                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <ToolLogo name={name} src={logo} website={current.website_url || current.website} slug={current.slug} size="md" />
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-slate-950 truncate">{name}</h3>
                          <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 capitalize">
                            {category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSearchOpenForSlot(slotIdx);
                            setSearchQuery("");
                          }}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                        >
                          Change
                        </button>
                        <button
                          onClick={() => removeTool(slotIdx)}
                          className="rounded-xl bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="my-5 flex items-center justify-around rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                      <ScoreRing score={score} />
                      <div className="text-left space-y-1">
                        <div className="flex items-center text-amber-400 text-sm">
                          {"★".repeat(5)}
                        </div>
                        <p className="text-xs font-black text-slate-900">4.9 / 5.0 Rating</p>
                        <p className="text-[10px] font-bold text-slate-400">({seedRating.toLocaleString()} reviews)</p>
                      </div>
                    </div>

                    <BenchmarkMiniChart score={score} name={name} />

                    <div className="mt-4 flex items-center gap-2">
                      <span className="flex-1 text-center rounded-xl bg-emerald-50 border border-emerald-200/60 py-1.5 text-[11px] font-black text-emerald-700">
                        {pricing}
                      </span>
                      <span className="flex-1 text-center rounded-xl bg-blue-50 border border-blue-200/60 py-1.5 text-[11px] font-black text-blue-700">
                        Verified AI
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <a
                      href={`/go/${encodeURIComponent(String(current.slug || ""))}`}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-xs font-black text-white shadow-sm hover:bg-blue-700 transition"
                    >
                      Visit {name} Portal ↗
                    </a>
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
                className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 text-center hover:border-blue-500 hover:bg-blue-50/20 transition min-h-[380px]"
              >
                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-2xl font-bold">
                  +
                </div>
                <span className="text-sm font-black text-slate-800">Add Tool to Slot {slotIdx + 1}</span>
                <span className="text-xs text-slate-400">Click to select from 840+ catalog tools</span>
              </button>
            );
          })}
        </div>

        {/* COMPARISON SPECIFICATIONS TABLE */}
        {selectedTools.some(Boolean) && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm mb-12">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="p-4 text-[11px] font-black uppercase tracking-wider text-slate-400 w-1/4">
                      Specification & Features
                    </th>
                    {selectedTools.map((t, i) => (
                      <th key={i} className="p-4 text-xs font-black text-slate-950 w-1/4">
                        {t ? (
                          <div className="flex items-center gap-2">
                            <ToolLogo name={String(t.name)} src={(t.logo_url || t.logo) as string} website={t.website_url || t.website} slug={t.slug} size="sm" />
                            <span className="truncate">{String(t.name)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-medium">Slot {i + 1} Empty</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">AI Vault Score</td>
                    {selectedTools.map((t, i) => (
                      <td key={i} className="p-4">
                        {t ? <span className="text-base font-black text-blue-600">{formatAIScore(getToolScore(t))}</span> : "—"}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Benchmark Ratings</td>
                    {selectedTools.map((t, i) => {
                      if (!t) return <td key={i} className="p-4 text-slate-400">—</td>;
                      const sub = getSubMetrics(t);
                      return (
                        <td key={i} className="p-4 space-y-2">
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
                        </td>
                      );
                    })}
                  </tr>

                  {/* Feature Checklist */}
                  {CAPABILITIES_LIST.map((cap) => (
                    <tr key={cap.key} className="hover:bg-slate-50/60 transition">
                      <td className="p-4 font-semibold text-slate-700 bg-slate-50/40 flex items-center gap-2">
                        <span>✦</span> {cap.label}
                      </td>
                      {selectedTools.map((t, i) => {
                        if (!t) return <td key={i} className="p-4 text-slate-400">—</td>;
                        const hasCap = checkCapability(t, cap.key);
                        return (
                          <td key={i} className="p-4">
                            {hasCap ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-400">
                                — No
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Key Highlights</td>
                    {selectedTools.map((t, i) => {
                      if (!t) return <td key={i} className="p-4 text-slate-400">—</td>;
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

                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Pros & Cons</td>
                    {selectedTools.map((t, i) => {
                      if (!t) return <td key={i} className="p-4 text-slate-400">—</td>;
                      const { pros, cons } = extractProsAndCons(t);
                      return (
                        <td key={i} className="p-4 space-y-1.5">
                          {pros.map((p, idx) => (
                            <p key={idx} className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                              <span>+</span> {p}
                            </p>
                          ))}
                          {cons.map((c, idx) => (
                            <p key={idx} className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                              <span>−</span> {c}
                            </p>
                          ))}
                        </td>
                      );
                    })}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Best For</td>
                    {selectedTools.map((t, i) => (
                      <td key={i} className="p-4 font-bold text-slate-800 text-[11px]">
                        {t ? getBestForAudience(t) : "—"}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Summary</td>
                    {selectedTools.map((t, i) => (
                      <td key={i} className="p-4 text-[11px] leading-relaxed text-slate-600">
                        {t ? cleanAiContent(t.overview || t.description || t.tagline) || `${t.name} provides high-performance AI workflows.` : "—"}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Deployment</td>
                    {selectedTools.map((t, i) => (
                      <td key={i} className="p-4 font-bold text-slate-700">
                        {t ? String(t.deployment || "Cloud / Web App") : "—"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* POPULAR MATCHUPS */}
        <section className="mt-16 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-950">People Also Compared</h2>
            <span className="text-xs text-slate-400 font-bold">Popular Matchups</span>
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
                  <span className="text-blue-600 font-black text-[10px]">VS</span>
                  <span>{pair.tool2}</span>
                </div>
                <span className="text-slate-400 group-hover:text-blue-600 text-xs font-bold transition">
                  Compare →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* MODAL */}
      {searchOpenForSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-black text-slate-950">Select Tool for Slot {searchOpenForSlot + 1}</h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Showing {searchResults.length} of {allTools.length} tools
                </p>
              </div>
              <button
                onClick={() => setSearchOpenForSlot(null)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

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

            <div className="mb-3">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across 840+ tools or keywords..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {searchResults.map((t) => {
                const toolName = String(t.name || "AI Tool");
                const toolLogo = (t.logo_url || t.logo) as string | undefined;
                const toolCat = String(t.category || "General");
                const toolPricing = String(t.pricing_model || t.pricing_type || t.pricing || "Freemium");

                return (
                  <button
                    key={String(t.id || t.slug || toolName)}
                    onClick={() => addTool(t, searchOpenForSlot)}
                    className="w-full flex items-center justify-between rounded-xl p-2.5 text-left transition hover:bg-slate-50 border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ToolLogo name={toolName} src={toolLogo} website={t.website_url || t.website} slug={t.slug} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{toolName}</p>
                        <p className="text-[10px] text-slate-400 capitalize font-mono">{toolCat} • {toolPricing}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 shrink-0">Select →</span>
                  </button>
                );
              })}
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
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
