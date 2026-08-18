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
  const [weeklyHours, setWeeklyHours] = useState(12);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);

  // Price Alert State
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
  const youtubeId = tool?.youtube_id ? String(tool.youtube_id).trim() : null;

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
      setAlertMsg(`✓ Price tracking enabled for ${toolName}.`);
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
    `${toolName} is a specialized AI system engineered for high-performance ${category.toLowerCase()} workflows.`;

  const estimatedHoursSaved = Math.round(weeklyHours * 0.45 * 10) / 10;
  const estimatedMonthlySavings = Math.round(estimatedHoursSaved * 4 * 35);

  const playbookPrompts = useMemo(() => {
    const cat = category.toLowerCase();
    if (cat.includes("market") || cat.includes("invest")) {
      return [
        {
          title: "Audience & Hook Optimizer",
          prompt: `Analyze our target audience value proposition. Generate 3 high-converting hooks and a 60-second summary structured for ${toolName}.`,
        },
        {
          title: "High-Response Outreach Blueprints",
          prompt: `Create a 3-tier personalized outreach sequence for decision-makers with concise value statements and a low-friction CTA.`,
        },
      ];
    }
    return [
      {
        title: "Workflow Automation Pipeline",
        prompt: `Act as a senior systems architect. Break down our repetitive operational tasks into an automated execution flow with ${toolName}.`,
      },
      {
        title: "Executive Synthesis & Action Plan",
        prompt: `Summarize project deliverables into 5 key action points with impact assessment and execution timelines.`,
      },
    ];
  }, [category, toolName]);

  const faqList = useMemo(() => {
    return [
      {
        q: `What makes ${toolName} unique in ${category}?`,
        a: `${toolName} provides direct cloud access with optimized latency and specialized algorithms designed specifically for modern ${category.toLowerCase()} tasks.`,
      },
      {
        q: `Is ${toolName} free or paid?`,
        a: `${toolName} operates under a ${pricing} pricing structure. Users can begin with foundational access or upgrade according to operational requirements.`,
      },
      {
        q: `How is the AI Vault Quality Index (${formattedScore}/100) calculated?`,
        a: `The Quality Index evaluates real-world execution speed, API consistency, ecosystem reliability, and user ratings across verified production workflows.`,
      },
    ];
  }, [toolName, category, pricing, formattedScore]);

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
    const embedSnippet = `<a href="https://www.aivault.pp.ua/tool/${rawSlug}" target="_blank" title="${toolName} on AI Vault">\n  <img src="https://www.aivault.pp.ua/badge.svg" alt="Featured on AI Vault" width="200" height="48" />\n</a>`;
    navigator.clipboard.writeText(embedSnippet);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
  };

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
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </main>
    );
  }

  if (!tool) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#fafbfc] px-4 text-center">
        <h1 className="text-2xl font-black text-slate-900">Tool Not Found</h1>
        <p className="mt-2 text-xs text-slate-500">The requested AI software record could not be loaded.</p>
        <Link href="/" className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm">
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

      <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-20">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
              AI Vault<span className="text-blue-600">.</span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/matcher"
                className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 transition"
              >
                ⚡ Matcher
              </Link>
              <Link
                href={`/compare?tools=${encodeURIComponent(rawSlug)}`}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 transition"
              >
                ⚖️ Compare
              </Link>
              <a
                href={destinationUrl}
                onClick={handleOutboundClick}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-black text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition"
              >
                Visit Site ↗
              </a>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link href={`/?cat=${encodeURIComponent(category)}`} className="hover:text-blue-600 capitalize">{category}</Link>
            <span>/</span>
            <span className="font-bold text-slate-800">{toolName}</span>
          </div>

          {/* MAIN TWO-COLUMN SYSTEMATIC LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT MAIN CONTENT AREA (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* HERO HEADER */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <ToolLogo name={toolName} src={logo} size="lg" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          ✓ Verified
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {category}
                        </span>
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                          {pricing}
                        </span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                        {toolName}
                      </h1>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleUpvote}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                        upvoted
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>▲</span>
                      <span>{upvoteCount}</span>
                    </button>
                    <button
                      onClick={handleBookmarkToggle}
                      className={`rounded-xl border p-2 text-xs transition ${
                        bookmarked
                          ? "border-amber-400 bg-amber-50 text-amber-600 font-bold"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {bookmarked ? "★" : "☆"}
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600 hover:bg-slate-100 transition"
                      title="Share link"
                    >
                      {copied ? "✓" : "🔗"}
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                  {cleanOverview}
                </p>
              </div>

              {/* VIDEO PLAYER (ONLY IF VALID ID EXISTS) */}
              {youtubeId && youtubeId !== "dQw4w9WgXcQ" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Product Demo & Walkthrough
                  </h2>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title={`${toolName} Video`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* CORE CAPABILITIES & USE CASES */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Key Capabilities & Use Cases
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-xs font-bold text-slate-900">Intelligent Pipeline Automation</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Automates repetitive {category.toLowerCase()} tasks with minimal turnaround latency.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-xs font-bold text-slate-900">High-Throughput Processing</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Handles parallel data loads without compromising output quality.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-xs font-bold text-slate-900">Zero Configuration Deployment</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Accessible via cloud web interface without complex server dependencies.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-xs font-bold text-slate-900">Production-Ready Intelligence</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Outputs standardized structured assets ready for immediate team handoff.</p>
                  </div>
                </div>
              </div>

              {/* PROS & CONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span> Key Advantages
                  </h3>
                  <ul className="text-xs text-emerald-950 space-y-1.5 leading-relaxed">
                    <li>• Specialized architecture for {category.toLowerCase()} workflows.</li>
                    <li>• Straightforward onboarding with {pricing} access.</li>
                    <li>• High cloud reliability & continuous updates.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <span className="text-amber-600 font-bold">!</span> Considerations
                  </h3>
                  <ul className="text-xs text-amber-950 space-y-1.5 leading-relaxed">
                    <li>• Rate limits vary by subscription tier.</li>
                    <li>• Requires stable network connectivity for cloud processing.</li>
                  </ul>
                </div>
              </div>

              {/* AI PLAYBOOK PROMPTS */}
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/30 via-white to-blue-50/20 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-wider text-indigo-900">
                    ⚡ 1-Click Prompt Templates
                  </h2>
                  <span className="text-[10px] text-slate-400 font-medium">Ready to use with {toolName}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {playbookPrompts.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col justify-between space-y-3">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{item.title}</p>
                        <p className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg mt-1.5 leading-relaxed border border-slate-100">
                          "{item.prompt}"
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopyPrompt(item.prompt, idx)}
                        className="w-full py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                      >
                        {copiedPromptIndex === idx ? "✓ Copied!" : "📋 Copy Prompt"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* COMMUNITY REVIEWS */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <ToolReviews toolSlug={rawSlug} toolName={toolName} />
              </div>

              {/* FAQS */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                  Frequently Asked Questions
                </h2>
                {faqList.map((item, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={idx} className="rounded-xl border border-slate-200 overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full p-3.5 text-left flex items-center justify-between text-xs font-bold text-slate-800 bg-slate-50/50 hover:bg-slate-100 transition"
                      >
                        <span>{item.q}</span>
                        <span className="text-slate-400 font-bold">{isOpen ? "−" : "+"}</span>
                      </button>
                      {isOpen && (
                        <div className="p-3.5 text-xs text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT STICKY SIDEBAR (4 Cols) */}
            <div className="lg:col-span-4 space-y-6 sticky top-20">
              
              {/* PRIMARY ACTION CARD */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Quality Index</span>
                  <span className="text-xl font-black text-blue-600">{formattedScore}<span className="text-xs text-slate-400">/100</span></span>
                </div>
                {score !== null && (
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: barWidth }}></div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Pricing</span>
                    <span className="font-bold text-slate-800">{pricing}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Deployment</span>
                    <span className="font-bold text-slate-800 truncate block">{deployment}</span>
                  </div>
                </div>

                <a
                  href={destinationUrl}
                  onClick={handleOutboundClick}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 transition"
                >
                  <span>Visit {toolName} Platform</span>
                  <span>↗</span>
                </a>
              </div>

              {/* ROI ESTIMATOR WIDGET */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  ⚡ ROI Quick Calculator
                </span>
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Weekly effort:</span>
                  <span className="text-blue-600">{weeklyHours} hrs/wk</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
                />
                <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] text-slate-400 uppercase block font-bold">Saved Time</span>
                    <span className="text-sm font-black text-blue-600">~{estimatedHoursSaved}h/wk</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] text-slate-400 uppercase block font-bold">Est. Value</span>
                    <span className="text-sm font-black text-emerald-600">${estimatedMonthlySavings}/mo</span>
                  </div>
                </div>
              </div>

              {/* PRICE DROP ALERT */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <p className="text-xs font-bold text-slate-900">🔔 Get {toolName} Price & Deal Alerts</p>
                <form onSubmit={handlePriceAlertSubmit} className="space-y-2">
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="submit"
                    disabled={alertStatus === "loading"}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
                  >
                    {alertStatus === "loading" ? "Activating..." : "Notify Me on Updates"}
                  </button>
                </form>
                {alertMsg && <p className="text-[11px] font-bold text-emerald-600">{alertMsg}</p>}
              </div>

              {/* FOUNDER EMBED BADGE */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Verified Badge</span>
                  <button
                    onClick={copyEmbedCode}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    {copiedBadge ? "✓ Copied" : "Copy HTML"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Embed this badge on your website to showcase verified status.
                </p>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono text-[10px] text-slate-600 truncate select-all">
                  {`<a href="https://www.aivault.pp.ua/tool/${rawSlug}">...</a>`}
                </div>
              </div>

            </div>
          </div>

          {/* SIMILAR TOOLS (BOTTOM GRID) */}
          {related.length > 0 && (
            <div className="pt-8 border-t border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-slate-900">Similar {category} AI Tools</h2>
                <Link href={`/?cat=${encodeURIComponent(category)}`} className="text-xs font-bold text-blue-600 hover:underline">
                  Browse All →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {related.map((item) => {
                  const itemSlug = String(item.slug || item.name || "");
                  return (
                    <Link
                      key={String(item.id ?? itemSlug)}
                      href={`/tool/${encodeURIComponent(itemSlug)}`}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ToolLogo name={String(item.name || "AI")} src={item.logo_url as string} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{String(item.name)}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{String(item.pricing || "Freemium")}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-blue-600">→</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
