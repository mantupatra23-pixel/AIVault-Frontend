// app/category/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import ToolLogo from "@/components/ToolLogo";
import { createClient } from "@/lib/supabase/server";
import { getToolScore, formatAIScore, getScoreBarWidth } from "@/lib/score";
import { cleanAiContent } from "@/lib/content-quality";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = decodeURIComponent(slug).replace(/-/g, " ");

  return {
    title: `Best ${categoryName.toUpperCase()} AI Tools (2026 Directory) | AI Vault`,
    description: `Discover, filter, and compare top-rated ${categoryName} AI tools and software.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const categoryParam = decodeURIComponent(slug).replace(/-/g, " ");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_tools")
    .select("*")
    .ilike("category", categoryParam)
    .order("name", { ascending: true });

  if (error || !data || data.length === 0) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-base font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>
          <Link href="/" className="text-xs font-bold text-blue-600">
            ← All Categories
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Category Hub</span>
          <h1 className="mt-1 text-3xl font-black capitalize text-slate-950">
            {categoryParam} AI Tools
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Showing {data.length} verified AI software tools in {categoryParam}.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((tool) => {
            const name = String(tool.name || "AI Tool");
            const toolSlug = String(tool.slug || "");
            const pricing = String(tool.pricing_model || tool.pricing || "Freemium");
            const score = getToolScore(tool);
            const formattedScore = formatAIScore(score);
            const barWidth = getScoreBarWidth(score);
            const desc = cleanAiContent(tool.description || tool.overview || "");

            return (
              <Link
                key={tool.id || toolSlug}
                href={`/tool/${encodeURIComponent(toolSlug)}`}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <ToolLogo src={tool.logo_url as string} name={name} size="md" />
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-black text-slate-950 group-hover:text-blue-600">
                          {name}
                        </h3>
                        <p className="text-[11px] font-medium text-slate-400">{categoryParam}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                      {pricing}
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-slate-600">
                    {desc || `${name} provides intelligence solutions for ${categoryParam}.`}
                  </p>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase text-slate-400">Score</span>
                    <span className="text-xs font-bold text-blue-600">{formattedScore}</span>
                  </div>
                  {score !== null && (
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 mb-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                        style={{ width: barWidth }}
                      />
                    </div>
                  )}
                  <div className="text-right text-[10px] font-bold text-blue-600">
                    Explore Details →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
