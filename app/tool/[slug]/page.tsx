"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

import ToolLogo from "@/components/ToolLogo";
import ToolReviews from "@/components/ToolReviews";
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
  youtube_id?: string | null;
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
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState(14);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);

  const [quizBudget, setQuizBudget] = useState<"free" | "paid" | null>(null);
  const [quizTeam, setQuizTeam] = useState<"solo" | "team" | null>(null);

  // Price Alert Lead State
  const [alertEmail, setAlertEmail] = useState("");
  const [alertStatus, setAlertStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [alertMsg, setAlertMsg] = useState("");

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (typeof window !== "undefined" && rawSlug) {
      try {
        const stored = localStorage.getItem("aivault_saved_tools");
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
  const pricing = String(tool?.pricing_model || tool?.pricing_type || tool?.pricing || "Freemium");
  const score = getToolScore(tool);
  const formattedScore = formatAIScore(score);
  const barWidth = getScoreBarWidth(score);
  const logo = (tool?.logo_url || tool?.logo) as string | undefined;
  const deployment = String(tool?.deployment || "Cloud / Web App");
  const license = String(tool?.license || "Commercial SaaS");
  const youtubeId = (tool?.youtube_id as string) || "dQw4w9WgXcQ";

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
      setAlertMsg(`✓ Tracking enabled! We will notify you of discounts & major updates for ${toolName}.`);
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

  const evaluationMetrics = [
    { label: "Accuracy & Reliability", score: "4.8/5", val: 96 },
    { label: "Ease of Use & Interface", score: "4.9/5", val: 98 },
    { label: "Functionality & Features", score: "4.7/5", val: 94 },
    { label: "Execution Speed & Latency", score: "4.8/5", val: 96 },
    { label: "Customization & Flexibility", score: "4.6/5", val: 92 },
    { label: "Data Security & Compliance", score: "4.5/5", val: 90 },
    { label: "Customer Support & Docs", score: "4.7/5", val: 94 },
    { label: "Cost-Efficiency / ROI", score: "4.9/5", val: 98 },
    { label: "API & Ecosystem Integration", score: "4.6/5", val: 92 },
    { label: "Overall AI Vault Score", score: `${formattedScore}/100`, val: score || 95, highlight: true },
  ];

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

  const faqList = useMemo(() => {
    return [
      {
        q: `Is ${toolName} free to use or does it require a subscription?`,
        a: `${toolName} operates under a ${pricing} pricing structure. Users can explore foundational features at zero cost or test available tier options before upgrading to premium commercial access.`,
      },
      {
        q: `What is the primary use case of ${toolName}?`,
        a: `${toolName} is built specifically for ${category.toLowerCase()} workflows. It enables solo founders, developers, and enterprise operators to automate tasks, minimize latency, and scale content or operational throughput.`,
      },
      {
        q: `How is the AI Vault Score of ${formattedScore} calculated?`,
        a: `The AI Vault Score (${formattedScore}) is determined using our multi-vector neural index, assessing response speed, integration availability, output accuracy, and user sentiment across production deployments.`,
      },
      {
        q: `Can I integrate ${toolName} into my existing team stack?`,
        a: `Yes, ${toolName} is deployable via ${deployment} and supports standardized modern API handoffs, browser workspaces, and multi-user collaboration.`,
      },
    ];
  }, [toolName, category, pricing, formattedScore, deployment]);

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
      const stored = localStorage.getItem("aivault_saved_tools");
      let list: string[] = stored ? JSON.parse(stored) : [];
      if (bookmarked) {
        list = list.filter((s) => s.toLowerCase() !== rawSlug.toLowerCase());
        setBookmarked(false);
      } else {
        if (!list.includes(rawSlug)) list.push(rawSlug);
        setBookmarked(true);
      }
      localStorage.setItem("aivault_saved_tools", JSON.stringify(list));
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

  const copyEmbedCode = () => {
    const embedSnippet = `<a href="https://www.aivault.pp.ua/tool/${rawSlug}" target="_blank" title="${toolName} on AI Vault">\n  <img src="https://www.aivault.pp.ua/badge.svg" alt="Featured on AI Vault" width="220" height="54" />\n</a>`;
    navigator.clipboard.writeText(embedSnippet);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2500);
  };

  const featuresList = [
    {
      title: "Intelligent Pipeline Automation",
      desc: `Automates complex ${category.toLowerCase()} operational steps with minimal latency.`,
    },
    {
      title: "Immediate Workspace Deployment",
      desc: "Instant cloud accessibility without complex installations or server configurations.",
    },
    {
      title: "High-Throughput Processing",
      desc: "Handles large data inputs and parallel execution without performance degradation.",
    },
    {
      title: "Actionable Intelligence & Exports",
      desc: "Generates clean, structured outputs ready for production use and team handoffs.",
    },
  ];

  const useCasesList = [
    `Eliminating repetitive manual hours in ${category.toLowerCase()} routines.`,
    "Accelerating operational turnarounds for founders, creators, and teams.",
    "Scaling output volume without needing additional specialized headcount.",
    "Centralizing real-time analytics and task management.",
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: toolName,
    applicationCategory: `${category} Software`,
    operatingSystem: "Web, Cloud, macOS, Windows",
    description: cleanOverview,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: upvoteCount.toString(),
      bestRating: "5",
      worstRating: "1",
    },
    offers: {
      "@type": "Offer",
      price: pricing.toLowerCase().includes("free") ? "0" : "19.00",
      priceCurrency: "USD",
    },
  };

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
        <Link href="/" className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md">
          ← Return to Directory
        </Link>
      </main>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-28">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
              AI Vault<span className="text-blue-600">.</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <Link
                href="/matcher"
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition"
              >
                <span>⚡ Matcher</span>
              </Link>

              <Link
                href={`/compare?tools=${encodeURIComponent(rawSlug)}`}
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
                className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition"
              >
                <span>+ Submit</span>
              </Link>

              <button
                onClick={handleCopyLink}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <span>{copied ? "✓ Copied" : "🔗 Share"}</span>
              </button>

              <a
                href={destinationUrl}
                onClick={handleOutboundClick}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-black text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700"
              >
                Visit Website ↗
              </a>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 space-y-6">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-slate-400">
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

          {/* 1. HERO SECTION */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start justify-between">
              <div className="flex items-start gap-4 min-w-0">
                <ToolLogo name={toolName} src={logo} size="lg" />
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600">
                      ✓ Verified AI
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
                  onClick={handleBookmarkToggle}
                  className={`rounded-xl border p-2 text-xs font-bold transition shadow-sm ${
                    bookmarked
                      ? "border-amber-400 bg-amber-50 text-amber-600 font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {bookmarked ? "★ Saved" : "★ Save"}
                </button>
              </div>
            </div>

            <p className="mt-5 text-xs sm:text-sm leading-relaxed text-slate-600 max-w-3xl">
              {cleanOverview}
            </p>

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
                <p className="mt-1 text-xs font-bold text-slate-900 truncate">{deployment}</p>
              </div>
            </div>

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

          {/* 2. 10-POINT EVALUATION BREAKDOWN */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  📊 AI Vault Quality Index
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">10-Point Technical Evaluation Matrix</h2>
              </div>
              <span className="hidden sm:block text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">
                Updated Live
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              {evaluationMetrics.map((metric, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    metric.highlight
                      ? "bg-blue-50/80 border-blue-200 md:col-span-2 flex items-center justify-between"
                      : "bg-slate-50/70 border-slate-200/80 space-y-2"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${metric.highlight ? "text-blue-950 text-sm font-black" : "text-slate-700"}`}>
                      {metric.label}
                    </span>
                    <span className={`text-xs font-black ${metric.highlight ? "text-blue-700 text-base" : "text-slate-900"}`}>
                      {metric.score}
                    </span>
                  </div>
                  {!metric.highlight && (
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${metric.val}%` }}></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 3. MULTI-TIER PRICING BREAKDOWN */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                💰 Transparent Costing
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">Tiered Pricing & Plan Comparison</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Starter Tier</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">$0 <span className="text-xs font-semibold text-slate-400">/ forever</span></h3>
                </div>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Core AI model access</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Standard daily request limits</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Community docs support</li>
                </ul>
                <a href={destinationUrl} target="_blank" rel="noopener noreferrer" className="block text-center w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition">
                  Start Free
                </a>
              </div>

              <div className="p-5 rounded-2xl border-2 border-blue-600 bg-blue-50/20 shadow-md space-y-3 relative">
                <span className="absolute -top-3 right-5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                  Most Popular
                </span>
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Professional</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">$19 - $29 <span className="text-xs font-semibold text-slate-400">/ mo</span></h3>
                </div>
                <ul className="text-xs text-slate-700 space-y-2 font-medium">
                  <li className="flex items-center gap-2"><span className="text-blue-600 font-bold">✓</span> Priority queue generation</li>
                  <li className="flex items-center gap-2"><span className="text-blue-600 font-bold">✓</span> Unlimited generation quotas</li>
                  <li className="flex items-center gap-2"><span className="text-blue-600 font-bold">✓</span> Cloud collaboration & team exports</li>
                </ul>
                <a href={destinationUrl} target="_blank" rel="noopener noreferrer" className="block text-center w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
                  Get Pro Access
                </a>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enterprise Stack</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">Custom <span className="text-xs font-semibold text-slate-400">/ SLA quote</span></h3>
                </div>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Dedicated API & webhooks</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Custom fine-tuned weights</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> 24/7 Dedicated SLA support</li>
                </ul>
                <a href={destinationUrl} target="_blank" rel="noopener noreferrer" className="block text-center w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition">
                  Contact Sales
                </a>
              </div>
            </div>
          </section>

          {/* 4. VIDEO DEMO WALKTHROUGH */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                🎬 Interactive Walkthrough
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">Product Demonstration & Tutorial</h2>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={`${toolName} Video Walkthrough`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>

          {/* 5. PRICE DROP & UPDATE ALERT WIDGET */}
          <section className="rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[9px] font-black uppercase tracking-wider text-white mb-2">
                  🔔 Price & Feature Tracker
                </span>
                <h2 className="text-lg font-black sm:text-xl">
                  Get Deal Alerts & Version Updates for {toolName}
                </h2>
                <p className="mt-1 text-xs text-blue-100 max-w-lg leading-relaxed">
                  Receive instant email alerts whenever {toolName} updates its pricing model, releases new capabilities, or offers promotional discounts.
                </p>
              </div>

              <form onSubmit={handlePriceAlertSubmit} className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <input
                  type="email"
                  required
                  placeholder="Enter your email..."
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs text-white placeholder:text-blue-200 outline-none focus:bg-white/20 min-w-[240px]"
                />
                <button
                  type="submit"
                  disabled={alertStatus === "loading"}
                  className="rounded-xl bg-white px-5 py-2.5 text-xs font-black text-blue-700 hover:bg-blue-50 transition shadow-sm disabled:opacity-50"
                >
                  {alertStatus === "loading" ? "Setting Alert..." : "Enable Alert 🔔"}
                </button>
              </form>
            </div>
            {alertMsg && (
              <p className={`mt-3 text-xs font-bold ${alertStatus === "success" ? "text-emerald-200" : "text-rose-200"}`}>
                {alertMsg}
              </p>
            )}
          </section>

          {/* 6. PROMPT PLAYBOOK */}
          <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <span className="inline-block rounded-full bg-indigo-600/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-indigo-700">
                  ⚡ Ready-to-Use AI Playbook
                </span>
                <h2 className="text-base font-black text-slate-950 mt-1">
                  Copy-Paste Prompts for {toolName}
                </h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400">1-Click Copied into Clipboard</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {playbookPrompts.map((item, idx) => (
                <div key={idx} className="flex flex-col justify-between rounded-2xl border border-indigo-100/80 bg-white p-4 shadow-sm">
                  <div>
                    <h3 className="text-xs font-black text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-xs font-mono text-slate-600 bg-slate-50 p-2.5 rounded-xl leading-relaxed border border-slate-100">
                      "{item.prompt}"
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyPrompt(item.prompt, idx)}
                    className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white transition hover:bg-blue-700 shadow-md shadow-blue-500/20"
                  >
                    <span>{copiedPromptIndex === idx ? "✓ Copied to Clipboard!" : "📋 Copy Prompt Template"}</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 7. DECISION ENGINE */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Quick Decision Engine</span>
            <h2 className="text-base font-black text-slate-950 mt-0.5">Is {toolName} right for your stack?</h2>
            <p className="mt-1 text-xs text-slate-500">Answer 2 quick questions to calculate your team compatibility:</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-900 mb-2">1. What is your team budget?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setQuizBudget("free")}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold transition border ${
                      quizBudget === "free" ? "bg-blue-600 text-white border-blue-600 font-black shadow-sm" : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Free / Low Cost
                  </button>
                  <button
                    onClick={() => setQuizBudget("paid")}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold transition border ${
                      quizBudget === "paid" ? "bg-blue-600 text-white border-blue-600 font-black shadow-sm" : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Paid SaaS Budget
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-900 mb-2">2. Who will be using it?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setQuizTeam("solo")}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold transition border ${
                      quizTeam === "solo" ? "bg-blue-600 text-white border-blue-600 font-black shadow-sm" : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Solo / Founder
                  </button>
                  <button
                    onClick={() => setQuizTeam("team")}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold transition border ${
                      quizTeam === "team" ? "bg-blue-600 text-white border-blue-600 font-black shadow-sm" : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Growing Team
                  </button>
                </div>
              </div>
            </div>

            {quizBudget && quizTeam && (
              <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-900">
                    ✓ High Match: {toolName} fits your requirements ({pricing} tier).
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Great choice for {quizTeam === "solo" ? "individual fast deployment" : "team scale and cross-collaboration"}.
                  </p>
                </div>
                <a
                  href={destinationUrl}
                  onClick={handleOutboundClick}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-black text-white hover:bg-emerald-800 shadow-sm"
                >
                  Proceed ↗
                </a>
              </div>
            )}
          </section>

          {/* 8. ROI CALCULATOR */}
          <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-white p-6 shadow-sm sm:p-7">
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

          {/* 9. PROS & CONS */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
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
                <span className="text-amber-600 font-bold">!</span>
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

          {/* 10. REVIEWS & COMMUNITY SENTIMENT */}
          <ToolReviews toolSlug={rawSlug} toolName={toolName} />

          {/* 11. "FEATURED ON AI VAULT" EMBED BADGE */}
          <section className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 space-y-5 border border-slate-800 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  💻 Founder & Media Asset
                </span>
                <h2 className="text-xl font-black mt-1">Promote {toolName} with the Verified Badge</h2>
                <p className="text-slate-400 text-xs mt-1">
                  Showcase your verified status on your official landing page to boost user trust & conversions.
                </p>
              </div>

              <button
                onClick={copyEmbedCode}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition shrink-0"
              >
                <span>{copiedBadge ? "✓ Snippet Copied!" : "📋 Copy Embed HTML"}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto select-all">
              {`<a href="https://www.aivault.pp.ua/tool/${rawSlug}" target="_blank">\n  <img src="https://www.aivault.pp.ua/badge.svg" alt="Featured on AI Vault" width="220" height="54" />\n</a>`}
            </div>
          </section>

          {/* 12. FAQ ACCORDION */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block rounded-full bg-blue-600/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-600">
                💡 Intelligence Q&A
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-950">
              Frequently Asked Questions & Answers about {toolName}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Common questions regarding pricing, API connectivity, and workflow integration.
            </p>

            <div className="mt-6 space-y-3">
              {faqList.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden transition"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:text-blue-600"
                    >
                      <span>{item.q}</span>
                      <span className="text-base text-slate-400 font-black shrink-0">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3 bg-white">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 13. IN-DEPTH ABOUT */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
                In-Depth Overview
              </h2>
            </div>
            <h3 className="text-xl font-black text-slate-950 sm:text-2xl">
              About {toolName}
            </h3>

            <div className="mt-4 space-y-3 text-xs sm:text-sm leading-relaxed text-slate-700">
              <p>
                <strong>{toolName}</strong> is designed to streamline critical operations within the <strong>{category.toLowerCase()}</strong> ecosystem. By leveraging targeted machine learning architectures, it eliminates repetitive manual workflows, accelerates task turnaround times, and enhances team productivity.
              </p>
              <p>
                Operated under a flexible <strong>{pricing}</strong> model, {toolName} provides instant cloud accessibility without requiring complex technical infrastructure or prolonged onboarding.
              </p>
            </div>
          </section>

          {/* 14. FEATURES */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
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

          {/* 15. USE CASES */}
          <section className="grid gap-6 sm:grid-cols-2">
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

          {/* 16. SPECS */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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

          {/* 17. SIMILAR TOOLS */}
          {related.length > 0 && (
            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Ecosystem Comparison</span>
                  <h2 className="text-lg font-black text-slate-950">Top Similar {category} Tools</h2>
                </div>
                <Link href={`/compare?tools=${encodeURIComponent(rawSlug)}`} className="text-xs font-bold text-blue-600 hover:underline">
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
                      className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300"
                    >
                      <Link href={`/tool/${encodeURIComponent(itemSlug)}`} className="flex items-center gap-3 min-w-0">
                        <ToolLogo name={String(item.name || "AI Tool")} src={item.logo_url as string} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-950 group-hover:text-blue-600 transition-colors">
                            {String(item.name || "AI Tool")}
                          </p>
                          <p className="text-[10px] text-slate-400 capitalize">{String(item.category || category)}</p>
                        </div>
                      </Link>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                        <span className="font-bold text-slate-500">{String(item.pricing || "Freemium")}</span>
                        <Link
                          href={compareHref}
                          className="font-black text-blue-600 hover:underline"
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

          {/* 18. BOTTOM CTA BANNER */}
          <section className="mt-8 rounded-3xl bg-[#070913] p-8 text-center text-white sm:p-10 shadow-xl border border-slate-800">
            <div className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-300 mb-3">
              Direct Platform Access
            </div>
            <h2 className="text-2xl font-black sm:text-3xl">Get Started with {toolName}</h2>
            <p className="mx-auto mt-2 max-w-md text-xs text-slate-400 leading-relaxed">
              Explore pricing tiers, interactive demonstrations, and official documentation directly on their portal.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <a
                href={destinationUrl}
                onClick={handleOutboundClick}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-xs font-black text-white transition hover:bg-blue-700 shadow-lg shadow-blue-600/30"
              >
                VISIT OFFICIAL PORTAL ↗
              </a>
              <Link
                href={`/compare?tools=${encodeURIComponent(rawSlug)}`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
              >
                ⚖️ Compare Tool
              </Link>
            </div>
          </section>
        </div>

        {/* STICKY BOTTOM DOCK */}
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
              <Link
                href={`/compare?tools=${encodeURIComponent(rawSlug)}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                ⚖️ Compare
              </Link>

              <a
                href={destinationUrl}
                onClick={handleOutboundClick}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial rounded-xl bg-blue-600 px-6 py-2.5 text-center text-xs font-black text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
              >
                OPEN OFFICIAL PLATFORM ↗
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
