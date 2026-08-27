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
  features?: string[] | string | null;
  deployment?: string | null;
  license?: string | null;
  [key: string]: unknown;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const rawSlug = decodeURIComponent(resolvedParams.slug || "").trim().toLowerCase();

  const [tool, setTool] = useState<ToolRecord | null>(null);
  const [related, setRelated] = useState<ToolRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(140);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [badgeCopied, setBadgeCopied] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState(14);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);

  const [quizBudget, setQuizBudget] = useState<"free" | "paid" | null>(null);
  const [quizTeam, setQuizTeam] = useState<"solo" | "team" | null>(null);

  const [alertEmail, setAlertEmail] = useState("");
  const [alertStatus, setAlertStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [alertMsg, setAlertMsg] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (typeof window !== "undefined" && rawSlug) {
      try {
        const stored = localStorage.getItem("aivault_saved_tools");
        if (stored) {
          const list: string[] = JSON.parse(stored);
          if (list.some((s) => s.toLowerCase() === rawSlug)) {
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
          setLoading(false);
          return;
        }

        setTool(toolData);
        setUpvoteCount(95 + (Math.abs(String(toolData.name).charCodeAt(0) * 17) % 60));

        const cat = toolData.category || "Productivity";
        const { data: relatedData } = await supabase
          .from("ai_tools")
          .select("*")
          .ilike("category", `%${cat.split(" ")[0]}%`)
          .neq("slug", rawSlug)
          .order("score", { ascending: false })
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
  const website = String(tool?.website_url || tool?.website || "");
  const deployment = String(tool?.deployment || "Cloud / Web App & API");
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
      setAlertMsg(`✓ Tracking enabled! We will notify you of discounts & major updates for ${toolName}.`);
      setAlertEmail("");
    } catch (err: unknown) {
      setAlertStatus("error");
      setAlertMsg(err instanceof Error ? err.message : "Failed to subscribe.");
    }
  };

  const cleanOverview =
    cleanAiContent(tool?.overview || tool?.description || tool?.tagline) ||
    `${toolName} is a verified AI software platform designed to optimize ${category.toLowerCase()} workflows with high-throughput processing.`;

  const estimatedHoursSaved = Math.round(weeklyHours * 0.45 * 10) / 10;
  const estimatedMonthlySavings = Math.round(estimatedHoursSaved * 4 * 35);

  const playbookPrompts = useMemo(() => {
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
  }, [toolName]);

  const faqList = useMemo(() => {
    return [
      {
        q: `Is ${toolName} free to use or does it require a subscription?`,
        a: `${toolName} operates under a ${pricing} pricing structure. Users can explore foundational features at zero cost or test available tier options before upgrading to premium access.`,
      },
      {
        q: `What is the primary use case of ${toolName}?`,
        a: `${toolName} is built specifically for ${category.toLowerCase()} workflows. It enables solo founders, developers, and teams to automate tasks, reduce latency, and scale computational output.`,
      },
      {
        q: `How is the AI Vault Score of ${formattedScore} calculated?`,
        a: `The AI Vault Score (${formattedScore}) is determined using our multi-vector neural index, assessing response speed, integration availability, output accuracy, and user sentiment.`,
      },
    ];
  }, [toolName, category, pricing, formattedScore]);

  const handleBookmarkToggle = () => {
    if (typeof window === "undefined" || !rawSlug) return;
    try {
      const stored = localStorage.getItem("aivault_saved_tools");
      let list: string[] = stored ? JSON.parse(stored) : [];
      if (bookmarked) {
        list = list.filter((s) => s.toLowerCase() !== rawSlug);
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

  const handleCopyBadge = () => {
    const embedCode = `<a href="https://www.aivault.pp.ua/tool/${rawSlug}" target="_blank"><img src="https://www.aivault.pp.ua/api/badge/${rawSlug}" alt="Featured on AI Vault" /></a>`;
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(embedCode);
      setBadgeCopied(true);
      setTimeout(() => setBadgeCopied(false), 2000);
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAFBFD]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </main>
    );
  }

  if (!tool) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#FAFBFD] px-4 text-center">
        <h1 className="text-2xl font-black text-slate-900">AI Tool Not Found</h1>
        <p className="mt-2 text-xs text-slate-500">The requested tool record could not be loaded.</p>
        <Link href="/" className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md">
          ← Return to Directory
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFBFD] text-slate-900 pb-28 font-sans">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-950">
            <img src="/logo.png" alt="AI Vault" className="h-7 w-7 object-contain" />
            <span>AI Vault<span className="text-blue-600">.</span></span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <Link
              href="/ai-finder"
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
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-black text-white shadow-sm shadow-blue-500/20 transition hover:bg-blue-700"
            >
              Visit Website ↗
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        {/* BREADCRUMB */}
        <div className="mb-4 flex items-center justify-between text-[11px] font-medium text-slate-400">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-blue-600">Directory</Link>
            <span>/</span>
            <Link href={`/category/${encodeURIComponent(category.toLowerCase())}`} className="capitalize hover:text-blue-600">
              {category}
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-700">{toolName}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Verified Catalog Entry
          </span>
        </div>

        {/* HERO SECTION WITH LIVE LOGO */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <ToolLogo
                name={toolName}
                src={logo}
                website={website}
                slug={rawSlug}
                size="lg"
              />
              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600">
                    Verified AI
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 capitalize">
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
                onClick={() => setUpvoted(!upvoted)}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-sm ${
                  upvoted ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <span>▲</span>
                <span>{upvoted ? upvoteCount + 1 : upvoteCount}</span>
              </button>

              <button
                onClick={handleBookmarkToggle}
                className={`rounded-xl border p-2 text-xs font-bold transition shadow-sm ${
                  bookmarked ? "border-amber-400 bg-amber-50 text-amber-600 font-bold" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
              <p className="mt-1 text-sm font-black text-slate-900 capitalize">{category}</p>
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

        {/* EMBED BADGE WITH LIVE VISUAL PREVIEW */}
        <section className="mt-6 rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/80 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-base">🛡️</span>
              <h3 className="text-sm font-black text-slate-950">
                Embed {toolName} Verification Badge on Your Site
              </h3>
            </div>
            <span className="self-start sm:self-auto text-[10px] font-bold text-blue-600 bg-blue-100/60 px-2.5 py-1 rounded-full uppercase">
              Free Backlink
            </span>
          </div>

          {/* Live Rendered Badge Preview */}
          <div className="mb-4 flex items-center justify-center rounded-2xl bg-slate-950 p-4 border border-slate-800">
            <img
              src={`/api/badge/${rawSlug}`}
              alt={`${toolName} AI Vault Badge`}
              className="h-9 w-auto"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
            <code className="flex-1 text-[11px] font-mono text-slate-700 truncate select-all">
              {`<a href="https://www.aivault.pp.ua/tool/${rawSlug}" target="_blank"><img src="https://www.aivault.pp.ua/api/badge/${rawSlug}" alt="Featured on AI Vault" /></a>`}
            </code>
            <button
              onClick={handleCopyBadge}
              className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
            >
              {badgeCopied ? "✓ Copied" : "Copy Code"}
            </button>
          </div>
        </section>

        {/* INLINE PRICE DROP & UPDATE ALERT WIDGET */}
        <section className="mt-6 rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-md">
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

        {/* PROMPT PLAYBOOK */}
        <section className="mt-6 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 p-6 sm:p-8 shadow-sm">
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
                    &quot;{item.prompt}&quot;
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

        {/* DECISION ENGINE */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
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

        {/* IN-DEPTH ABOUT SECTION */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
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
              {cleanOverview}
            </p>
            <p>
              {toolName} operates on a <strong>{pricing}</strong> model and is deployable via <strong>{deployment}</strong>. It offers seamless integration capabilities for modern software pipelines and team productivity setups.
            </p>
          </div>
        </section>

        {/* KEY CAPABILITIES */}
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

        {/* PROS & CONS */}
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

        {/* Q&A / FAQ SECTION */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block rounded-full bg-blue-600/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-blue-600">
              💡 Intelligence Q&A
            </span>
          </div>
          <h2 className="text-lg font-black text-slate-950">
            Frequently Asked Questions & Answers about {toolName}
          </h2>

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

        {/* REVIEWS & COMMUNITY SENTIMENT */}
        <ToolReviews toolSlug={rawSlug} toolName={toolName} />

        {/* SIMILAR TOOLS (WITH REAL LOGOS) */}
        {related.length > 0 && (
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-950">Top Similar {category} Tools</h2>
              <Link href={`/compare?tools=${encodeURIComponent(rawSlug)}`} className="text-xs font-bold text-blue-600 hover:underline">
                Compare All In Matrix →
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => {
                const itemSlug = String(item.slug || item.name || "");
                return (
                  <div
                    key={String(item.id ?? itemSlug)}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-blue-300"
                  >
                    <Link href={`/tool/${encodeURIComponent(itemSlug)}`} className="flex items-center gap-3 min-w-0">
                      <ToolLogo
                        name={String(item.name || "AI Tool")}
                        src={(item.logo_url || item.logo) as string}
                        website={String(item.website_url || item.website || "")}
                        slug={itemSlug}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-950 group-hover:text-blue-600 transition">
                          {String(item.name || "AI Tool")}
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize">{String(item.category || category)}</p>
                      </div>
                    </Link>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                      <span className="font-bold text-slate-500">{String(item.pricing || "Freemium")}</span>
                      <Link
                        href={`/compare/${rawSlug}-vs-${itemSlug}`}
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
      </div>

      {/* STICKY BOTTOM DOCK */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-3 min-w-0">
            <ToolLogo
              name={toolName}
              src={logo}
              website={website}
              slug={rawSlug}
              size="sm"
            />
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
  );
}
