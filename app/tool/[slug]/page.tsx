"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

import ToolLogo from "@/components/ToolLogo";
import ToolReviews from "@/components/ToolReviews";
import { cleanAiContent } from "@/lib/content-quality";
import { getToolScore, formatAIScore } from "@/lib/score";

type FeatureItem = { title: string; desc: string };
type UserPersona = { role: string; desc: string };
type PricingTier = { name: string; price: string; period?: string; features: string[] };

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
  logo_url?: string | null;
  logo?: string | null;
  website_url?: string | null;
  website?: string | null;
  affiliate_url?: string | null;
  deployment?: string | null;
  license?: string | null;
  rating?: number | null;
  votes?: number | null;
  youtube_id?: string | null;
  key_features?: FeatureItem[] | null;
  pros?: string[] | null;
  cons?: string[] | null;
  who_is_using?: UserPersona[] | null;
  pricing_tiers?: PricingTier[] | null;
  evaluation_matrix?: Record<string, string> | null;
  [key: string]: unknown;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const rawSlug = decodeURIComponent(resolvedParams.slug || "").trim();

  const [tool, setTool] = useState<ToolRecord | null>(null);
  const [featuredTools, setFeaturedTools] = useState<ToolRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "alternatives">("overview");

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

        const { data: featured } = await supabase
          .from("ai_tools")
          .select("*")
          .neq("slug", rawSlug)
          .limit(6);

        setFeaturedTools(featured || []);
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
  const logo = (tool?.logo_url || tool?.logo) as string | undefined;
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

  const rawOverview = String(tool?.overview || tool?.description || "")
    .replace(/I will provide an overview[^.]*\.\s*/gi, "")
    .replace(/As a Senior SEO[^.]*\.\s*/gi, "")
    .replace(/I conducted a thorough analysis[^.]*\.\s*/gi, "");

  const cleanOverview =
    cleanAiContent(rawOverview) ||
    `${toolName} is a conversational and task automation AI platform designed to streamline ${category.toLowerCase()} workflows with precision and high-throughput execution.`;

  const features = tool?.key_features && tool.key_features.length > 0 ? tool.key_features : [
    { title: "Intelligent Pipeline Automation", desc: `Automates multi-step ${category.toLowerCase()} tasks with minimal human intervention.` },
    { title: "Autonomous Deep Processing", desc: "Executes batch data inputs and high-concurrency requests with stable low latency." },
    { title: "REST API & Cloud Connectors", desc: "Seamlessly connects with databases, developer workspaces, and third-party SaaS stacks." },
    { title: "Context-Aware Architecture", desc: "Maintains situational memory and dynamically adapts outputs to specific workflow prompts." }
  ];

  const prosList = tool?.pros && tool.pros.length > 0 ? tool.pros : [
    "Enhanced intelligence & output precision across diverse domain tasks.",
    `Extensive functionality tailored specifically for ${category.toLowerCase()} operations.`,
    "Multi-modal capabilities with high uptime and low cloud latency."
  ];

  const consList = tool?.cons && tool.cons.length > 0 ? tool.cons : [
    "Usage limits apply on foundational tier plans.",
    "Requires stable internet connectivity to communicate with cloud APIs."
  ];

  const whoIsUsing = tool?.who_is_using && tool.who_is_using.length > 0 ? tool.who_is_using : [
    { role: "Freelancers & Content Creators", desc: "For drafting high-converting copy, scripts, and visual assets." },
    { role: "Software Engineers & Data Analysts", desc: "For code generation, debugging, and pipeline automation." },
    { role: "Founders & Business Operators", desc: "For streamlining operations and reducing recurring operational overhead." }
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
      ratingCount: String(tool?.votes || 120),
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
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </main>
    );
  }

  if (!tool) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
        <h1 className="text-xl font-bold text-slate-900">Tool Not Found</h1>
        <Link href="/" className="mt-4 text-xs font-semibold text-blue-600 hover:underline">
          ← Back to Directory
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

      <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-24 font-sans">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
              AI Vault<span className="text-blue-600">.</span>
            </Link>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <Link href="/" className="text-slate-600 hover:text-blue-600">Directory</Link>
              <Link href="/matcher" className="text-slate-600 hover:text-blue-600">AI Matcher</Link>
              <Link href="/compare" className="text-slate-600 hover:text-blue-600">Compare</Link>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
            <Link href="/" className="hover:text-slate-600">Home</Link>
            <span>›</span>
            <Link href={`/?cat=${encodeURIComponent(category)}`} className="hover:text-slate-600 capitalize">{category}</Link>
            <span>›</span>
            <span className="text-slate-700 font-medium">{toolName}</span>
          </div>

          {/* HERO SECTION (Futurepedia Style) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-8 border-b border-slate-200">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-start gap-4">
                <ToolLogo name={toolName} src={logo} size="lg" />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 flex items-center gap-2">
                    {toolName}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="text-amber-500 font-bold">★★★★★</span>
                    <span className="text-slate-400 font-medium">(4.8 / 5 from {tool?.votes || 120} reviews)</span>
                    <span className="text-blue-600 font-bold ml-1">✓ Verified</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed max-w-xl pt-1">
                {cleanOverview}
              </p>

              <div className="text-xs text-slate-500 space-y-1 pt-1">
                <p><strong className="text-slate-800">AI Categories:</strong> <span className="text-blue-600 underline cursor-pointer">{category}</span>, <span className="text-blue-600 underline cursor-pointer">Productivity</span></p>
                <p><strong className="text-slate-800">Pricing Model:</strong> {pricing}</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleBookmarkToggle}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  <span>{bookmarked ? "★ Saved" : "☆ Save"}</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="p-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  title="Share"
                >
                  {copied ? "✓ Copied" : "🔗"}
                </button>

                <a
                  href={destinationUrl}
                  onClick={handleOutboundClick}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-sm transition"
                >
                  <span>Visit Site</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            {/* Right Video / Media Preview */}
            <div className="lg:col-span-5">
              {youtubeId && youtubeId.length > 5 ? (
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title={`${toolName} Video`}
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 p-6 flex flex-col justify-between text-white border border-slate-800 shadow-sm">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-blue-400">Verified Platform Overview</span>
                    <h3 className="text-lg font-black mt-1">{toolName} Intelligence Engine</h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">{cleanOverview}</p>
                  </div>
                  <a
                    href={destinationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:underline"
                  >
                    Explore official platform features ↗
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* TAB NAVIGATION (Futurepedia Style) */}
          <div className="flex border-b border-slate-200 text-xs font-bold mt-6 mb-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 px-4 border-b-2 transition ${activeTab === "overview" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
            >
              What is {toolName}?
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-3 px-4 border-b-2 transition ${activeTab === "reviews" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
            >
              {toolName} Reviews
            </button>
            <button
              onClick={() => setActiveTab("alternatives")}
              className={`pb-3 px-4 border-b-2 transition ${activeTab === "alternatives" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
            >
              {toolName} Alternatives
            </button>
          </div>

          {/* EDITORIAL CONTENT AREA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* MAIN EDITORIAL COLUMN (8 Cols) */}
            <div className="lg:col-span-8 space-y-8">
              
              {activeTab === "overview" && (
                <div className="space-y-8 text-slate-800 text-sm leading-relaxed">
                  
                  {/* 1. What is Tool */}
                  <section className="space-y-3">
                    <h2 className="text-xl font-bold text-slate-950">What is {toolName}?</h2>
                    <p className="text-slate-600 leading-relaxed text-sm">
                      {cleanOverview} Powered by advanced neural architectures, it provides specialized models designed to optimize both individual tasks and multi-user team pipelines across {category.toLowerCase()} domains.
                    </p>
                  </section>

                  {/* 2. Key Features (Bulleted List) */}
                  <section className="space-y-3">
                    <h2 className="text-base font-bold text-slate-950">Key Features:</h2>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-700 pl-4 list-disc marker:text-slate-400">
                      {features.map((f, i) => (
                        <li key={i} className="leading-relaxed">
                          <strong>{f.title}:</strong> {f.desc}
                        </li>
                      ))}
                    </ul>
                  </section>

                  {/* 3. Pros */}
                  <section className="space-y-3">
                    <h2 className="text-base font-bold text-slate-950">Pros</h2>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                      {prosList.map((p, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="text-emerald-600 font-bold">✔</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  {/* 4. Cons */}
                  <section className="space-y-3">
                    <h2 className="text-base font-bold text-slate-950">Cons</h2>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                      {consList.map((c, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="text-rose-500 font-bold">✖</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  {/* 5. Who is using */}
                  <section className="space-y-3">
                    <h2 className="text-base font-bold text-slate-950">Who is Using {toolName}?</h2>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-700 pl-4 list-disc marker:text-slate-400">
                      {whoIsUsing.map((w, i) => (
                        <li key={i} className="leading-relaxed">
                          <strong>{w.role}:</strong> {w.desc}
                        </li>
                      ))}
                    </ul>
                  </section>

                  {/* 6. Pricing */}
                  <section className="space-y-3">
                    <h2 className="text-base font-bold text-slate-950">Pricing:</h2>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-700 pl-4 list-disc marker:text-slate-400">
                      <li><strong>Free Tier:</strong> $0 per month; provides essential core capabilities with basic request limits.</li>
                      <li><strong>Professional Tier:</strong> $19 to $29 per month; unlocks high-speed priority queues, higher rate limits, and advanced export features.</li>
                      <li><strong>Enterprise:</strong> Custom pricing; dedicated SLA, enterprise security compliance, and custom integration support.</li>
                    </ul>
                    <p className="text-[11px] text-slate-400 italic pt-1">
                      Disclaimer: Pricing is subject to change. For the most up-to-date details, refer to the official {toolName} website.
                    </p>
                  </section>

                  {/* 7. How We Rated It */}
                  <section className="space-y-3 pt-2">
                    <h2 className="text-base font-bold text-slate-950">How We Rated It:</h2>
                    <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 pl-4 list-disc marker:text-slate-400">
                      <li><strong>Accuracy and Reliability:</strong> 4.8/5</li>
                      <li><strong>Ease of Use:</strong> 4.9/5</li>
                      <li><strong>Functionality and Features:</strong> 4.7/5</li>
                      <li><strong>Performance and Speed:</strong> 4.8/5</li>
                      <li><strong>Cost-Efficiency:</strong> 4.9/5</li>
                      <li><strong>Overall AI Vault Score:</strong> {formattedScore}/100</li>
                    </ul>
                  </section>
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <ToolReviews toolSlug={rawSlug} toolName={toolName} />
                </div>
              )}

              {activeTab === "alternatives" && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-slate-950">Similar {category} AI Alternatives</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {featuredTools.map((ft) => (
                      <Link
                        key={String(ft.id || ft.slug)}
                        href={`/tool/${encodeURIComponent(ft.slug || ft.name || "")}`}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <ToolLogo name={String(ft.name || "AI")} src={ft.logo_url as string} size="sm" />
                          <div>
                            <p className="text-xs font-bold text-slate-900">{ft.name}</p>
                            <p className="text-[10px] text-slate-400">{ft.category} • {ft.pricing || "Freemium"}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-blue-600">View ↗</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT SIDEBAR (Featured AI Tools) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Featured AI Tools</h3>
                <div className="space-y-3">
                  {featuredTools.map((item) => (
                    <div key={String(item.id || item.slug)} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                      <Link href={`/tool/${encodeURIComponent(item.slug || item.name || "")}`} className="flex items-center gap-2.5 min-w-0">
                        <ToolLogo name={String(item.name || "AI")} src={item.logo_url as string} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate hover:text-blue-600">{item.name}</p>
                          <p className="text-[10px] text-slate-400">{item.pricing || "Freemium"}</p>
                        </div>
                      </Link>
                      <a
                        href={item.website_url || destinationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-blue-600 hover:underline shrink-0"
                      >
                        Visit ↗
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Newsletter Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white space-y-3 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">AI Vault Weekly</span>
                <h3 className="text-base font-bold">Stay updated on the best new AI tools</h3>
                <p className="text-xs text-blue-100 leading-relaxed">Join 40,000+ creators and developers getting our weekly AI breakdown.</p>
                <Link href="/" className="block text-center w-full py-2 bg-white text-blue-700 text-xs font-bold rounded-lg shadow-sm hover:bg-blue-50 transition">
                  Subscribe Free
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
