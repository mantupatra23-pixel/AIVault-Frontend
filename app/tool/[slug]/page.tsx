// app/tool/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import ToolLogo from "@/components/ToolLogo";
import { findTool, findRelatedTools } from "@/lib/tool-lookup";
import { getToolHref } from "@/lib/tool-href";
import { getToolScore, formatAIScore } from "@/lib/score";
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
    console.error("Database query failed:", error);
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

  // Canonical Score (0-100)
  const score = getToolScore(tool);
  const formattedScore = formatAIScore(score);

  const related = findRelatedTools(rows, tool, 6);
  const officialWebsite = getWebsiteUrl(toolRecord);

  // Content
  const rawText = String(tool.overview || tool.description || tool.short_description || "");
  const overview = cleanAiContent(rawText);

  // Metadata arrays
  const features = getFeatures(toolRecord);
  const useCases = getUseCases(toolRecord);
  const integrations = getIntegrations(toolRecord);
  const limitations = getLimitations(toolRecord);

  const platforms = Array.isArray(tool.platforms)
    ? tool.platforms.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  const category = typeof tool.category === "string" && tool.category.trim().length > 0
    ? tool.category.trim()
    : "Productivity";

  const pricing = normalizePricing(tool.pricing_model || tool.pricing);
  const deployment = typeof tool.deployment === "string" && tool.deployment.trim() ? tool.deployment.trim() : "Not specified";
  const license = typeof tool.license === "string" && tool.license.trim() ? tool.license.trim() : "Not specified";

  const logoSrc = typeof tool.logo_url === "string" && tool.logo_url.trim().length > 0
    ? tool.logo_url.trim()
    : typeof tool.logo === "string" && tool.logo.trim().length > 0
      ? tool.logo.trim()
      : undefined;

  // Content Quality Calculation for Header Card
  const availableItems = [
    { label: "Tool name", available: Boolean(toolName) },
    { label: "Detailed overview", available: Boolean(overview) },
    { label: "Pricing information", available: pricing !== "Unknown" },
    { label: "Platform information", available: platforms.length > 0 || deployment !== "Not specified" },
    { label: "Official website", available: Boolean(officialWebsite) },
  ];

  const missingItems = [
    { label: "Features", missing: features.length === 0 },
    { label: "Use cases", missing: useCases.length === 0 },
    { label: "Integrations", missing: integrations.length === 0 },
  ].filter((item) => item.missing);

  const availableCount = availableItems.filter((i) => i.available).length;
  const qualityScore = Math.round((availableCount / (availableItems.length + 3)) * 100);
  const qualityGrade = qualityScore >= 80 ? "Grade A" : qualityScore >= 60 ? "Grade C" : "Grade D";
  const qualityLabel = qualityScore >= 80 ? "Good" : qualityScore >= 60 ? "Fair" : "Basic";

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900">
      {/* Top Brand Bar */}
      <header className="border-b border-slate-200/80 bg-white px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-base font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>
          {officialWebsite && (
            <a
              href={officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-slate-950 px-3.5 py-1.5 text-[11px] font-black tracking-wider text-white uppercase transition hover:bg-slate-800"
            >
              Visit Official Portal ↗
            </a>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        {/* Breadcrumb */}
        <div className="mb-4 text-[11px] font-medium text-slate-400">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span className="mx-2">/</span>
          <span className="capitalize">{category}</span>
          <span className="mx-2">/</span>
          <span className="text-slate-600">{toolName}</span>
        </div>

        {/* Hero Card */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <ToolLogo name={toolName} src={logoSrc} size="lg" />

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600">
                  Verified AI Tool
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                  {category}
                </span>
              </div>

              <h1 className="text-2xl font-black text-slate-950 sm:text-4xl">
                {toolName}
              </h1>

              {pricing && (
                <div className="mt-2">
                  <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
                    {pricing}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mt-5 text-[13px] leading-relaxed text-slate-600">
            <p>{overview || "Overview information is not available in the current database record."}</p>
          </div>

          {/* Spec Grid */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">AI Vault Score</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {score !== null ? `${score}/100` : "Score unavailable"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Pricing</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{pricing}</p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Category</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{category}</p>
            </div>
          </div>
        </section>

        {/* Layer 1 - Tool Intelligence */}
        <section className="mt-8">
          <div className="mb-4">
            <span className="text-[9px] font-bold uppercase tracking-widest text-blue-600">Layer 1</span>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Tool Intelligence</h2>
            <p className="text-xs text-slate-400">Understand this AI tool through features, use cases, pricing, platforms, and verified product information.</p>
          </div>

          {/* AI Vault Content Quality Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-950">AI Vault Content Quality</h3>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 border-slate-200 text-center font-bold text-slate-900">
                    <span className="text-xs">{qualityScore}</span>
                    <span className="text-[8px] text-slate-400">/ 100</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{qualityLabel}</p>
                    <p className="text-[10px] text-slate-400">{qualityGrade}</p>
                  </div>
                </div>
              </div>

              {/* Available items */}
              <div className="flex flex-wrap gap-1.5">
                {availableItems.filter((i) => i.available).map((item, idx) => (
                  <span key={idx} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Info Box */}
            {missingItems.length > 0 && (
              <div className="mt-4 rounded-xl bg-slate-50/70 p-3">
                <p className="text-[10px] font-semibold text-slate-500">Missing information</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {missingItems.map((item, idx) => (
                    <span key={idx} className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-medium text-slate-500">
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Tool Overview */}
        <section className="mt-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-sm font-bold text-slate-950">Tool Overview</h3>
          <p className="mt-3 text-xs leading-relaxed text-slate-600">
            {overview || "Overview information is not available in the current database record."}
          </p>
        </section>

        {/* Pricing */}
        <section className="mt-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-sm font-bold text-slate-950">Pricing</h3>
          <p className="mt-2 text-xs font-semibold text-slate-900">{pricing}</p>
          <p className="mt-1 text-[10px] text-slate-400">Check the official website for current pricing and availability.</p>
        </section>

        {/* Platforms */}
        <section className="mt-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-sm font-bold text-slate-950">Platforms</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(platforms.length > 0 ? platforms : ["Web"]).map((p, idx) => (
              <span key={idx} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-medium text-slate-600">
                {p}
              </span>
            ))}
          </div>
        </section>

        {/* Discover Similar Tools */}
        {related.length > 0 && (
          <section className="mt-6">
            <h3 className="text-sm font-bold text-slate-950 mb-3">Discover Similar Tools</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {related.map((item) => (
                <Link
                  key={String(item.id ?? item.slug ?? item.name)}
                  href={getToolHref(item)}
                  className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-slate-300"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ToolLogo name={String(item.name || "AI Tool")} src={item.logo_url as string} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900">{String(item.name || "AI Tool")}</p>
                      <p className="text-[9px] text-slate-400 capitalize">{String(item.category || "AI")}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600">Explore →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Official Website Button */}
        {officialWebsite && (
          <section className="mt-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-sm font-bold text-slate-950">Official Website</h3>
            <a
              href={officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              Visit Official Website →
            </a>
          </section>
        )}

        {/* CTA Card */}
        {officialWebsite && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-center sm:p-8">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Official Access</span>
            <h3 className="mt-1 text-base font-bold text-slate-950">Try {toolName}</h3>
            <p className="mt-1 text-xs text-slate-500">Visit the official platform for current product information and availability.</p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <a
                href={officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
              >
                VISIT OFFICIAL PORTAL ↗
              </a>
              <Link
                href="/"
                className="inline-block rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                ← Back to Directory
              </Link>
            </div>
          </section>
        )}

        {/* About Section */}
        <section className="mt-8">
          <h3 className="text-sm font-bold text-slate-950">About {toolName}</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            {overview || `${toolName} is an automated intelligence tool built for ${category.toLowerCase()} workflows.`}
          </p>
        </section>

        {/* Key Features */}
        <section className="mt-4">
          <h4 className="text-xs font-bold text-slate-950">Key Features</h4>
          <div className="mt-1.5 rounded-xl bg-slate-50/70 p-3 text-xs text-slate-400">
            {features.length > 0 ? (
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                {features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            ) : (
              "Features have not been specified by the source."
            )}
          </div>
        </section>

        {/* Use Cases */}
        <section className="mt-4">
          <h4 className="text-xs font-bold text-slate-950">Use Cases</h4>
          <div className="mt-1.5 rounded-xl bg-slate-50/70 p-3 text-xs text-slate-400">
            {useCases.length > 0 ? (
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                {useCases.map((u, i) => <li key={i}>{u}</li>)}
              </ul>
            ) : (
              "Use cases have not been specified by the source."
            )}
          </div>
        </section>

        {/* Platform Details Box */}
        <section className="mt-4">
          <h4 className="text-xs font-bold text-slate-950">Platform Details</h4>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[9px] font-bold uppercase text-slate-400">Operating System</p>
              <p className="mt-1 text-xs font-bold text-slate-900">Not specified</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[9px] font-bold uppercase text-slate-400">Deployment</p>
              <p className="mt-1 text-xs font-bold text-slate-900">{deployment}</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[9px] font-bold uppercase text-slate-400">License</p>
              <p className="mt-1 text-xs font-bold text-slate-900">{license}</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[9px] font-bold uppercase text-slate-400">Pricing</p>
              <p className="mt-1 text-xs font-bold text-slate-900">{pricing}</p>
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="mt-4">
          <h4 className="text-xs font-bold text-slate-950">Integrations</h4>
          <div className="mt-1.5 rounded-xl bg-slate-50/70 p-3 text-xs text-slate-400">
            {integrations.length > 0 ? (
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                {integrations.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            ) : (
              "Integration information has not been specified by the source."
            )}
          </div>
        </section>

        {/* Limitations */}
        <section className="mt-4">
          <h4 className="text-xs font-bold text-slate-950">Limitations</h4>
          <div className="mt-1.5 rounded-xl bg-slate-50/70 p-3 text-xs text-slate-400">
            {limitations.length > 0 ? (
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                {limitations.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            ) : (
              "Limitations have not been specified by the source."
            )}
          </div>
        </section>

        {/* Dark Footer CTA */}
        {officialWebsite && (
          <section className="mt-8 rounded-2xl bg-[#070913] px-6 py-10 text-center text-white sm:px-10">
            <h3 className="text-xl font-black sm:text-2xl">Ready to explore {toolName}?</h3>
            <p className="mt-1 text-xs text-slate-400">Visit the official platform to verify the latest product information.</p>
            <a
              href={officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block rounded-xl bg-white px-6 py-2.5 text-xs font-black text-slate-950 shadow-md transition hover:bg-slate-100"
            >
              VISIT OFFICIAL PORTAL ↗
            </a>
          </section>
        )}

        <footer className="mt-8 border-t border-slate-200 pt-6 pb-6 text-center text-[10px] text-slate-400">
          © 2026 AI Vault. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
