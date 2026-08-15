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
    console.error("AI Vault query failed:", error);
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
    title: `${tool.name} — AI Intelligence & Evaluation | AI Vault`,
    description: desc || `Explore ${tool.name} AI capabilities, pricing, and features.`,
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

  // Normalized Authoritative Score (Strict 0-100 or null)
  const score = getToolScore(tool);
  const formattedScore = formatAIScore(score);
  const barWidth = getScoreBarWidth(score);

  // Related Tools Lookup
  const related = findRelatedTools(rows, tool, 6);

  // Official Website
  const officialWebsite = getWebsiteUrl(toolRecord);

  // Content Cleaning
  const rawText = String(tool.overview || tool.description || tool.short_description || "");
  const overview = cleanAiContent(rawText);

  // Structured Data Arrays
  const features = getFeatures(toolRecord);
  const useCases = getUseCases(toolRecord);
  const integrations = getIntegrations(toolRecord);
  const limitations = getLimitations(toolRecord);

  const category = typeof tool.category === "string" && tool.category.trim().length > 0
    ? tool.category.trim()
    : "AI Tool";

  const pricing = normalizePricing(tool.pricing_model || tool.pricing);
  const deployment = typeof tool.deployment === "string" && tool.deployment.trim() ? tool.deployment.trim() : null;
  const license = typeof tool.license === "string" && tool.license.trim() ? tool.license.trim() : null;

  const logoSrc = typeof tool.logo_url === "string" && tool.logo_url.trim().length > 0
    ? tool.logo_url.trim()
    : typeof tool.logo === "string" && tool.logo.trim().length > 0
      ? tool.logo.trim()
      : undefined;

  return (
    <main className="min-h-screen bg-[#f8faff] text-slate-950">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* BREADCRUMB */}
        <div className="mb-6 text-xs font-semibold text-slate-400">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="capitalize">{category}</span>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-600">{toolName}</span>
        </div>

        {/* HERO SECTION */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <ToolLogo name={toolName} src={logoSrc} size="lg" />

            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600">
                  Verified AI Tool
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
                  {category}
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {toolName}
              </h1>

              <div className="mt-3 flex items-center gap-3">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-bold text-slate-700">
                  {pricing}
                </span>
                {officialWebsite && (
                  <a
                    href={officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Official Portal ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* AI VAULT SCORE BOX */}
          <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                  AI Vault Score
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Canonical 0–100 evaluation
                </p>
              </div>

              <div className="text-right">
                {score !== null ? (
                  <p className="text-3xl font-black text-slate-950">
                    {score}
                    <span className="text-base font-bold text-slate-400">/100</span>
                  </p>
                ) : (
                  <p className="text-sm font-bold text-slate-400">
                    Score unavailable
                  </p>
                )}
              </div>
            </div>

            {score !== null && (
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 transition-all duration-500"
                  style={{ width: barWidth }}
                />
              </div>
            )}
          </div>

          {/* OVERVIEW */}
          <div className="mt-7 text-sm leading-relaxed text-slate-700">
            <p>
              {overview || "Overview information is not available in the current database record."}
            </p>
          </div>

          {/* SPECIFICATION PILLS */}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SpecCard label="Pricing Model" value={pricing} />
            <SpecCard label="Primary Category" value={category} />
            <SpecCard label="Deployment" value={deployment || "Web / Cloud"} />
          </div>
        </section>

        {/* KEY CAPABILITIES */}
        {features.length > 0 && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-950 mb-4">Key Capabilities</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* USE CASES */}
        {useCases.length > 0 && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-950 mb-3">Best Use Cases</h2>
            <div className="flex flex-wrap gap-2">
              {useCases.map((useCase, idx) => (
                <span key={idx} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  {useCase}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* INTEGRATIONS */}
        {integrations.length > 0 && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-950 mb-3">Platform & Integrations</h2>
            <div className="flex flex-wrap gap-2">
              {integrations.map((item, idx) => (
                <span key={idx} className="rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  {item}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* LIMITATIONS */}
        {limitations.length > 0 && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-950 mb-3">Considerations & Limitations</h2>
            <div className="space-y-2">
              {limitations.map((item, idx) => (
                <div key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* RELATED TOOLS */}
        {related.length > 0 && (
          <section className="mt-10">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-950">Discover Similar Tools</h2>
              <Link href="/" className="text-xs font-bold text-blue-600 hover:underline">View All →</Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => {
                const itemLogo = typeof item.logo_url === "string" && item.logo_url.trim()
                  ? item.logo_url.trim()
                  : typeof item.logo === "string" && item.logo.trim()
                    ? item.logo.trim()
                    : undefined;

                const itemCategory = typeof item.category === "string" && item.category.trim()
                  ? item.category.trim()
                  : "AI";

                const itemPricing = typeof item.pricing === "string" && item.pricing.trim()
                  ? item.pricing.trim()
                  : "Freemium";

                return (
                  <Link
                    key={String(item.id ?? item.slug ?? item.name)}
                    href={getToolHref(item)}
                    className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <ToolLogo name={String(item.name || "AI Tool")} src={itemLogo} size="sm" />
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-950 group-hover:text-blue-600 transition-colors">
                          {String(item.name || "AI Tool")}
                        </h3>
                        <p className="text-[10px] text-slate-400">{itemCategory}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{itemPricing}</span>
                      <span className="text-xs font-bold text-blue-600">Explore →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA BANNER */}
        {officialWebsite && (
          <section className="mt-10 rounded-3xl bg-[#040616] px-6 py-10 text-center text-white sm:px-10">
            <div className="inline-block rounded-full bg-blue-500/10 border border-blue-400/20 px-3 py-1 text-[10px] font-black tracking-widest text-blue-300 uppercase mb-3">
              Direct Access
            </div>
            <h2 className="text-2xl font-black sm:text-3xl">Get Started with {toolName}</h2>
            <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-slate-400">
              Access the official website to explore product plans, live demos, and documentation.
            </p>
            <a
              href={officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 text-xs font-black text-slate-950 transition hover:bg-slate-100 shadow-xl"
            >
              Visit Official Platform ↗
            </a>
          </section>
        )}

        {/* BACK LINK */}
        <div className="mt-8 pb-8 text-center">
          <Link href="/" className="text-xs font-black text-blue-600 hover:underline">
            ← Back to AI Directory
          </Link>
        </div>

      </div>
    </main>
  );
}

function SpecCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 text-center">
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-slate-900">{value}</p>
    </div>
  );
}
