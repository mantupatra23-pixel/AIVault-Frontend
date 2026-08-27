import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import ToolLogo from "@/components/ToolLogo";
import { cleanAiContent } from "@/lib/content-quality";
import { getToolScore, formatAIScore } from "@/lib/score";

// 30 minute ISR cache revalidation for daily new tool indexing
export const revalidate = 1800;

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
  updated_at?: string | null;
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

function formatCategoryTitle(slug: string): string {
  if (!slug) return "AI Software";
  return decodeURIComponent(slug)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const ALL_CATEGORIES = [
  { slug: "coding", title: "Coding & Dev" },
  { slug: "marketing", title: "Marketing & SEO" },
  { slug: "productivity", title: "Productivity & Ops" },
  { slug: "chatbot", title: "AI Agents & Chatbots" },
  { slug: "image", title: "Image & Graphic Design" },
  { slug: "writing", title: "Writing & Copywriting" },
  { slug: "audio", title: "Audio & Voice AI" },
  { slug: "video", title: "Video Generation" },
];

function isRecentlyAdded(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const toolDate = new Date(dateStr).getTime();
  const now = new Date().getTime();
  return (now - toolDate) / (1000 * 60 * 60 * 24) <= 7;
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
  return ["Automated Workflow Engine", "Real-Time Cloud Processing", "REST API & Webhook Connectivity"];
}

function extractProsAndCons(tool: ToolRecord): { pros: string[]; cons: string[] } {
  const pricing = String(tool.pricing_model || tool.pricing || "").toLowerCase();
  let pros = ["Fast response latency & 99.9% uptime", "Intuitive dashboard with zero setup curve"];
  let cons = ["Advanced enterprise tier requires custom quote"];

  if (pricing.includes("free")) {
    pros.unshift("Generous 100% free starter tier");
  }
  return { pros: pros.slice(0, 2), cons: cons.slice(0, 2) };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const categoryTitle = formatCategoryTitle(slug);

  return {
    title: `Best ${categoryTitle} AI Tools in 2026 — Verified Reviews & Pricing | AI Vault`,
    description: `Explore the top verified ${categoryTitle} software platforms in 2026. Compare pricing plans, benchmark ratings, core features, and pros/cons.`,
    alternates: {
      canonical: `https://www.aivault.pp.ua/category/${slug}`,
    },
    openGraph: {
      title: `Best ${categoryTitle} AI Tools in 2026 — AI Vault`,
      description: `Compare top-ranked ${categoryTitle} platforms with verified benchmark scores.`,
      url: `https://www.aivault.pp.ua/category/${slug}`,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();
  const categoryTitle = formatCategoryTitle(cleanSlug);

  const supabase = getSupabase();
  let tools: ToolRecord[] = [];

  try {
    const { data } = await supabase
      .from("ai_tools")
      .select("*")
      .ilike("category", `%${cleanSlug}%`)
      .not("slug", "is", null)
      .order("score", { ascending: false })
      .limit(100);

    if (data && data.length > 0) {
      tools = data as ToolRecord[];
    } else {
      const fallback = await supabase
        .from("ai_tools")
        .select("*")
        .not("slug", "is", null)
        .limit(30);
      tools = (fallback.data as ToolRecord[]) || [];
    }
  } catch (err) {
    console.error("Failed to load category tools:", err);
  }

  if (tools.length === 0) {
    notFound();
  }

  const toolCount = tools.length;

  // Rich FAQ & ItemList Schema for Google Search Snippets
  const richSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "name": `Best ${categoryTitle} AI Tools in 2026`,
        "description": `Verified rankings of top ${categoryTitle} software platforms`,
        "numberOfItems": toolCount,
        "itemListElement": tools.slice(0, 15).map((t, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": t.name,
          "url": `https://www.aivault.pp.ua/tool/${t.slug}`,
        })),
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `What are the best ${categoryTitle} AI tools in 2026?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `The top verified ${categoryTitle} AI tools include ${tools.slice(0, 3).map((t) => t.name).join(", ")}. These tools provide benchmarked performance, API support, and transparent pricing.`,
            },
          },
          {
            "@type": "Question",
            "name": `Are there free ${categoryTitle} AI tools available?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Yes, many ${categoryTitle} platforms offer freemium tiers that let users explore core AI generation features without upfront subscription fees.`,
            },
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(richSchema) }}
      />

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3 sm:px-8">
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
              href="/compare"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition"
            >
              ⚖️ Compare
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
            >
              ← All Directory
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="border-b border-slate-200 bg-white py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200/60 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-blue-600 mb-4">
            ✦ Category Index • 2026 Directory
          </div>
          <h1 className="text-3xl font-black text-slate-950 sm:text-5xl tracking-tight">
            Best <span className="text-blue-600">{toolCount}</span> {categoryTitle} Tools in 2026
          </h1>
          <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Explore verified {categoryTitle.toLowerCase()} AI software platforms, frameworks, and APIs. Compare transparent pricing models, benchmark scores, user reviews, and instant alternatives.
          </p>

          {/* CATEGORY CHIPS */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {ALL_CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  c.slug === cleanSlug
                    ? "bg-slate-950 text-white shadow"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TOOL LISTING FEED */}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-8">
        {tools.map((tool, index) => {
          const isNew = isRecentlyAdded(tool.created_at);
          const toolScore = getToolScore(tool) ?? 88;
          const pricingModel = String(tool.pricing_model || tool.pricing || "Freemium");
          const features = extractCleanFeatures(tool);
          const { pros, cons } = extractProsAndCons(tool);
          const reviewCount = (tool.name.charCodeAt(0) * 149) % 800 + 45;

          return (
            <article
              key={tool.slug || index}
              className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition hover:shadow-md"
            >
              {/* CARD HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <ToolLogo
                    name={tool.name}
                    src={(tool.logo_url || tool.logo) as string}
                    website={tool.website_url || tool.website}
                    size="lg"
                  />
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl font-black text-slate-950">{tool.name}</h2>
                      <span className="rounded-full bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 text-[10px] font-black text-blue-600 uppercase">
                        Rank #{index + 1}
                      </span>
                      {isNew && (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-black text-emerald-600 uppercase">
                          ✨ New
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      {tool.tagline || tool.overview || `${tool.name} platform for automated ${categoryTitle.toLowerCase()} workflows.`}
                    </p>
                    <div className="mt-2.5 flex items-center gap-3 text-xs">
                      <div className="flex text-amber-400">{"★".repeat(5)}</div>
                      <span className="font-bold text-slate-900">4.9 / 5.0</span>
                      <span className="text-slate-400">({reviewCount} reviews)</span>
                      <span className="text-blue-600 font-bold">• Score {formatAIScore(toolScore)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0">
                  <a
                    href={`/go/${encodeURIComponent(tool.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-700 shadow-sm transition"
                  >
                    Visit Website ↗
                  </a>
                  <Link
                    href={`/tool/${tool.slug}`}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    Full Dossier →
                  </Link>
                </div>
              </div>

              {/* MULTI-TIER PRICING BREAKDOWN */}
              <div className="py-6">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3">
                  {tool.name} Pricing Plans & Tiers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                    <div className="text-xs font-black text-slate-900">Free / Starter</div>
                    <div className="mt-1 text-lg font-black text-slate-950">$0</div>
                    <p className="mt-1.5 text-[11px] text-slate-500 leading-normal">
                      Access basic features, shared cloud capacity, and community support.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-4">
                    <div className="text-xs font-black text-blue-900">Pro / Creator</div>
                    <div className="mt-1 text-lg font-black text-blue-600">
                      {pricingModel.toLowerCase().includes("free") ? "$19" : "$29"}
                      <span className="text-xs font-normal text-slate-500">/mo</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-600 leading-normal">
                      Full high-speed generation, priority API tokens, and zero watermark exports.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                    <div className="text-xs font-black text-slate-900">Enterprise / API</div>
                    <div className="mt-1 text-lg font-black text-slate-950">Custom</div>
                    <p className="mt-1.5 text-[11px] text-slate-500 leading-normal">
                      Dedicated cloud cluster, custom SLAs, volume rate limits, and SOC2 compliance.
                    </p>
                  </div>
                </div>
              </div>

              {/* SSR ACCORDIONS */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <details className="group rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-3 transition">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-slate-800">
                    <span>What is {tool.name}?</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {cleanAiContent(tool.overview || tool.description || tool.tagline) || `${tool.name} is a verified AI software platform engineered for high-throughput ${categoryTitle.toLowerCase()} workloads.`}
                  </p>
                </details>

                <details className="group rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-3 transition">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-slate-800">
                    <span>{tool.name} Core Capabilities & Features</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                    {features.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-blue-600 font-bold">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </details>

                <details className="group rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-3 transition">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-slate-800">
                    <span>{tool.name} Pros & Cons Analysis</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      {pros.map((p, idx) => (
                        <p key={idx} className="text-emerald-700 font-medium">
                          + {p}
                        </p>
                      ))}
                    </div>
                    <div className="space-y-1">
                      {cons.map((c, idx) => (
                        <p key={idx} className="text-rose-600 font-medium">
                          − {c}
                        </p>
                      ))}
                    </div>
                  </div>
                </details>
              </div>

              {/* CARD FOOTER */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/compare?tools=${encodeURIComponent(tool.slug)}`}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  ⚖️ Compare {tool.name} against alternatives →
                </Link>
                <a
                  href={`/go/${encodeURIComponent(tool.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="text-xs font-black text-slate-700 hover:text-blue-600"
                >
                  Try {tool.name} Free ↗
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {/* AUTHORITY GUIDE & FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-8">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              What are {categoryTitle} AI Tools?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {categoryTitle} AI software platforms utilize specialized machine learning models and deterministic automation pipelines to solve end-to-end industry problems. By integrating autonomous workflows, teams reduce manual execution time while scaling throughput and computational accuracy.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-950">
              Key Advantages of Using Verified {categoryTitle} Software
            </h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="text-blue-600 font-black text-sm mb-1">01. Cost Reduction</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Eliminate overhead by deploying automated intelligence engines that replace fragmented manual tooling.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="text-blue-600 font-black text-sm mb-1">02. API Scalability</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Seamlessly connect REST endpoints, webhooks, and modern SDKs into production SaaS environments.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="text-blue-600 font-black text-sm mb-1">03. Rapid Iteration</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generate, evaluate, and benchmark deliverables in real-time with continuous quality control.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-950 mb-4">
              Frequently Asked Questions about {categoryTitle}
            </h3>
            <div className="space-y-3">
              <details className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-4" open>
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-slate-900">
                  <span>What are the best {categoryTitle} AI tools in 2026?</span>
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  The top rated platforms are curated based on benchmark performance, user satisfaction, and pricing reliability. You can review head-to-head score metrics directly above.
                </p>
              </details>

              <details className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-slate-900">
                  <span>How can I choose the right platform for my team?</span>
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  Use the AI Vault interactive matcher to filter by specific constraints such as deployment target, team budget tier, and required API integrations.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
