// app/category/[slug]/page.tsx
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import ToolLogo from "@/components/ToolLogo";
import { cleanAiContent } from "@/lib/content-quality";
import { formatAIScore, getToolScore, getScoreBarWidth } from "@/lib/score";

// Har 30 minute me ISR revalidate hoga taaki daily add hone wale 10 naye tools Googlebot ko instantly milein
export const revalidate = 1800;

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

type ToolRecord = {
  id?: string | number | null;
  slug: string;
  name: string;
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
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function formatCategoryName(slug: string): string {
  if (!slug) return "AI Tools";
  return decodeURIComponent(slug)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// 7 din ke andar add huye tools par automatically "✨ New" badge trigger hota hai
function isRecentlyAdded(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const toolDate = new Date(dateStr).getTime();
  const now = new Date().getTime();
  const diffDays = (now - toolDate) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug || "";
  const catName = formatCategoryName(slug);

  return {
    title: `Best ${catName} AI Tools (2026) — Verified Directory | AI Vault`,
    description: `Explore top-ranked ${catName} software platforms, benchmark scores, daily new additions, and verified free tiers on AI Vault.`,
    alternates: {
      canonical: `https://www.aivault.pp.ua/category/${slug}`,
    },
    openGraph: {
      title: `Best ${catName} AI Tools (2026) — AI Vault`,
      description: `Compare verified ${catName} platforms with benchmark intelligence.`,
      url: `https://www.aivault.pp.ua/category/${slug}`,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const rawSlug = resolvedParams?.slug || "";
  const cleanCategorySlug = decodeURIComponent(rawSlug).trim().toLowerCase();
  const categoryName = formatCategoryName(cleanCategorySlug);

  const supabase = getSupabase();

  // Category query: Sort by latest first for daily crawl, fallback by score
  const { data: rawTools, error } = await supabase
    .from("ai_tools")
    .select("*")
    .ilike("category", `%${cleanCategorySlug}%`)
    .order("created_at", { ascending: false, nullsFirst: false });

  if (error || !rawTools || rawTools.length === 0) {
    notFound();
  }

  const tools = rawTools as ToolRecord[];

  // Google ItemList Schema for Rich Search Snippets Indexing
  const categorySchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best ${categoryName} AI Tools`,
    description: `Verified directory of ${categoryName} tools benchmarked on AI Vault`,
    numberOfItems: tools.length,
    itemListElement: tools.slice(0, 20).map((t, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: t.name,
      url: `https://www.aivault.pp.ua/tool/${t.slug}`,
    })),
  };

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-24">
      {/* Schema Injection for Googlebot */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categorySchema) }}
      />

      {/* Top Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/compare"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
            >
              ⚖️ Compare Hub
            </Link>
            <Link
              href="/"
              className="text-xs font-bold text-slate-600 hover:text-blue-600 transition"
            >
              ← All Categories
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Category Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">
            <span>● Live Catalog</span>
            <span>•</span>
            <span>+10 Added Daily</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Top <span className="text-blue-600">{categoryName}</span> AI Tools
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Showing {tools.length} verified {categoryName.toLowerCase()} platforms. Evaluated for output quality, pricing models, and workflow automation.
          </p>
        </div>

        {/* Dynamic Tools Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const isNew = isRecentlyAdded(tool.created_at);
            const scoreVal = getToolScore(tool) ?? 92;
            const barWidth = getScoreBarWidth(scoreVal);
            const pricing = String(tool.pricing_model || tool.pricing || "Freemium");
            const cleanDesc =
              cleanAiContent(tool.overview || tool.description) ||
              `${tool.name} is an automated ${categoryName.toLowerCase()} platform built for high-performance workflows.`;

            return (
              <div
                key={tool.id || tool.slug}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-400 hover:shadow-md"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3.5">
                    <ToolLogo
                      name={tool.name}
                      src={tool.logo_url || tool.logo}
                      website={tool.website_url || tool.website}
                      size="md"
                    />
                    <div className="flex items-center gap-1.5">
                      {isNew && (
                        <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-600">
                          ✨ New
                        </span>
                      )}
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 font-mono">
                        {pricing}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h2 className="text-base font-black text-slate-950 group-hover:text-blue-600 transition-colors mb-1.5">
                    {tool.name}
                  </h2>
                  <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                    {cleanDesc}
                  </p>
                </div>

                {/* Score & Direct Outbound Portal Action */}
                <div>
                  <div className="border-t border-slate-100 pt-3 mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        AI Vault Benchmark
                      </span>
                      <span className="text-xs font-black text-blue-600">
                        {formatAIScore(scoreVal)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: barWidth }}
                      />
                    </div>
                  </div>

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
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Dossier →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
