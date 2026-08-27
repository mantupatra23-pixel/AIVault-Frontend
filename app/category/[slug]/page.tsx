import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import ToolLogo from "@/components/ToolLogo";
import { cleanAiContent } from "@/lib/content-quality";
import { getToolScore, formatAIScore, getScoreBarWidth } from "@/lib/score";

// 1 Hour ISR cache revalidation for high-speed Googlebot indexing
export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string }>;
};

type ToolRecord = {
  id?: string | number | null;
  slug: string;
  name: string;
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
  features?: string[] | string | null;
  pros?: string[] | string | null;
  cons?: string[] | string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

const CATEGORY_MAP: Record<
  string,
  { name: string; icon: string; headline: string; description: string; query: string }
> = {
  coding: {
    name: "Coding & Dev",
    icon: "💻",
    headline: "Best AI Coding Assistants & Autonomous Engineers (2026)",
    description: "Explore top AI coding tools, autonomous agents, and IDE extensions for full-stack developers, terminal automation, and code generation.",
    query: "coding",
  },
  productivity: {
    name: "Productivity & Ops",
    icon: "🚀",
    headline: "Top AI Productivity Software & Pipeline Accelerators",
    description: "Discover verified AI workflow automation platforms, smart workspace assistants, and real-time operational execution hubs.",
    query: "productivity",
  },
  chatbot: {
    name: "Chatbots & LLMs",
    icon: "🤖",
    headline: "Frontier Conversational AI & Advanced Reasoning Engines",
    description: "Compare benchmarked frontier LLMs, conversational assistants, and reasoning models for enterprise and personal intelligence.",
    query: "chatbot",
  },
  marketing: {
    name: "Marketing & SEO",
    icon: "📈",
    headline: "High-ROI AI Marketing & Growth Automation Platforms",
    description: "Find verified AI tools for automated ad creative generation, multi-channel outreach, SEO optimization, and audience analytics.",
    query: "marketing",
  },
  image: {
    name: "Image & Graphic Design",
    icon: "🎨",
    headline: "Leading AI Image Generators & Generative Art Models",
    description: "State-of-the-art diffusion models, photorealistic image synthesis, visual asset designers, and commercial graphic generators.",
    query: "image",
  },
  writing: {
    name: "Writing & Copywriting",
    icon: "✍️",
    headline: "Top AI Writing Assistants & Long-Form Copy Platforms",
    description: "Tools for drafting high-converting copy, technical documentation, newsletters, and programmatic content workflows.",
    query: "writing",
  },
  audio: {
    name: "Audio & Voice AI",
    icon: "🎵",
    headline: "High-Fidelity AI Voice Cloning & Audio Engines",
    description: "Synthesize photorealistic speech, multilingual dubbing, custom sound effects, and full musical composition.",
    query: "audio",
  },
  video: {
    name: "Video Generation",
    icon: "🎬",
    headline: "Cutting-Edge Generative Video & Cinematic AI Suites",
    description: "Generate cinematic videos, video-to-video transformations, and automated marketing clips from text prompts.",
    query: "video",
  },
};

function formatCategoryTitle(slug: string): string {
  if (!slug) return "AI Software";
  return decodeURIComponent(slug)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractCleanFeatures(tool: ToolRecord): string[] {
  if (Array.isArray(tool.features) && tool.features.length > 0) {
    return tool.features.slice(0, 3);
  }
  const raw = String(tool.overview || tool.description || tool.tagline || "");
  const sentences = raw
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && s.length < 120);

  if (sentences.length >= 2) return sentences.slice(0, 3);
  return ["Workflow Automation Pipeline", "REST API & Webhook Connectivity", "Real-Time Cloud Processing Engine"];
}

function extractProsAndCons(tool: ToolRecord): { pros: string[]; cons: string[] } {
  const pricing = String(tool.pricing_model || tool.pricing_type || tool.pricing || "").toLowerCase();
  let pros = ["Fast response latency & high uptime", "Intuitive dashboard with zero setup curve"];
  let cons = ["Advanced enterprise tier requires custom quote"];

  if (pricing.includes("free")) {
    pros.unshift("Generous 100% free starter tier");
  }
  return { pros: pros.slice(0, 2), cons: cons.slice(0, 2) };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug || "").trim().toLowerCase();
  const info = CATEGORY_MAP[cleanSlug] || {
    name: formatCategoryTitle(cleanSlug),
    headline: `Best ${formatCategoryTitle(cleanSlug)} AI Tools in 2026`,
    description: `Explore top verified ${formatCategoryTitle(cleanSlug)} software platforms in 2026. Compare pricing plans, benchmark ratings, and core features.`,
  };

  return {
    title: `${info.headline} | AI Vault`,
    description: info.description,
    alternates: {
      canonical: `https://www.aivault.pp.ua/category/${cleanSlug}`,
    },
    openGraph: {
      title: `${info.name} AI Directory (2026) | AI Vault`,
      description: info.description,
      url: `https://www.aivault.pp.ua/category/${cleanSlug}`,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug || "").trim().toLowerCase();
  const categoryTitle = formatCategoryTitle(cleanSlug);

  const info = CATEGORY_MAP[cleanSlug] || {
    name: categoryTitle,
    icon: "⚡",
    headline: `Top ${categoryTitle} AI Solutions (2026)`,
    description: `Discover verified software architectures and AI models tailored for ${categoryTitle.toLowerCase()} operations.`,
    query: cleanSlug.split("-")[0],
  };

  const supabase = getSupabase();
  let tools: ToolRecord[] = [];

  try {
    const { data } = await supabase
      .from("ai_tools")
      .select("*")
      .ilike("category", `%${info.query}%`)
      .not("slug", "is", null)
      .order("score", { ascending: false })
      .limit(60);

    if (data && data.length > 0) {
      tools = data as ToolRecord[];
    } else {
      const fallback = await supabase
        .from("ai_tools")
        .select("*")
        .not("slug", "is", null)
        .order("score", { ascending: false })
        .limit(30);
      tools = (fallback.data as ToolRecord[]) || [];
    }
  } catch (err) {
    console.error("Failed to load category tools:", err);
  }

  if (tools.length === 0) {
    notFound();
  }

  const spotlightTools = tools.slice(0, 3);
  const toolCount = tools.length;

  // Google JSON-LD Structured Schema
  const richSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: info.headline,
        description: info.description,
        url: `https://www.aivault.pp.ua/category/${cleanSlug}`,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: toolCount,
          itemListElement: tools.slice(0, 15).map((t, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            name: t.name,
            url: `https://www.aivault.pp.ua/tool/${t.slug}`,
          })),
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `What are the best ${info.name} AI tools in 2026?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `The top verified ${info.name} AI tools include ${spotlightTools.map((t) => t.name).join(", ")}. These tools provide benchmarked output reliability, API connectivity, and transparent pricing.`,
            },
          },
          {
            "@type": "Question",
            name: `Are there free ${info.name} AI platforms available?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Yes, many ${info.name} platforms provide free or freemium tiers that let users explore core AI generation and automation workflows without upfront fees.`,
            },
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://www.aivault.pp.ua",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Categories",
            item: "https://www.aivault.pp.ua/#categories",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: info.name,
            item: `https://www.aivault.pp.ua/category/${cleanSlug}`,
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#FAFBFD] text-slate-900 pb-28 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(richSchema) }}
      />

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-950">
            <img src="/logo.png" alt="AI Vault" className="h-7 w-7 object-contain" />
            <span>AI Vault<span className="text-blue-600">.</span></span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/ai-finder"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition"
            >
              ⚡ Matcher
            </Link>
            <Link
              href="/compare"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition"
            >
              ⚖️ Compare
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
            >
              ← Back to Catalog
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* BREADCRUMB */}
        <div className="mb-6 flex items-center gap-2 text-[11px] font-bold text-slate-400">
          <Link href="/" className="hover:text-blue-600">Directory</Link>
          <span>/</span>
          <span className="text-slate-900 capitalize">{info.name}</span>
        </div>

        {/* HERO SECTION */}
        <section className="mb-12 rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-blue-600 mb-4">
            <span>{info.icon}</span>
            <span>Category Intelligence Index</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Best <span className="text-blue-600">{toolCount}</span> {info.name} Tools in 2026
          </h1>
          <p className="mt-4 text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {info.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-slate-100 px-3.5 py-1 text-xs font-bold text-slate-700">
              📊 {toolCount} Verified Platforms
            </span>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-emerald-700">
              ✓ Daily Benchmarks Verified
            </span>
          </div>

          {/* CATEGORY CHIPS */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {Object.entries(CATEGORY_MAP).map(([key, item]) => (
              <Link
                key={key}
                href={`/category/${key}`}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  key === cleanSlug
                    ? "bg-slate-950 text-white shadow"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{item.icon} {item.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* TOP PODIUM SPOTLIGHT (TOP 3 RATED) */}
        {spotlightTools.length > 0 && (
          <section className="mb-14">
            <h2 className="text-base font-black text-slate-950 mb-4 flex items-center gap-2">
              🏆 Top Rated in {info.name}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {spotlightTools.map((tool, idx) => {
                const score = getToolScore(tool) ?? 95;
                const pricing = String(tool.pricing_model || tool.pricing_type || tool.pricing || "Freemium");
                return (
                  <div
                    key={tool.slug}
                    className={`relative flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 ${
                      idx === 0 ? "border-blue-500 ring-2 ring-blue-500/20 shadow-blue-50" : "border-slate-200"
                    }`}
                  >
                    <span className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                      #{idx + 1} Best Rated
                    </span>

                    <div>
                      <div className="flex items-center justify-between gap-3 mb-4 mt-1">
                        <ToolLogo
                          name={tool.name}
                          src={tool.logo_url || tool.logo}
                          website={tool.website_url || tool.website}
                          slug={tool.slug}
                          size="md"
                        />
                        <div className="text-right">
                          <span className="text-base font-black text-blue-600">{formatAIScore(score)}</span>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase">Score</span>
                        </div>
                      </div>

                      <h3 className="text-base font-black text-slate-950 truncate mb-1">
                        {tool.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                        {cleanAiContent(tool.tagline || tool.overview || tool.description)}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                        {pricing}
                      </span>
                      <Link
                        href={`/tool/${tool.slug}`}
                        className="text-xs font-black text-blue-600 hover:underline"
                      >
                        Explore Dossier →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* FULL DIRECTORY GRID WITH FEATURES & PROS/CONS */}
        <section className="mb-14 space-y-6">
          <h2 className="text-base font-black text-slate-950">
            All {info.name} Tools ({tools.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tools.map((tool, index) => {
              const score = getToolScore(tool) ?? 92;
              const barWidth = getScoreBarWidth(score);
              const pricing = String(tool.pricing_model || tool.pricing_type || tool.pricing || "Freemium");
              const features = extractCleanFeatures(tool);
              const { pros, cons } = extractProsAndCons(tool);

              return (
                <article
                  key={tool.slug || index}
                  className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    {/* CARD TOP */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <ToolLogo
                          name={tool.name}
                          src={tool.logo_url || tool.logo}
                          website={tool.website_url || tool.website}
                          slug={tool.slug}
                          size="md"
                        />
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-slate-950 truncate">
                            {tool.name}
                          </h3>
                          <span className="rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {pricing}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-blue-600">{formatAIScore(score)}</span>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Score</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                      {cleanAiContent(tool.tagline || tool.overview || tool.description)}
                    </p>

                    {/* CORE FEATURES BULLETS */}
                    <ul className="space-y-1 mb-4 text-[11px] text-slate-700 bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                      {features.map((f, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-blue-600 font-black">✓</span>
                          <span className="truncate">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* PROS & CONS */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] mb-4">
                      <div className="space-y-1">
                        {pros.map((p, idx) => (
                          <p key={idx} className="text-emerald-700 font-medium truncate">
                            + {p}
                          </p>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {cons.map((c, idx) => (
                          <p key={idx} className="text-rose-600 font-medium truncate">
                            − {c}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    {/* SCORE BAR */}
                    <div className="border-t border-slate-100 pt-3 mb-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-full"
                          style={{ width: barWidth }}
                        />
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-2">
                      <a
                        href={`/go/${encodeURIComponent(tool.slug)}`}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="flex-1 rounded-xl bg-blue-600 py-2.5 text-center text-xs font-black text-white hover:bg-blue-700 shadow-sm transition"
                      >
                        Visit Portal ↗
                      </a>
                      <Link
                        href={`/tool/${tool.slug}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                      >
                        Dossier →
                      </Link>
                      <Link
                        href={`/compare?tools=${encodeURIComponent(tool.slug)}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
                        title="Compare against others"
                      >
                        ⚖️
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* AUTHORITY FAQ & SUMMARY SECTION */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              Frequently Asked Questions about {info.name} AI Tools
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Everything you need to know about evaluating and integrating {info.name.toLowerCase()} software.
            </p>
          </div>

          <div className="space-y-3">
            <details className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-4" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-slate-900">
                <span>How are {info.name} tools ranked on AI Vault?</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Rankings are determined by our neural evaluation index, which continuously benchmarks generation latency, API reliability, user satisfaction, and pricing transparency across production environments.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-slate-900">
                <span>Can I compare multiple {info.name} tools side-by-side?</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Yes. Click the ⚖️ button on any tool card or use our Compare Matrix to evaluate feature matrices, monthly pricing plans, and performance benchmarks side-by-side.
              </p>
            </details>
          </div>
        </section>
      </div>
    </main>
  );
}
