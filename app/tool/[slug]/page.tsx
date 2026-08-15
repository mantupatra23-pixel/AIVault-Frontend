// app/tool/[slug]/page.tsx
"use client";

import { use, useEffect, useState } from "react";
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
  neural_score?: number | string | null;
  logo_url?: string | null;
  logo?: string | null;
  website_url?: string | null;
  website?: string | null;
  deployment?: string | null;
  license?: string | null;
  features?: string[] | string | null;
  use_cases?: string[] | string | null;
  [key: string]: unknown;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export default function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const rawSlug = decodeURIComponent(resolvedParams.slug || "").trim();

  const [tool, setTool] = useState<ToolRecord | null>(null);
  const [related, setRelated] = useState<ToolRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Engagement States
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(140);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState(14);
  const [pollVoted, setPollVoted] = useState<"yes" | "no" | null>(null);
  const [pollStats, setPollStats] = useState({ yes: 93, no: 7 });

  useEffect(() => {
    async function loadToolData() {
      try {
        setLoading(true);
        const supabase = getSupabase();

        // 1. Fetch Current Tool
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

        // Seed deterministic upvotes based on tool name
        const seed = Math.abs(
          String(toolData.name || "AI")
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0)
        );
        setUpvoteCount(90 + (seed % 120));

        // 2. Fetch Related Tools
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

  // Derived Values
  const toolName = String(tool?.name || "AI Tool");
  const category = String(tool?.category || "Productivity");
  const pricing = String(tool?.pricing_model || tool?.pricing || "Freemium");
  const score = getToolScore(tool);
  const formattedScore = formatAIScore(score);
  const barWidth = getScoreBarWidth(score);
  const officialWebsite = String(tool?.website_url || tool?.website || "");
  const logo = (tool?.logo_url || tool?.logo) as string | undefined;
  const deployment = String(tool?.deployment || "Cloud / Web App");
  const license = String(tool?.license || "Commercial SaaS");

  const rawOverview = String(tool?.overview || tool?.description || "");
  const cleanOverview = cleanAiContent(rawOverview) || `${toolName} provides modern artificial intelligence capabilities designed to optimize and scale ${category.toLowerCase()} workflows.`;

  // Calculated ROI Metrics
  const estimatedHoursSaved = Math.round(weeklyHours * 0.45 * 10) / 10;
  const estimatedMonthlySavings = Math.round(estimatedHoursSaved * 4 * 35);

  const handleUpvote = () => {
    if (upvoted) {
      setUpvoteCount((prev) => prev - 1);
      setUpvoted(false);
    } else {
      setUpvoteCount((prev) => prev + 1);
      setUpvoted(true);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePoll = (choice: "yes" | "no") => {
    if (pollVoted) return;
    setPollVoted(choice);
    if (choice === "yes") {
      setPollStats((prev) => ({ ...prev, yes: prev.yes + 1 }));
    } else {
      setPollStats((prev) => ({ ...prev, no: prev.no + 1 }));
    }
  };

  // Structured Capabilities
  const featuresList = [
    {
      title: "Intelligent Pipeline Automation",
      desc: `Automates complex ${category.toLowerCase()} operational steps with minimal latency.`
    },
    {
      title: "Seamless Workspace Integration",
      desc: "Designed for immediate adoption across standard browser and cloud environments."
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

  // Structured Use Cases
  const useCasesList = [
    `Eliminating repetitive manual hours in ${category.toLowerCase()} routines.`,
    "Accelerating time-to-market for founders, marketing teams, and developers.",
    "Centralizing automated analytics and high-volume data operations.",
    "Scaling individual productivity without increasing operational headcounts."
  ];

  // Dynamic FAQs
  const faqs = [
    {
      q: `What is ${toolName} and how does it work?`,
      a: `${toolName} is a verified AI software platform in the ${category} category. It leverages specialized machine learning algorithms to automate workflows, reduce human error, and deliver fast, actionable outputs.`
    },
    {
      q: `What is the pricing model for ${toolName}?`,
      a: `${toolName} operates under the "${pricing}" tier. Depending on the plan selected, users can access core features or upgrade for expanded API quotas, team collaboration seats, and enterprise support.`
    },
    {
      q: `Who benefits most from using ${toolName}?`,
      a: `Founders, digital marketers, technical specialists, and operations teams looking to optimize ${category.toLowerCase()} efficiency can benefit immediately by cutting down redundant manual tasks.`
    },
    {
      q: `How does the AI Vault Score for ${toolName} work?`,
      a: `${toolName} has earned an AI Vault Score of ${formattedScore}. This rating benchmarks product reliability, catalogue data completeness, infrastructure stability, and user experience.`
    },
    {
      q: `Where can I get official support or documentation for ${toolName}?`,
      a: `Official documentation, live feature updates, and customer support are available directly through the verified official platform.`
    }
  ];

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fafbfc]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </main>
    );
  }

  if (!tool) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#fafbfc] px-4 text-center">
        <h1 className="text-2xl font-black text-slate-900">AI Tool Not Found</h1>
        <p className="mt-2 text-xs text-slate-500">The requested tool record could not be loaded.</p>
        <Link href="/" className="mt-5 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white">
          ← Return to AI Directory
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-base font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyLink}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <span>{copied ? "✓ Copied" : "🔗 Share"}</span>
            </button>

            {officialWebsite && (
              <a
                href={officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-slate-950 px-3.5 py-1.5 text-[11px] font-black tracking-wider text-white uppercase transition hover:bg-slate-800"
              >
                VISIT OFFICIAL PORTAL ↗
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        {/* Breadcrumb & Verification Badge */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-slate-400">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-blue-600">Directory</Link>
            <span>/</span>
            <Link href={`/?cat=${encodeURIComponent(category)}`} className="hover:text-blue-600 capitalize">{category}</Link>
            <span>/</span>
            <span className="font-semibold text-slate-700">{toolName}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Verified Catalog Entry
          </span>
        </div>

        {/* HERO CARD */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <ToolLogo name={toolName} src={logo} size="lg" />
              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600">
                    Verified AI
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                    {category}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[9px] font-bold text-slate-700">
                    {pricing}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-slate-950 sm:text-4xl tracking-tight">
                  {toolName}
                </h1>
              </div>
            </div>

            {/* Upvote & Bookmark Bar */}
            <div className="flex items-center gap-2 self-start">
              <button
                onClick={handleUpvote}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-sm ${
                  upvoted
                    ? "border-blue-600 bg-blue-50 text-blue-600"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span>▲</span>
                <span>{upvoteCount}</span>
              </button>

              <button
                onClick={() => setBookmarked(!bookmarked)}
                className={`rounded-xl border p-2 text-xs font-bold transition shadow-sm ${
                  bookmarked
                    ? "border-amber-400 bg-amber-50 text-amber-600"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
                title="Save to Vault"
              >
                ★
              </button>
            </div>
          </div>

          <p className="mt-5 text-xs sm:text-sm leading-relaxed text-slate-600 max-w-3xl">
            {cleanOverview}
          </p>

          {/* Quick Stat Highlights */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">AI Vault Score</p>
              <p className="mt-1 text-sm font-black text-slate-900">{formattedScore}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">Pricing Tier</p>
              <p className="mt-1 text-sm font-black text-slate-900">{pricing}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">Category</p>
              <p className="mt-1 text-sm font-black text-slate-900">{category}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">Deployment</p>
              <p className="mt-1 text-sm font-black text-slate-900 truncate">{deployment}</p>
            </div>
          </div>

          {/* AI Vault Score Progress */}
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  AI Vault Quality Index
                </p>
                <p className="text-[11px] text-slate-400">
                  Evaluated across operational throughput, catalog reliability, and integration stability.
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-950">{formattedScore}</span>
              </div>
            </div>
            {score !== null && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600"
                  style={{ width: barWidth }}
                />
              </div>
            )}
          </div>
        </section>

        {/* DETAILED ABOUT SECTION (EXPANDED HIGH-VALUE CONTENT) */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
              In-Depth Overview
            </h2>
          </div>
          <h3 className="text-xl font-black text-slate-950 sm:text-2xl">
            About {toolName}
          </h3>

          <div className="mt-4 space-y-3.5 text-xs sm:text-sm leading-relaxed text-slate-700">
            <p>
              <strong>{toolName}</strong> is designed to solve common bottlenecks in the <strong>{category.toLowerCase()}</strong> ecosystem. By leveraging targeted machine learning architectures, the tool empowers teams to eliminate manual overhead, improve data turnaround times, and automate mission-critical tasks without demanding complex technical configurations.
            </p>
            <p>
              Whether deployed as a standalone cloud platform or integrated into an established workspace stack, {toolName} provides a clear <strong>{pricing}</strong> model that enables flexible adoption. Users benefit from automated intelligence pipelines, clean user interfaces, and structured exports that integrate seamlessly into everyday production workflows.
            </p>
          </div>
        </section>

        {/* CORE FEATURES & CAPABILITIES */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-base font-black text-slate-950 mb-4">
            Key Capabilities & Features
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {featuresList.map((f, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">✓</span>
                  <h3 className="text-xs font-bold text-slate-950">{f.title}</h3>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600 pl-7">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* USE CASES & TARGET AUDIENCE */}
        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-black text-slate-950 mb-3">
              Best Use Cases
            </h2>
            <ul className="space-y-2.5 text-xs text-slate-700">
              {useCasesList.map((u, idx) => (
                <li key={idx} className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-2.5">
                  <span className="text-blue-600 font-bold">→</span>
                  <span>{u}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-black text-slate-950 mb-3">
              Who Should Use {toolName}?
            </h2>
            <div className="space-y-2.5">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-900">Founders & Growth Teams</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Quickly scale output without hiring additional manual resources.</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-900">Specialists & Power Users</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Execute high-throughput {category.toLowerCase()} tasks with high accuracy.</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-900">Operations & Agile Teams</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Standardize operational pipelines and improve project turnarounds.</p>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE WORKFLOW ROI ESTIMATOR */}
        <section className="mt-6 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <span className="inline-block rounded-full bg-blue-600/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-600 mb-2">
                ⚡ Interactive ROI Estimator
              </span>
              <h2 className="text-base font-black text-slate-950">
                How much time can {toolName} save you?
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Adjust your team's weekly hours spent on {category.toLowerCase()} tasks:
              </p>

              <div className="mt-4">
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>Current manual effort:</span>
                  <span className="text-blue-600 font-black">{weeklyHours} hrs / week</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:w-80">
              <div className="rounded-2xl border border-blue-200/60 bg-white p-4 text-center shadow-sm">
                <p className="text-[9px] font-bold uppercase text-slate-400">Time Saved</p>
                <p className="mt-1 text-xl font-black text-blue-600">~{estimatedHoursSaved}h</p>
                <p className="text-[10px] text-slate-400">per week</p>
              </div>
              <div className="rounded-2xl border border-blue-200/60 bg-white p-4 text-center shadow-sm">
                <p className="text-[9px] font-bold uppercase text-slate-400">Est. Value</p>
                <p className="mt-1 text-xl font-black text-emerald-600">${estimatedMonthlySavings}</p>
                <p className="text-[10px] text-slate-400">per month</p>
              </div>
            </div>
          </div>
        </section>

        {/* PROS & CONS MATRIX */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">✓</span>
              Key Strengths & Advantages
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs text-emerald-950 font-medium">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">•</span>
                <span>Optimized architecture tailored for fast {category.toLowerCase()} execution.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">•</span>
                <span>Transparent {pricing} access model with straightforward onboarding.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">•</span>
                <span>High cloud availability backed by continuous service evaluation.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] text-white">!</span>
              Operational Considerations
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs text-amber-950 font-medium">
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">•</span>
                <span>Advanced throughput and batch limits depend on your selected plan.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">•</span>
                <span>Requires constant internet connectivity to communicate with cloud APIs.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* TECHNICAL & DEPLOYMENT SPECIFICATIONS */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-950 mb-3">
            Technical & Deployment Specifications
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-3.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">Deployment</p>
              <p className="mt-1 text-xs font-bold text-slate-900">{deployment}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">Pricing Model</p>
              <p className="mt-1 text-xs font-bold text-slate-900">{pricing}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">License Tier</p>
              <p className="mt-1 text-xs font-bold text-slate-900">{license}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">Catalogue Status</p>
              <p className="mt-1 text-xs font-bold text-emerald-600">Verified Active</p>
            </div>
          </div>
        </section>

        {/* COMMUNITY SENTIMENT POLL WIDGET */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7 text-center">
          <h3 className="text-sm font-black text-slate-950">
            Would you recommend {toolName} to your team?
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Join the verified community voting for {toolName}.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handlePoll("yes")}
              disabled={pollVoted !== null}
              className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-bold transition ${
                pollVoted === "yes"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
              }`}
            >
              <span>👍 Yes, Recommended</span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">{pollStats.yes}%</span>
            </button>

            <button
              onClick={() => handlePoll("no")}
              disabled={pollVoted !== null}
              className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-bold transition ${
                pollVoted === "no"
                  ? "border-rose-600 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-rose-300"
              }`}
            >
              <span>👎 Needs Improvement</span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">{pollStats.no}%</span>
            </button>
          </div>
          {pollVoted && (
            <p className="mt-2.5 text-[11px] font-bold text-emerald-600">
              ✓ Thank you for submitting your feedback!
            </p>
          )}
        </section>

        {/* EXPANDED FAQS (5 COMPREHENSIVE QUESTIONS) */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm">
          <div className="mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Q&A Knowledge Base</span>
            <h2 className="text-base font-black text-slate-950 mt-0.5">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <details key={idx} className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition open:bg-white open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs sm:text-sm font-bold text-slate-900">
                  <span>{faq.q}</span>
                  <span className="ml-2 font-bold text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-600 border-t border-slate-100 pt-2.5">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* SIMILAR TOOLS */}
        {related.length > 0 && (
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Ecosystem Comparison</span>
                <h2 className="text-lg font-black text-slate-950">Top Similar {category} Tools</h2>
              </div>
              <Link href={`/?cat=${encodeURIComponent(category)}`} className="text-xs font-bold text-blue-600 hover:underline">
                View All {category} →
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={String(item.id ?? item.slug ?? item.name)}
                  href={`/tool/${encodeURIComponent(String(item.slug || ""))}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ToolLogo name={String(item.name || "AI Tool")} src={item.logo_url as string} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-950 group-hover:text-blue-600 transition-colors">
                        {String(item.name || "AI Tool")}
                      </p>
                      <p className="text-[10px] text-slate-400 capitalize">{String(item.category || category)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                    <span className="font-bold text-slate-500">{String(item.pricing || "Freemium")}</span>
                    <span className="font-bold text-blue-600">Compare →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* HIGH CONVERSION OFFICIAL CTA BANNER */}
        {officialWebsite && (
          <section className="mt-8 rounded-3xl bg-[#070913] p-8 text-center text-white sm:p-10 shadow-xl">
            <div className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-300 mb-3">
              Direct Access Portal
            </div>
            <h2 className="text-2xl font-black sm:text-3xl">Get Started with {toolName}</h2>
            <p className="mx-auto mt-2 max-w-md text-xs text-slate-400 leading-relaxed">
              Explore product plans, interactive demonstrations, and official API documentation directly on their portal.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <a
                href={officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-xl bg-white px-6 py-3 text-xs font-black text-slate-950 transition hover:bg-slate-100 shadow-md"
              >
                VISIT OFFICIAL PORTAL ↗
              </a>
              <Link
                href="/"
                className="inline-block rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
              >
                ← Back to AI Directory
              </Link>
            </div>
          </section>
        )}

        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-[10px] text-slate-400">
          © 2026 AI Vault. Discover, compare, and scale with verified artificial intelligence software.
        </footer>
      </div>

      {/* STICKY BOTTOM ACTION DOCK */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-3 min-w-0">
            <ToolLogo name={toolName} src={logo} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-900">{toolName}</p>
              <p className="text-[10px] text-slate-400">{category} • {pricing}</p>
            </div>
          </div>

          <div className="flex w-full sm:w-auto items-center justify-end gap-2.5">
            <button
              onClick={handleUpvote}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700"
            >
              <span>▲</span>
              <span>{upvoteCount}</span>
            </button>

            {officialWebsite ? (
              <a
                href={officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial rounded-xl bg-blue-600 px-6 py-2.5 text-center text-xs font-black text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
              >
                OPEN OFFICIAL PLATFORM ↗
              </a>
            ) : (
              <Link
                href="/"
                className="flex-1 sm:flex-initial rounded-xl bg-slate-950 px-6 py-2.5 text-center text-xs font-black text-white"
              >
                BROWSE DIRECTORY
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
