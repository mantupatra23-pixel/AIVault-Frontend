// app/tool/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import ToolLogo from "@/components/ToolLogo";
import { findTool, findRelatedTools } from "@/lib/tool-lookup";
import { getToolHref } from "@/lib/tool-href";
import { getToolScore, formatAIScore, getScoreBarWidth } from "@/lib/score";
import { cleanAiContent } from "@/lib/content-quality";
import { 
  getFeatures, 
  getUseCases, 
  getLimitations, 
  getIntegrations, 
  normalizePricing, 
  getWebsiteUrl,
  type ToolRecord 
} from "@/lib/ai-vault";
import { createClient } from "@/lib/supabase/server";

// Force Dynamic Rendering taaki cache na ho
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getAllTools() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ai_tools").select("*");
  if (error) {
    console.error("AI Vault tools query failed:", error);
    return [];
  }
  return (data ?? []) as Record<string, unknown>[];
}

async function getCurrentTool(slug: string) {
  const rows = await getAllTools();
  return {
    tool: findTool(rows, slug),
    rows,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { tool } = await getCurrentTool(slug);

  if (!tool) {
    return { title: "Tool Not Found | AI Vault" };
  }

  const raw = String(tool.overview || tool.description || "");
  const desc = cleanAiContent(raw);

  return {
    title: `${tool.name} | AI Vault`,
    description: desc || "Explore verified AI tool intelligence on AI Vault.",
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const { tool, rows } = await getCurrentTool(slug);

  if (!tool) {
    notFound();
  }

  const toolRecord = tool as ToolRecord;
  const toolName = String(tool.name || "AI Tool");

  // 1. Normalized Score (0-100)
  const score = getToolScore(tool);
  const formattedScore = formatAIScore(score);
  const barWidth = getScoreBarWidth(score);

  // 2. Related Tools
  const related = findRelatedTools(rows, tool, 6);

  // 3. Official Website
  const officialWebsite = getWebsiteUrl(toolRecord);

  // 4. Content Cleaning (STRIPS ALL PARAGRAPH JUNK)
  const rawText = String(tool.overview || tool.description || tool.short_description || "");
  const overview = cleanAiContent(rawText);

  // 5. Structured Data
  const features = getFeatures(toolRecord);
  const useCases = getUseCases(toolRecord);
  const integrations = getIntegrations(toolRecord);
  const limitations = getLimitations(toolRecord);

  const platforms = Array.isArray(tool.platforms)
    ? tool.platforms.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  const category = typeof tool.category === "string" && tool.category.trim().length > 0
    ? tool.category.trim()
    : "Other";

  const pricing = normalizePricing(tool.pricing_model || tool.pricing);

  const deployment = typeof tool.deployment === "string" && tool.deployment.trim().length > 0
    ? tool.deployment.trim()
    : "Not specified";

  const license = typeof tool.license === "string" && tool.license.trim().length > 0
    ? tool.license.trim()
    : "Not specified";

  const logoSrc = typeof tool.logo_url === "string" && tool.logo_url.trim().length > 0
    ? tool.logo_url.trim()
    : typeof tool.logo === "string" && tool.logo.trim().length > 0
      ? tool.logo.trim()
      : undefined;

  return (
    <main className="min-h-screen bg-[#f7f8fc]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* BREADCRUMB */}
        <div className="mb-6 text-xs text-slate-400">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span className="mx-2">/</span>
          <span>{category}</span>
          <span className="mx-2">/</span>
          <span className="text-slate-500">{toolName}</span>
        </div>

        {/* HERO */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <ToolLogo name={toolName} src={logoSrc} size="lg" />

            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Verified AI Tool
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {category}
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {toolName}
              </h1>

              <div className="mt-3">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                  {pricing}
                </span>
              </div>
            </div>
          </div>

          {/* AI VAULT SCORE */}
          <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  AI Vault Score
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Canonical 0–100 evaluation
                </p>
              </div>

              {score !== null ? (
                <div className="text-right">
                  <p className="text-3xl font-black text-slate-950">
                    {score}
                    <span className="text-base font-bold text-slate-400">/100</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-400">
                  Score unavailable
                </p>
              )}
            </div>

            {score !== null && (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
                  style={{ width: barWidth }}
                />
              </div>
            )}
          </div>

          {/* OVERVIEW */}
          <div className="mt-8">
            {overview ? (
              <p className="text-sm leading-7 text-slate-600">{overview}</p>
            ) : (
              <p className="text-sm leading-7 text-slate-400">
                Overview information is not available in the current database record.
              </p>
            )}
          </div>

          {/* META */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <InfoCard label="AI Vault Score" value={formattedScore} />
            <InfoCard label="Pricing" value={pricing} />
            <InfoCard label="Category" value={category} />
          </div>
        </section>

        {/* TOOL INTELLIGENCE */}
        <section className="mt-10">
          <div className="mb-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">Layer 1</span>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Tool Intelligence</h2>
            <p className="mt-1 text-sm text-slate-400">Available product information from the AI Vault database.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">AI Vault Content Quality</h3>
            <p className="mt-1 text-xs text-slate-400">Completeness of the available database information.</p>
            <div className="mt-5 rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">This information is separate from the AI Vault Score.</p>
            </div>
          </div>
        </section>

        {/* TOOL OVERVIEW */}
        <ContentSection
          title="Tool Overview"
          content={overview || "Overview information is not available in the current database record."}
        />

        {/* FEATURES */}
        <ListSection
          title="Key Features"
          items={features}
          empty="Feature information is not available in the current database record."
        />

        {/* USE CASES */}
        <ListSection
          title="Use Cases"
          items={useCases}
          empty="Use-case information is not available in the current database record."
        />

        {/* PRICING */}
        <ContentSection title="Pricing" content={pricing} />

        {/* PLATFORM */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Platform Details</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoCard label="Platforms" value={platforms.length ? platforms.join(", ") : "Not specified"} />
            <InfoCard label="Deployment" value={deployment} />
            <InfoCard label="License" value={license} />
            <InfoCard label="Pricing" value={pricing} />
          </div>
        </section>

        {/* INTEGRATIONS */}
        <ListSection
          title="Integrations"
          items={integrations}
          empty="Integration information is not available in the current database record."
        />

        {/* LIMITATIONS */}
        <ListSection
          title="Limitations"
          items={limitations}
          empty="No specific limitations have been recorded in the current database entry."
        />

        {/* RELATED */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-5 text-2xl font-bold text-slate-950">Discover Similar Tools</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => {
                const itemLogo = typeof item.logo_url === "string" && item.logo_url.trim().length > 0
                  ? item.logo_url.trim()
                  : typeof item.logo === "string" && item.logo.trim().length > 0
                    ? item.logo.trim()
                    : undefined;

                const itemCategory = typeof item.category === "string" && item.category.trim().length > 0
                  ? item.category.trim()
                  : "Other";

                const itemPricing = typeof item.pricing === "string" && item.pricing.trim().length > 0
                  ? item.pricing.trim()
                  : typeof item.pricing_model === "string" && item.pricing_model.trim().length > 0
                    ? item.pricing_model.trim()
                    : "Not specified";

                return (
                  <Link
                    key={String(item.id ?? item.slug ?? item.name)}
                    href={getToolHref(item)}
                    className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <ToolLogo name={String(item.name || "AI Tool")} src={itemLogo} size="sm" />
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-950">{String(item.name || "AI Tool")}</h3>
                        <p className="text-[10px] text-slate-400">{itemCategory}</p>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{itemPricing}</span>
                      <span className="text-xs font-bold text-blue-600">Explore →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* OFFICIAL WEBSITE */}
        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Official Website</h2>
          {officialWebsite ? (
            <a
              href={officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-600"
            >
              Visit Official Website ↗
            </a>
          ) : (
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-400">
              Official website is not available in the current database record.
            </div>
          )}
        </section>

        {/* BACK LINK */}
        <div className="mt-8 pb-10 text-center">
          <Link href="/" className="text-sm font-bold text-blue-600">
            ← Back to AI Directory
          </Link>
        </div>

      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function ContentSection({ title, content }: { title: string; content: string }) {
  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">{content}</p>
    </section>
  );
}

function ListSection({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      {items.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span key={`${item}-${index}`} className="rounded-full bg-slate-50 px-4 py-2 text-xs text-slate-600">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">{empty}</div>
      )}
    </section>
  );
}
