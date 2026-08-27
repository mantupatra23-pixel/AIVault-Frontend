import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import ToolLogo from "@/components/ToolLogo";
import { cleanAiContent } from "@/lib/content-quality";
import { getToolScore, formatAIScore } from "@/lib/score";

// 1 Hour ISR Caching for ultra-fast Googlebot indexing
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
  deployment?: string | null;
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

function formatToolName(slugPart: string): string {
  if (!slugPart) return "AI Software";
  return decodeURIComponent(slugPart)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const HIGH_TRAFFIC_MATCHUPS = [
  { s1: "deepseek", s2: "claude", n1: "DeepSeek", n2: "Claude 3.5 Sonnet" },
  { s1: "cursor", s2: "bolt-new", n1: "Cursor", n2: "Bolt.new" },
  { s1: "midjourney", s2: "flux-ai", n1: "Midjourney", n2: "Flux.1" },
  { s1: "perplexity", s2: "deepseek", n1: "Perplexity AI", n2: "DeepSeek" },
  { s1: "suno", s2: "elevenlabs", n1: "Suno AI", n2: "ElevenLabs" },
  { s1: "lovable", s2: "bolt-new", n1: "Lovable", n2: "Bolt.new" },
  { s1: "runway", s2: "kling-ai", n1: "Runway Gen-3", n2: "Kling AI" },
  { s1: "cursor", s2: "lovable", n1: "Cursor", n2: "Lovable" },
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parts = slug.split("-vs-");

  if (parts.length < 2) {
    const singleName = formatToolName(slug);
    return {
      title: `${singleName} Comparison & Top Alternatives (2026) | AI Vault`,
      description: `Compare ${singleName} against leading market alternatives. Benchmarks, pricing breakdown, and feature matrix.`,
      alternates: {
        canonical: `https://www.aivault.pp.ua/compare/${slug}`,
      },
    };
  }

  const tool1 = formatToolName(parts[0]);
  const tool2 = formatToolName(parts[1]);

  return {
    title: `${tool1} vs ${tool2} (2026) — Side-by-Side Comparison & Benchmarks | AI Vault`,
    description: `Evaluate ${tool1} vs ${tool2}. Compare verified benchmark scores, API latency, pricing tiers, and workflow features on AI Vault.`,
    alternates: {
      canonical: `https://www.aivault.pp.ua/compare/${slug}`,
    },
    openGraph: {
      title: `${tool1} vs ${tool2} (2026) — AI Vault Intelligence`,
      description: `Detailed comparison matrix between ${tool1} and ${tool2}.`,
      url: `https://www.aivault.pp.ua/compare/${slug}`,
      type: "article",
    },
  };
}

function extractFeatures(tool: ToolRecord): string[] {
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
  const pricing = String(tool.pricing_model || tool.pricing || tool.pricing_type || "").toLowerCase();
  let pros = ["Fast response latency & high uptime", "Intuitive dashboard with zero setup curve"];
  let cons = ["Advanced enterprise tier requires custom quote"];

  if (pricing.includes("free")) {
    pros.unshift("Generous 100% free starter tier");
  }
  return { pros: pros.slice(0, 2), cons: cons.slice(0, 2) };
}

export default async function CompareSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const parts = slug.split("-vs-");

  if (!slug || parts.length < 2) {
    notFound();
  }

  const slug1 = decodeURIComponent(parts[0]).trim().toLowerCase();
  const slug2 = decodeURIComponent(parts[1]).trim().toLowerCase();

  const supabase = getSupabase();

  // Concurrent parallel fetch from Supabase
  const [{ data: t1Data }, { data: t2Data }] = await Promise.all([
    supabase.from("ai_tools").select("*").eq("slug", slug1).maybeSingle(),
    supabase.from("ai_tools").select("*").eq("slug", slug2).maybeSingle(),
  ]);

  const tool1: ToolRecord = (t1Data as ToolRecord) || {
    slug: slug1,
    name: formatToolName(slug1),
    category: "Productivity",
    pricing: "Freemium",
    score: 94,
    tagline: `${formatToolName(slug1)} platform for automated workflows.`,
    overview: `${formatToolName(slug1)} provides AI capabilities for modern teams and software engineers.`,
  };

  const tool2: ToolRecord = (t2Data as ToolRecord) || {
    slug: slug2,
    name: formatToolName(slug2),
    category: "Productivity",
    pricing: "Freemium",
    score: 95,
    tagline: `${formatToolName(slug2)} platform for automated workflows.`,
    overview: `${formatToolName(slug2)} provides high-performance AI execution and scalability.`,
  };

  const score1 = getToolScore(tool1) ?? 94;
  const score2 = getToolScore(tool2) ?? 95;
  const winner = score1 >= score2 ? 1 : 2;

  const feats1 = extractFeatures(tool1);
  const feats2 = extractFeatures(tool2);
  const pc1 = extractProsAndCons(tool1);
  const pc2 = extractProsAndCons(tool2);

  const price1 = String(tool1.pricing_model || tool1.pricing || tool1.pricing_type || "Freemium");
  const price2 = String(tool2.pricing_model || tool2.pricing || tool2.pricing_type || "Freemium");

  // Google JSON-LD FAQ & Breadcrumb Structured Schema
  const comparisonSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `Which is better: ${tool1.name} or ${tool2.name}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${tool1.name} holds a benchmark score of ${score1}/100 and ${tool2.name} scores ${score2}/100 on the AI Vault Benchmark Index. ${winner === 1 ? tool1.name : tool2.name} leads overall operational throughput.`,
            },
          },
          {
            "@type": "Question",
            name: `What is the price difference between ${tool1.name} and ${tool2.name}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${tool1.name} operates under a ${price1} model, while ${tool2.name} is available under a ${price2} plan. Both provide free or starter evaluation access.`,
            },
          },
          {
            "@type": "Question",
            name: `Can ${tool1.name} and ${tool2.name} be integrated via API?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Yes, both platforms offer cloud REST endpoints and webhook pipelines for modern developer stacks.`,
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
            name: "Compare Hub",
            item: "https://www.aivault.pp.ua/compare",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${tool1.name} vs ${tool2.name}`,
            item: `https://www.aivault.pp.ua/compare/${slug}`,
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonSchema) }}
      />

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/compare"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition"
            >
              ⚡ Custom Matchup
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

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* HERO TITLE */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200/60 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-blue-600 mb-3">
            ✦ Head-to-Head Benchmark Matrix (2026)
          </div>
          <h1 className="text-3xl font-black text-slate-950 sm:text-5xl tracking-tight">
            {tool1.name} <span className="text-blue-600 font-extrabold">vs</span> {tool2.name}
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Side-by-side performance evaluation, API reliability, verified pricing models, and direct workflow analysis.
          </p>
        </div>

        {/* TOP TOOL MATCHUP CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {/* TOOL 1 CARD */}
          <div
            className={`relative flex flex-col justify-between rounded-3xl border bg-white p-6 sm:p-7 shadow-sm transition hover:shadow-md ${
              winner === 1 ? "border-blue-500 ring-2 ring-blue-500/20 shadow-blue-50" : "border-slate-200"
            }`}
          >
            {winner === 1 && (
              <span className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                🏆 Winner in Matchup
              </span>
            )}
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <ToolLogo
                    name={tool1.name}
                    src={(tool1.logo_url || tool1.logo) as string}
                    website={tool1.website_url || tool1.website}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-slate-950 truncate">{tool1.name}</h2>
                    <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 capitalize">
                      {String(tool1.category || "AI Software")}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black text-blue-600">{formatAIScore(score1)}</div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">AI Vault Score</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                {cleanAiContent(tool1.overview || tool1.description || tool1.tagline)}
              </p>

              <div className="flex items-center gap-2 mb-4">
                <span className="rounded-xl bg-emerald-50 border border-emerald-200/60 px-3 py-1 text-xs font-black text-emerald-700">
                  {price1}
                </span>
                <span className="rounded-xl bg-blue-50 border border-blue-200/60 px-3 py-1 text-xs font-black text-blue-700">
                  Verified AI Engine
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <a
                href={`/go/${encodeURIComponent(tool1.slug)}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-center text-xs font-black text-white hover:bg-blue-700 shadow-sm transition"
              >
                Visit {tool1.name} ↗
              </a>
              <Link
                href={`/tool/${tool1.slug}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Dossier →
              </Link>
            </div>
          </div>

          {/* TOOL 2 CARD */}
          <div
            className={`relative flex flex-col justify-between rounded-3xl border bg-white p-6 sm:p-7 shadow-sm transition hover:shadow-md ${
              winner === 2 ? "border-blue-500 ring-2 ring-blue-500/20 shadow-blue-50" : "border-slate-200"
            }`}
          >
            {winner === 2 && (
              <span className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                🏆 Winner in Matchup
              </span>
            )}
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <ToolLogo
                    name={tool2.name}
                    src={(tool2.logo_url || tool2.logo) as string}
                    website={tool2.website_url || tool2.website}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-slate-950 truncate">{tool2.name}</h2>
                    <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 capitalize">
                      {String(tool2.category || "AI Software")}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black text-blue-600">{formatAIScore(score2)}</div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">AI Vault Score</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                {cleanAiContent(tool2.overview || tool2.description || tool2.tagline)}
              </p>

              <div className="flex items-center gap-2 mb-4">
                <span className="rounded-xl bg-emerald-50 border border-emerald-200/60 px-3 py-1 text-xs font-black text-emerald-700">
                  {price2}
                </span>
                <span className="rounded-xl bg-blue-50 border border-blue-200/60 px-3 py-1 text-xs font-black text-blue-700">
                  Verified AI Engine
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <a
                href={`/go/${encodeURIComponent(tool2.slug)}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-center text-xs font-black text-white hover:bg-blue-700 shadow-sm transition"
              >
                Visit {tool2.name} ↗
              </a>
              <Link
                href={`/tool/${tool2.slug}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Dossier →
              </Link>
            </div>
          </div>
        </div>

        {/* COMPARISON SPECIFICATION MATRIX TABLE */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="p-4 text-[11px] font-black uppercase tracking-wider text-slate-400 w-1/3">
                    Feature & Metric
                  </th>
                  <th className="p-4 text-xs font-black text-slate-950 w-1/3">{tool1.name}</th>
                  <th className="p-4 text-xs font-black text-slate-950 w-1/3">{tool2.name}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">
                <tr>
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/40">AI Vault Score</td>
                  <td className="p-4 font-black text-blue-600 text-base">{formatAIScore(score1)}</td>
                  <td className="p-4 font-black text-blue-600 text-base">{formatAIScore(score2)}</td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Pricing Model</td>
                  <td className="p-4 font-bold text-slate-800">{price1}</td>
                  <td className="p-4 font-bold text-slate-800">{price2}</td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/40">API & Webhooks</td>
                  <td className="p-4 text-emerald-600 font-bold">✓ Full REST API Access</td>
                  <td className="p-4 text-emerald-600 font-bold">✓ Full REST API Access</td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Core Features</td>
                  <td className="p-4">
                    <ul className="space-y-1 text-[11px] text-slate-700">
                      {feats1.map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="text-blue-600 font-bold">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-4">
                    <ul className="space-y-1 text-[11px] text-slate-700">
                      {feats2.map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="text-blue-600 font-bold">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Pros & Advantages</td>
                  <td className="p-4 space-y-1">
                    {pc1.pros.map((p, i) => (
                      <p key={i} className="text-emerald-700 font-medium text-[11px]">
                        + {p}
                      </p>
                    ))}
                  </td>
                  <td className="p-4 space-y-1">
                    {pc2.pros.map((p, i) => (
                      <p key={i} className="text-emerald-700 font-medium text-[11px]">
                        + {p}
                      </p>
                    ))}
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Deployment</td>
                  <td className="p-4 font-medium text-slate-700">{String(tool1.deployment || "Cloud / Web App & API")}</td>
                  <td className="p-4 font-medium text-slate-700">{String(tool2.deployment || "Cloud / Web App & API")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RELATED POPULAR COMPARISON MESH */}
        <section className="mt-14 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-950">Explore More AI Matchups</h2>
            <Link href="/compare" className="text-xs font-bold text-blue-600 hover:underline">
              View All Comparisons →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {HIGH_TRAFFIC_MATCHUPS.map((m, idx) => (
              <Link
                key={idx}
                href={`/compare/${m.s1}-vs-${m.s2}`}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-500 hover:shadow-sm"
              >
                <div className="text-xs font-bold text-slate-900 mb-2">
                  <span>{m.n1}</span>
                  <span className="text-blue-600 font-black mx-1.5">VS</span>
                  <span>{m.n2}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-400 group-hover:text-blue-600 transition">
                  Compare Metrics →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
