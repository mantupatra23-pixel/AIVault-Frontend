// app/tool/[slug]/page.tsx
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
  pricing_type?: string | null;
  score?: number | string | null;
  ai_vault_score?: number | string | null;
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
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const rawSlug = decodeURIComponent(resolvedParams.slug || "").trim();

  const [tool, setTool] = useState<ToolRecord | null>(null);
  const [related, setRelated] = useState<ToolRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(140);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState(14);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);

  const [quizBudget, setQuizBudget] = useState<"free" | "paid" | null>(null);
  const [quizTeam, setQuizTeam] = useState<"solo" | "team" | null>(null);

  // Price Alert Lead State
  const [alertEmail, setAlertEmail] = useState("");
  const [alertStatus, setAlertStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [alertMsg, setAlertMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && rawSlug) {
      try {
        const stored = localStorage.getItem("aivault_saved");
        if (stored) {
          const list: string[] = JSON.parse(stored);
          if (list.some((s) => s.toLowerCase() === rawSlug.toLowerCase())) {
            setBookmarked(true);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [rawSlug]);

  useEffect(() => {
    async function loadToolData() {
      try {
        setLoading(true);
        const { data: toolData, error: toolErr } = await supabase
          .from("ai_tools")
          .select("*")
          .or(`slug.eq.${rawSlug},name.ilike.${rawSlug}`)
          .limit(1)
          .maybeSingle();

        if (toolErr || !toolData) {
          console.error("Tool fetch error:", toolErr);
          setLoading(false);
          return;
        }

        setTool(toolData);

        const seed = Math.abs(
          String(toolData.name || "AI")
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0)
        );
        setUpvoteCount(95 + (seed % 110));

        const cat = toolData.category || "Productivity";
        const { data: relatedData } = await supabase
          .from("ai_tools")
          .select("*")
          .ilike("category", cat)
          .neq("slug", rawSlug)
          .limit(6);

        setRelated(relatedData || []);
      } catch (err) {
        console.error("Exception loading tool data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadToolData();
  }, [rawSlug]);

  const toolName = String(tool?.name || "AI Tool");
  const category = String(tool?.category || "Productivity");
  const pricing = String(tool?.pricing_type || tool?.pricing_model || tool?.pricing || "Freemium");
  
  // Use existing score logic, fallback to explicit ai_vault_score
  const rawScore = tool?.ai_vault_score ?? tool?.score ?? 95;
  const score = getToolScore({ score: rawScore });
  const formattedScore = formatAIScore(score);
  const barWidth = getScoreBarWidth(score);
  
  const logo = (tool?.logo_url || tool?.logo) as string | undefined;
  const deployment = String(tool?.deployment || "Cloud / Web App");
  const license = String(tool?.license || "Commercial SaaS");

  const destinationUrl = useMemo(() => {
    let raw = tool?.affiliate_url?.trim() || tool?.website_url?.trim() || tool?.website?.trim() || "";
    if (!raw) return `/go/${encodeURIComponent(rawSlug)}`;
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
      raw = `https://${raw}`;
    }
    return raw;
  }, [tool, rawSlug]);

  const handleOutboundClick = () => {
    if (!tool) return;
    try {
      fetch("/api/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tool.id, slug: tool.slug || rawSlug }),
      }).catch(() => {});
    } catch (e) {
      console.error(e);
    }
  };

  const handlePriceAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail || !alertEmail.includes("@")) return;

    try {
      setAlertStatus("loading");
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: alertEmail,
          source: `tool_price_alert`,
          tool_slug: rawSlug,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Subscription failed");

      setAlertStatus("success");
      setAlertMsg(`✓ Tracking enabled! We will notify you of discounts for ${toolName}.`);
      setAlertEmail("");
    } catch (err: unknown) {
      setAlertStatus("error");
      setAlertMsg(err instanceof Error ? err.message : "Failed to subscribe.");
    }
  };

  const rawOverview = String(tool?.overview || tool?.description || "")
    .replace(/I will provide an overview[^.]*\.\s*/gi, "")
    .replace(/As a Senior SEO[^.]*\.\s*/gi, "")
    .replace(/I conducted a thorough analysis[^.]*\.\s*/gi, "");

  const cleanOverview =
    cleanAiContent(rawOverview) ||
    `${toolName} is a verified AI software platform designed to optimize ${category.toLowerCase()} workflows.`;

  const estimatedHoursSaved = Math.round(weeklyHours * 0.45 * 10) / 10;
  const estimatedMonthlySavings = Math.round(estimatedHoursSaved * 4 * 35);

  const playbookPrompts = useMemo(() => {
    const cat = category.toLowerCase();
    if (cat.includes("market") || cat.includes("invest")) {
      return [
        {
          title: "Investor Pitch & Hook Optimizer",
          prompt: `Analyze our value proposition for a modern audience. Identify the top 3 high-conviction hooks, potential friction points, and output a concise 60-second elevator pitch structured for ${toolName}.`,
        },
        {
          title: "High-Response Cold Outreach Blueprint",
          prompt: `Generate a 3-step personalised outreach cadence for prospect decision makers. Keep each message under 110 words with a specific, low-friction call to action.`,
        },
      ];
    }
    return [
      {
        title: "Standard Workflow Acceleration Prompt",
        prompt: `Act as a senior operations specialist. Break down our standard operational task into an automated 3-step execution pipeline utilizing ${toolName}.`,
      },
      {
        title: "Executive Summary & Key Action Items",
        prompt: `Synthesize the core findings from this project into 5 bullet points with clear owner assignments and priority scores.`,
      },
    ];
  }, [category, toolName]);

  const handleUpvote = () => {
    if (upvoted) {
      setUpvoteCount((prev) => prev - 1);
      setUpvoted(false);
    } else {
      setUpvoteCount((prev) => prev + 1);
      setUpvoted(true);
    }
  };

  const handleBookmarkToggle = () => {
    if (typeof window === "undefined" || !rawSlug) return;
    try {
      const stored = localStorage.getItem("aivault_saved");
      let list: string[] = stored ? JSON.parse(stored) : [];
      if (bookmarked) {
        list = list.filter((s) => s.toLowerCase() !== rawSlug.toLowerCase());
        setBookmarked(false);
      } else {
        if (!list.includes(rawSlug)) list.push(rawSlug);
        setBookmarked(true);
      }
      localStorage.setItem("aivault_saved", JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyPrompt = (text: string, index: number) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedPromptIndex(index);
      setTimeout(() => setCopiedPromptIndex(null), 2000);
    }
  };

  const featuresList = [
    {
      title: "Intelligent Pipeline Automation",
      desc: `Automates complex ${category.toLowerCase()} operational steps with minimal latency.`
    },
    {
      title: "Immediate Workspace Deployment",
      desc: "Instant cloud accessibility without complex installations or server configurations."
    },
    {
      title: "High-Throughput Processing",
      desc: "Handles large data inputs and parallel execution without performance degradation."
    },
    {
      title: "Actionable Intelligence & Exports",
      desc: "Generates clean, structured outputs ready for production use and team handoffs."
    }
  ];

  const useCasesList = [
    `Eliminating repetitive manual hours in ${category.toLowerCase()} routines.`,
    "Accelerating operational turnarounds for founders, creators, and teams.",
    "Scaling output volume without needing additional specialized headcount.",
    "Centralizing real-time analytics and task management."
  ];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#06080F]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-800 border-t-emerald-500" />
      </main>
    );
  }

  if (!tool) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#06080F] px-4 text-center">
        <h1 className="text-2xl font-black text-white">AI Tool Not Found</h1>
        <p className="mt-2 text-xs text-gray-500">The requested tool record could not be loaded.</p>
        <Link href="/" className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-black shadow-md">
          ← Return to Directory
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06080F] text-white selection:bg-emerald-500 selection:text-black pb-28">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800/80 bg-[#0B0F19]/90 backdrop-blur-md px-4 sm:px-8">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-white">
              AI <span className="text-emerald-400">Vault.</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={`/compare?tools=${encodeURIComponent(rawSlug)}`}
              className="inline-flex items-center gap-1 rounded-xl border border-gray-800 bg-[#0D1322] px-3 py-1.5 text-xs font-bold text-gray-300 hover:border-emerald-500/40 hover:text-white transition"
            >
              <span>⚖️ Compare</span>
            </Link>

            <Link
              href="/vault"
              className="inline-flex items-center gap-1 rounded-xl border border-gray-800 bg-[#0D1322] px-3 py-1.5 text-xs font-bold text-gray-300 hover:border-emerald-500/40 hover:text-emerald-400 transition"
            >
              <span>★ Vault</span>
            </Link>

            <button
              onClick={handleCopyLink}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-gray-800 bg-[#0D1322] px-3 py-1.5 text-xs font-bold text-gray-300 hover:border-emerald-500/40 hover:text-white transition"
            >
              <span>{copied ? "✓ Copied" : "🔗 Share"}</span>
            </button>

            <a
              href={destinationUrl}
              onClick={handleOutboundClick}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-4 py-1.5 text-xs font-black text-black shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
            >
              Visit Website ↗
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-gray-500">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-emerald-400 transition">Directory</Link>
            <span>/</span>
            <Link href={`/?cat=${encodeURIComponent(category)}`} className="hover:text-emerald-400 transition capitalize">{category}</Link>
            <span>/</span>
            <span className="text-gray-300">{toolName}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Verified Catalog Entry
          </span>
        </div>

        {/* HERO SECTION */}
        <section className="bg-[#0B0F19] border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400 text-2xl">
                {toolName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                    Verified AI
                  </span>
                  <span className="rounded-md bg-gray-800 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-300 border border-gray-700">
                    {category}
                  </span>
                  <span className="rounded-md border border-gray-700 bg-gray-800 px-2 py-0.5 text-[9px] font-bold text-gray-300 uppercase">
                    {pricing}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-white sm:text-4xl tracking-tight mt-1">
                  {toolName}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start">
              <button
                onClick={handleUpvote}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-md ${
                  upvoted
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : "border-gray-800 bg-[#0D1322] text-gray-400 hover:border-gray-700 hover:text-white"
                }`}
              >
                <span>▲</span>
                <span>{upvoteCount}</span>
              </button>

              <button
                onClick={handleBookmarkToggle}
                className={`rounded-xl border p-2 text-xs font-bold transition shadow-md px-3.5 py-2 ${
                  bookmarked
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : "border-gray-800 bg-[#0D1322] text-gray-400 hover:border-gray-700 hover:text-white"
                }`}
              >
                {bookmarked ? "★ Saved" : "☆ Save"}
              </button>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-gray-300 max-w-3xl">
            {cleanOverview}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-800 bg-[#0D1322] p-3.5">
              <p className="text-[9px] font-bold uppercase text-gray-500 tracking-wider">AI Vault Score</p>
              <p className="mt-1 text-sm font-black text-emerald-400">{formattedScore}</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#0D1322] p-3.5">
              <p className="text-[9px] font-bold uppercase text-gray-500 tracking-wider">Pricing Tier</p>
              <p className="mt-1 text-sm font-black text-white">{pricing}</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#0D1322] p-3.5">
              <p className="text-[9px] font-bold uppercase text-gray-500 tracking-wider">Category</p>
              <p className="mt-1 text-sm font-black text-white">{category}</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#0D1322] p-3.5">
              <p className="text-[9px] font-bold uppercase text-gray-500 tracking-wider">Deployment</p>
              <p className="mt-1 text-xs font-bold text-white truncate">{deployment}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-800 bg-[#0D1322] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  AI Vault Quality Index
                </p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Evaluated across operational throughput, catalog reliability, and integration stability.
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400">{formattedScore}</span>
              </div>
            </div>
            {score !== null && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: barWidth }}
                />
              </div>
            )}
          </div>
        </section>

        {/* INLINE PRICE DROP & UPDATE ALERT WIDGET */}
        <section className="mt-6 bg-gradient-to-r from-[#0D1A14] to-[#0A1220] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-1 text-center sm:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest mb-2">
              🔔 Price & Feature Tracker
            </span>
            <h2 className="text-lg font-black text-white sm:text-xl">
              Get Deal Alerts & Updates for {toolName}
            </h2>
            <p className="mt-1 text-xs text-gray-400 max-w-md leading-relaxed">
              Receive instant email alerts whenever {toolName} updates its pricing model, releases new capabilities, or offers promotional discounts.
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <form onSubmit={handlePriceAlertSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                placeholder="Enter your email..."
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                className="rounded-xl border border-gray-700 bg-[#06080F] px-4 py-3 text-xs text-white placeholder:text-gray-500 outline-none focus:border-emerald-500 min-w-[240px] shadow-inner"
              />
              <button
                type="submit"
                disabled={alertStatus === "loading"}
                className="rounded-xl bg-emerald-500 px-5 py-3 text-xs font-black text-black hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/25 disabled:opacity-50 whitespace-nowrap"
              >
                {alertStatus === "loading" ? "Setting Alert..." : "Enable Alert 🔔"}
              </button>
            </form>
            {alertMsg && (
              <p className={`mt-3 text-xs font-bold text-center sm:text-left ${alertStatus === "success" ? "text-emerald-400" : "text-rose-400"}`}>
                {alertMsg}
              </p>
            )}
          </div>
        </section>

        {/* PROMPT PLAYBOOK */}
        <section className="mt-6 bg-[#0B0F19] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div>
              <span className="inline-block rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                ⚡ Ready-to-Use AI Playbook
              </span>
              <h2 className="text-base font-black text-white mt-2">
                Copy-Paste Prompts for {toolName}
              </h2>
            </div>
            <span className="text-[10px] font-bold text-gray-500">1-Click Copied into Clipboard</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {playbookPrompts.map((item, idx) => (
              <div key={idx} className="flex flex-col justify-between rounded-2xl border border-gray-800 bg-[#0D1322] p-4 shadow-sm">
                <div>
                  <h3 className="text-xs font-black text-gray-300">{item.title}</h3>
                  <p className="mt-3 text-xs font-mono text-gray-400 bg-[#06080F] p-3 rounded-xl leading-relaxed border border-gray-800/80">
                    "{item.prompt}"
                  </p>
                </div>
                <button
                  onClick={() => handleCopyPrompt(item.prompt, idx)}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-800 border border-gray-700 py-2.5 text-xs font-bold text-gray-300 transition hover:bg-gray-700 hover:text-white"
                >
                  <span>{copiedPromptIndex === idx ? "✓ Copied to Clipboard!" : "📋 Copy Prompt Template"}</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* DECISION ENGINE */}
        <section className="mt-6 bg-[#0B0F19] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Quick Decision Engine</span>
          <h2 className="text-base font-black text-white mt-1">Is {toolName} right for your stack?</h2>
          <p className="mt-1 text-xs text-gray-400">Answer 2 quick questions to calculate your team compatibility:</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#0D1322] p-4 border border-gray-800">
              <p className="text-xs font-bold text-gray-300 mb-3">1. What is your team budget?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setQuizBudget("free")}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition border ${
                    quizBudget === "free" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-[#06080F] text-gray-400 border-gray-700 hover:text-white"
                  }`}
                >
                  Free / Low Cost
                </button>
                <button
                  onClick={() => setQuizBudget("paid")}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition border ${
                    quizBudget === "paid" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-[#06080F] text-gray-400 border-gray-700 hover:text-white"
                  }`}
                >
                  Paid SaaS Budget
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-[#0D1322] p-4 border border-gray-800">
              <p className="text-xs font-bold text-gray-300 mb-3">2. Who will be using it?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setQuizTeam("solo")}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition border ${
                    quizTeam === "solo" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-[#06080F] text-gray-400 border-gray-700 hover:text-white"
                  }`}
                >
                  Solo / Founder
                </button>
                <button
                  onClick={() => setQuizTeam("team")}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition border ${
                    quizTeam === "team" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-[#06080F] text-gray-400 border-gray-700 hover:text-white"
                  }`}
                >
                  Growing Team
                </button>
              </div>
            </div>
          </div>

          {quizBudget && quizTeam && (
            <div className="mt-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-emerald-400">
                  ✓ High Match: {toolName} fits your requirements ({pricing} tier).
                </p>
                <p className="text-xs text-emerald-500/80 mt-1">
                  Great choice for {quizTeam === "solo" ? "individual fast deployment" : "team scale and cross-collaboration"}.
                </p>
              </div>
              <a
                href={destinationUrl}
                onClick={handleOutboundClick}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-black text-black hover:bg-emerald-400 shadow-md shadow-emerald-500/20 whitespace-nowrap"
              >
                Proceed ↗
              </a>
            </div>
          )}
        </section>

        {/* ABOUT SECTION */}
        <section className="mt-6 bg-[#0B0F19] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              In-Depth Overview
            </h2>
          </div>
          <h3 className="text-xl font-black text-white sm:text-2xl">
            About {toolName}
          </h3>

          <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-400">
            <p>
              <strong className="text-gray-300">{toolName}</strong> is designed to streamline critical operations within the <strong className="text-gray-300">{category.toLowerCase()}</strong> ecosystem. By leveraging targeted machine learning architectures, it eliminates repetitive manual workflows, accelerates task turnaround times, and enhances team productivity.
            </p>
            <p>
              Operated under a flexible <strong className="text-gray-300">{pricing}</strong> model, {toolName} provides instant cloud accessibility without requiring complex technical infrastructure or prolonged onboarding.
            </p>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mt-6 bg-[#0B0F19] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-base font-black text-white mb-5">
            Key Capabilities & Features
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {featuresList.map((f, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-800 bg-[#0D1322] p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black">✓</span>
                  <h3 className="text-xs font-bold text-gray-200">{f.title}</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-gray-500 pl-7">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* USE CASES & TARGET AUDIENCE */}
        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl bg-[#0B0F19] border border-gray-800 p-6 shadow-sm">
            <h2 className="text-base font-black text-white mb-4">
              Best Use Cases
            </h2>
            <ul className="space-y-3 text-xs text-gray-400">
              {useCasesList.map((u, idx) => (
                <li key={idx} className="flex items-start gap-3 rounded-xl bg-[#0D1322] border border-gray-800 p-3">
                  <span className="text-emerald-500 font-bold">→</span>
                  <span>{u}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-[#0B0F19] border border-gray-800 p-6 shadow-sm">
            <h2 className="text-base font-black text-white mb-4">
              Who Should Use {toolName}?
            </h2>
            <div className="space-y-3">
              <div className="rounded-xl border border-gray-800 bg-[#0D1322] p-3.5">
                <p className="text-xs font-bold text-gray-300">Founders & Growth Teams</p>
                <p className="text-xs text-gray-500 mt-1">Quickly scale output without hiring additional manual resources.</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-[#0D1322] p-3.5">
                <p className="text-xs font-bold text-gray-300">Specialists & Power Users</p>
                <p className="text-xs text-gray-500 mt-1">Execute high-throughput {category.toLowerCase()} tasks with high accuracy.</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-[#0D1322] p-3.5">
                <p className="text-xs font-bold text-gray-300">Operations & Agile Teams</p>
                <p className="text-xs text-gray-500 mt-1">Standardize operational pipelines and improve project turnarounds.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ROI CALCULATOR */}
        <section className="mt-6 rounded-3xl bg-gradient-to-br from-[#0B0F19] to-[#0D1322] border border-gray-800 p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <span className="inline-block rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/20 mb-3">
                ⚡ Interactive ROI Estimator
              </span>
              <h2 className="text-base font-black text-white">
                How much time can {toolName} save you?
              </h2>
              <p className="mt-1.5 text-xs text-gray-400">
                Adjust your team's weekly hours spent on {category.toLowerCase()} tasks:
              </p>

              <div className="mt-5">
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                  <span>Current manual effort:</span>
                  <span className="text-emerald-400 font-black">{weeklyHours} hrs / week</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-800 accent-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:w-80">
              <div className="rounded-2xl border border-gray-800 bg-[#06080F] p-4 text-center shadow-inner">
                <p className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Time Saved</p>
                <p className="mt-1 text-2xl font-black text-emerald-400">~{estimatedHoursSaved}h</p>
                <p className="text-[10px] text-gray-600 mt-0.5">per week</p>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-[#06080F] p-4 text-center shadow-inner">
                <p className="text-[9px] font-bold uppercase text-gray-500 tracking-widest">Est. Value</p>
                <p className="mt-1 text-2xl font-black text-emerald-400">${estimatedMonthlySavings}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">per month</p>
              </div>
            </div>
          </div>
        </section>

        {/* PROS & CONS */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/20 p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-black">✓</span>
              Key Strengths & Advantages
            </h3>
            <ul className="mt-4 space-y-3 text-xs text-emerald-100/70 font-medium">
              <li className="flex items-start gap-2.5">
                <span className="font-bold text-emerald-500">•</span>
                <span>Optimized architecture tailored for fast {category.toLowerCase()} execution.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-bold text-emerald-500">•</span>
                <span>Transparent {pricing} access model with straightforward onboarding.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-bold text-emerald-500">•</span>
                <span>High cloud availability backed by continuous service evaluation.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-amber-500/20 bg-amber-950/20 p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] text-black">!</span>
              Operational Considerations
            </h3>
            <ul className="mt-4 space-y-3 text-xs text-amber-100/70 font-medium">
              <li className="flex items-start gap-2.5">
                <span className="font-bold text-amber-500">•</span>
                <span>Advanced throughput and batch limits depend on your selected plan.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-bold text-amber-500">•</span>
                <span>Requires constant internet connectivity to communicate with cloud APIs.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* TECHNICAL SPECIFICATIONS */}
        <section className="mt-6 bg-[#0B0F19] border border-gray-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-4">
            Technical & Deployment Specifications
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-[#0D1322] border border-gray-800 p-3.5">
              <p className="text-[9px] font-bold uppercase text-gray-500">Deployment</p>
              <p className="mt-1 text-xs font-bold text-gray-300">{deployment}</p>
            </div>
            <div className="rounded-xl bg-[#0D1322] border border-gray-800 p-3.5">
              <p className="text-[9px] font-bold uppercase text-gray-500">Pricing Model</p>
              <p className="mt-1 text-xs font-bold text-gray-300">{pricing}</p>
            </div>
            <div className="rounded-xl bg-[#0D1322] border border-gray-800 p-3.5">
              <p className="text-[9px] font-bold uppercase text-gray-500">License Tier</p>
              <p className="mt-1 text-xs font-bold text-gray-300">{license}</p>
            </div>
            <div className="rounded-xl bg-[#0D1322] border border-gray-800 p-3.5">
              <p className="text-[9px] font-bold uppercase text-gray-500">Catalogue Status</p>
              <p className="mt-1 text-xs font-bold text-emerald-400">Verified Active</p>
            </div>
          </div>
        </section>

        {/* SIMILAR TOOLS */}
        {related.length > 0 && (
          <section className="mt-10">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Ecosystem Comparison</span>
                <h2 className="text-lg font-black text-white mt-1">Top Similar {category} Tools</h2>
              </div>
              <Link href={`/compare?tools=${encodeURIComponent(rawSlug)}`} className="text-xs font-bold text-gray-400 hover:text-emerald-400 transition">
                Compare All In Matrix →
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => {
                const itemSlug = String(item.slug || item.name || "");
                const compareHref = `/compare?tools=${encodeURIComponent(rawSlug)},${encodeURIComponent(itemSlug)}`;

                return (
                  <div
                    key={String(item.id ?? itemSlug)}
                    className="group flex flex-col justify-between rounded-2xl border border-gray-800 bg-[#0B0F19] p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50"
                  >
                    <Link href={`/tool/${encodeURIComponent(itemSlug)}`} className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400 text-sm">
                        {String(item.name || "AI").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-gray-200 group-hover:text-emerald-400 transition-colors">
                          {String(item.name || "AI Tool")}
                        </p>
                        <p className="text-[10px] text-gray-500 capitalize">{String(item.category || category)}</p>
                      </div>
                    </Link>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-800/80 pt-3 text-[10px]">
                      <span className="font-bold text-gray-400">{String(item.pricing_type || item.pricing || "Freemium")}</span>
                      <Link
                        href={compareHref}
                        className="font-bold text-gray-500 hover:text-emerald-400 transition"
                      >
                        Compare vs {toolName} →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* BOTTOM CTA BANNER */}
        <section className="mt-10 rounded-3xl bg-gradient-to-b from-[#0D1726] to-[#0B0F19] p-8 text-center sm:p-12 shadow-2xl border border-gray-800">
          <div className="inline-block rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-4">
            Direct Platform Access
          </div>
          <h2 className="text-2xl font-black text-white sm:text-3xl">Get Started with {toolName}</h2>
          <p className="mx-auto mt-3 max-w-md text-xs text-gray-400 leading-relaxed">
            Explore pricing tiers, interactive demonstrations, and official documentation directly on their portal.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={destinationUrl}
              onClick={handleOutboundClick}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-8 py-3.5 text-xs font-black text-black transition hover:bg-emerald-400 shadow-lg shadow-emerald-500/25"
            >
              VISIT OFFICIAL PORTAL ↗
            </a>
            <Link
              href={`/compare?tools=${encodeURIComponent(rawSlug)}`}
              className="inline-flex items-center justify-center rounded-xl border border-gray-700 bg-gray-800 px-6 py-3.5 text-xs font-bold text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              ⚖️ Compare Tool
            </Link>
          </div>
        </section>
      </div>

      {/* STICKY BOTTOM DOCK */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-800 bg-[#06080F]/95 backdrop-blur-xl px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.4)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400 text-sm">
              {toolName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">{toolName}</p>
              <p className="text-[10px] text-gray-500">{category} • {pricing}</p>
            </div>
          </div>

          <div className="flex w-full sm:w-auto items-center justify-end gap-3">
            <Link
              href={`/compare?tools=${encodeURIComponent(rawSlug)}`}
              className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-xs font-bold text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              ⚖️ Compare
            </Link>

            <a
              href={destinationUrl}
              onClick={handleOutboundClick}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial rounded-xl bg-emerald-500 px-6 py-2.5 text-center text-xs font-black text-black shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition"
            >
              OPEN PLATFORM ↗
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
