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
    console.error("AI Vault database query failed:", error);
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
    title: `${tool.name} — Review, Pricing & FAQ | AI Vault`,
    description: desc || `Explore ${tool.name} AI capabilities, pricing, FAQs, and pros/cons.`,
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

  const score = getToolScore(tool);
  const formattedScore = formatAIScore(score);

  const related = findRelatedTools(rows, tool, 6);
  const officialWebsite = getWebsiteUrl(toolRecord);

  const rawText = String(tool.overview || tool.description || tool.short_description || "");
  const overview = cleanAiContent(rawText) || `${toolName} is an AI-powered solution built to streamline ${String(tool.category || "digital").toLowerCase()} workflows.`;

  const rawFeatures = getFeatures(toolRecord);
  const features = rawFeatures.length > 0 ? rawFeatures : [
    `Automated ${String(tool.category || "AI").toLowerCase()} processing and intelligence`,
    "Streamlined user interface and quick workspace integration",
    "Cloud-based operational capabilities with high availability",
    "Comprehensive workflow acceleration tools"
  ];

  const rawUseCases = getUseCases(toolRecord);
  const useCases = rawUseCases.length > 0 ? rawUseCases : [
    `${String(tool.category || "AI")} automation`,
    "Team productivity workflows",
    "Business workflow optimization"
  ];

  const category = typeof tool.category === "string" && tool.category.trim().length > 0
    ? tool.category.trim()
    : "Productivity";

  const rawPricing = normalizePricing(tool.pricing_model || tool.pricing);
  const pricingStr = String(rawPricing || "Freemium");
  const deployment = typeof tool.deployment === "string" && tool.deployment.trim() ? tool.deployment.trim() : "Cloud / Web App";
  const license = typeof tool.license === "string" && tool.license.trim() ? tool.license.trim() : "Proprietary";

  const logoSrc = typeof tool.logo_url === "string" && tool.logo_url.trim().length > 0
    ? tool.logo_url.trim()
    : typeof tool.logo === "string" && tool.logo.trim().length > 0
      ? tool.logo.trim()
      : undefined;

  // Dynamic FAQs
  const faqs = [
    {
      q: `What is ${toolName} and what does it do?`,
      a: `${toolName} is a verified AI tool in the ${category} category designed to help teams and professionals automate tasks, save time, and increase productivity.`
    },
    {
      q: `What is the pricing model for ${toolName}?`,
      a: `${toolName} is listed under the "${pricingStr}" pricing tier. You can check the official portal for current tiers, trial options, and subscription details.`
    },
    {
      q: `How is the AI Vault Score calculated for ${toolName}?`,
      a: `${toolName} has an AI Vault Score of ${formattedScore}. This score evaluates catalog reliability, data quality, user accessibility, and category performance.`
    },
    {
      q: `Where can I access ${toolName}?`,
      a: `You can access ${toolName} directly via its official web platform and deployment infrastructure (${deployment}).`
    }
  ];

  // Schema.org FAQ JSON-LD
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header */}
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
              VISIT OFFICIAL PORTAL ↗
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

        {/* Hero Section */}
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

              <div className="mt-2 flex items-center gap-2">
                <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
                  {pricingStr}
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

          <div className="mt-5 text-[13px] leading-relaxed text-slate-600">
            <p>{overview}</p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">AI Vault Score</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{formattedScore}</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Pricing Tier</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{pricingStr}</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Category</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{category}</p>
            </div>
          </div>
        </section>

        {/* Pros & Cons Section */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <span>✓</span> Highlights & Pros
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-emerald-950">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">•</span>
                <span>Optimized for fast {category.toLowerCase()} workflow execution</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">•</span>
                <span>Clear {pricingStr} access model with straightforward setup</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">•</span>
                <span>Modern cloud architecture for reliable daily performance</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>ℹ</span> Considerations
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-400">•</span>
                <span>Features and API access subject to plan limits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-400">•</span>
                <span>Requires active internet connectivity for cloud operations</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Features & Use Cases */}
        <section className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-sm font-bold text-slate-950">Key Capabilities & Features</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700">
                <span className="font-bold text-blue-600">✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>

          <h3 className="mt-6 text-sm font-bold text-slate-950">Best Use Cases</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {useCases.map((u, i) => (
              <span key={i} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                {u}
              </span>
            ))}
          </div>
        </section>

        {/* FAQ Section (F&Q) */}
        <section className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Q&A</span>
            <h3 className="text-base font-black text-slate-950">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <details key={idx} className="group rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition open:bg-white open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-slate-900">
                  <span>{faq.q}</span>
                  <span className="ml-2 font-bold text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 border-t border-slate-100 pt-2">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Similar Tools */}
        {related.length > 0 && (
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-950">Discover Similar Tools</h3>
              <Link href={`/?cat=${encodeURIComponent(category)}`} className="text-[10px] font-bold text-blue-600 hover:underline">
                View All →
              </Link>
            </div>

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
                      <p className="truncate text-xs font-bold text-slate-950 group-hover:text-blue-600 transition-colors">
                        {String(item.name || "AI Tool")}
                      </p>
                      <p className="text-[9px] text-slate-400 capitalize">{String(item.category || "AI")}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600">Explore →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA Banner */}
        {officialWebsite && (
          <section className="mt-8 rounded-2xl bg-[#070913] px-6 py-10 text-center text-white sm:px-10">
            <h3 className="text-xl font-black sm:text-2xl">Ready to explore {toolName}?</h3>
            <p className="mt-1 text-xs text-slate-400">Visit the official platform to get started with latest features.</p>
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
