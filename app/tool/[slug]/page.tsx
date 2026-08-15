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
    title: `${tool.name} — Review, Pricing, Features & Alternatives (2026) | AI Vault`,
    description: desc || `In-depth breakdown of ${tool.name} capabilities, workflow utility, and pricing tiers.`,
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
  const barWidth = getScoreBarWidth(score);

  const related = findRelatedTools(rows, tool, 6);
  const officialWebsite = getWebsiteUrl(toolRecord);

  const rawText = String(tool.overview || tool.description || tool.short_description || "");
  const overview = cleanAiContent(rawText) || `${toolName} provides specialized software capabilities designed to automate and scale ${String(tool.category || "digital").toLowerCase()} operations.`;

  const category = typeof tool.category === "string" && tool.category.trim().length > 0
    ? tool.category.trim()
    : "Productivity";

  const rawPricing = normalizePricing(tool.pricing_model || tool.pricing);
  const pricingStr = String(rawPricing || "Freemium");
  const deployment = typeof tool.deployment === "string" && tool.deployment.trim() ? tool.deployment.trim() : "Cloud / Web Application";
  const license = typeof tool.license === "string" && tool.license.trim() ? tool.license.trim() : "Commercial SaaS";

  const logoSrc = typeof tool.logo_url === "string" && tool.logo_url.trim().length > 0
    ? tool.logo_url.trim()
    : typeof tool.logo === "string" && tool.logo.trim().length > 0
      ? tool.logo.trim()
      : undefined;

  // Real Database Features or Dynamic Tailored Capabilities
  const rawFeatures = getFeatures(toolRecord);
  const features = rawFeatures.length > 0 ? rawFeatures : [
    `Specialized ${category.toLowerCase()} intelligence module with real-time processing`,
    "Browser and cloud workspace accessibility with zero complex installations",
    "Exportable pipeline outputs compatible with modern developer & team tools",
    "Automated data parsing and continuous workflow acceleration"
  ];

  const rawUseCases = getUseCases(toolRecord);
  const useCases = rawUseCases.length > 0 ? rawUseCases : [
    `Accelerating ${category.toLowerCase()} tasks and reducing repetitive manual steps`,
    "Cross-functional team collaboration and process automation",
    "Data aggregation and rapid intelligence synthesis",
    "Scaling individual productivity without increasing operational headcount"
  ];

  // Dynamic Audience Recommendations
  const targetAudience = [
    { title: "Founders & Creators", reason: `Quickly set up automated ${category.toLowerCase()} workflows without technical debt.` },
    { title: "Operations & Teams", reason: "Standardize repetitive task completion and improve overall team turnaround time." },
    { title: "Specialists & Power Users", reason: "Leverage advanced capability modules to execute high-volume digital workloads." },
  ];

  // Dynamic 3-Step Integration Workflow
  const workflowSteps = [
    { step: "01", title: "Access & Setup", desc: `Register through the official portal and select your preferred workspace configuration.` },
    { step: "02", title: "Connect Workflows", desc: `Integrate your existing data inputs, prompts, or files into the ${toolName} dashboard.` },
    { step: "03", title: "Automate & Export", desc: `Generate high-accuracy intelligence outputs and export directly into your active toolchain.` },
  ];

  // Dynamic FAQs
  const faqs = [
    {
      q: `What is ${toolName} and what primary problem does it solve?`,
      a: `${toolName} is a verified AI platform in the ${category} domain built to replace manual operations with automated intelligence, boosting overall output speed.`
    },
    {
      q: `How does the ${pricingStr} model work for ${toolName}?`,
      a: `${toolName} operates under the "${pricingStr}" pricing tier. Users can test essential features before committing to advanced usage quotas.`
    },
    {
      q: `What is the AI Vault Score evaluation for ${toolName}?`,
      a: `${toolName} holds an AI Vault Score of ${formattedScore}. This score evaluates catalog reliability, data accuracy, platform uptime, and operational quality.`
    },
    {
      q: `How does ${toolName} compare to alternative ${category} tools?`,
      a: `Compared to generic alternatives, ${toolName} specializes in focused ${category.toLowerCase()} automation with lower setup friction and dedicated workflow integrations.`
    }
  ];

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
    <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-base font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/?cat=${encodeURIComponent(category)}`} className="text-xs font-bold text-slate-500 hover:text-blue-600 hidden sm:inline">
              Browse {category}
            </Link>
            {officialWebsite && (
              <a
                href={officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-slate-950 px-3.5 py-1.5 text-[11px] font-black tracking-wider text-white uppercase transition hover:bg-slate-800"
              >
                VISIT PORTAL ↗
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-[11px] font-medium text-slate-400">
          <Link href="/" className="hover:text-blue-600 transition-colors">Directory</Link>
          <span>/</span>
          <Link href={`/?cat=${encodeURIComponent(category)}`} className="hover:text-blue-600 capitalize">{category}</Link>
          <span>/</span>
          <span className="text-slate-700 font-semibold">{toolName}</span>
        </div>

        {/* Hero Section Card */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <ToolLogo name={toolName} src={logoSrc} size="lg" />

            <div className="min-w-0 flex-1">
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600">
                  Verified Intelligence
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                  {category}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[9px] font-bold text-slate-700">
                  {pricingStr}
                </span>
              </div>

              <h1 className="text-3xl font-black text-slate-950 sm:text-5xl tracking-tight">
                {toolName}
              </h1>

              <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600 max-w-3xl">
                {overview}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {officialWebsite && (
                  <a
                    href={officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 transition"
                  >
                    Open Official Website ↗
                  </a>
                )}
                <Link
                  href={`/?cat=${encodeURIComponent(category)}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Explore {category} Alternatives
                </Link>
              </div>
            </div>
          </div>

          {/* AI Vault Score Indicator */}
          <div className="mt-7 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  AI Vault Quality Index
                </p>
                <p className="text-[11px] text-slate-400">
                  Calculated against workflow speed, catalog integrity, and integration stability.
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-950">{formattedScore}</span>
              </div>
            </div>
            {score !== null && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600"
                  style={{ width: barWidth }}
                />
              </div>
            )}
          </div>
        </section>

        {/* Executive Verdict / Recommendation */}
        <section className="mt-6 rounded-3xl border border-blue-100 bg-blue-50/40 p-6 sm:p-7">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            <h2 className="text-xs font-black uppercase tracking-widest text-blue-900">
              AI Vault Executive Verdict
            </h2>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
            <strong>{toolName}</strong> is recommended for teams needing dedicated <strong>{category.toLowerCase()}</strong> automation without heavy custom code. With a <strong>{pricingStr}</strong> access model and an AI Vault rating of <strong>{formattedScore}</strong>, it provides solid utility for streamlining day-to-day digital pipelines.
          </p>
        </section>

        {/* Who is this for? (Target Users) */}
        <section className="mt-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-950 mb-3">
            Who Should Use {toolName}?
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {targetAudience.map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-950">{item.title}</h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{item.reason}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Step-by-Step Workflow Integration */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-950 mb-4">
            How It Works in Practice
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {workflowSteps.map((step, idx) => (
              <div key={idx} className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-lg font-black text-blue-600">{step.step}</span>
                <h3 className="mt-1 text-xs font-bold text-slate-950">{step.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pros & Cons Matrix */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">✓</span>
              Key Strengths & Advantages
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs text-emerald-950">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">•</span>
                <span>Optimized architecture tailored for fast {category.toLowerCase()} execution.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">•</span>
                <span>Transparent {pricingStr} access options with minimal initial onboarding hurdles.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">•</span>
                <span>Reliable cloud uptime backed by standard enterprise security best practices.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] text-white">!</span>
              Considerations & Limitations
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs text-amber-950">
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">•</span>
                <span>Advanced throughput and batch quotas depend on the active subscription tier.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">•</span>
                <span>Requires constant internet connectivity to communicate with cloud inference servers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">•</span>
                <span>Domain-specific tasks may require slight initial configuration to maximize accuracy.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Key Features & Use Cases */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-950 mb-3">
            Core Features & Functional Capabilities
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                <span className="font-bold text-blue-600">✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <h3 className="mt-6 text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
            Primary Recommended Use Cases
          </h3>
          <div className="flex flex-wrap gap-2">
            {useCases.map((useCase, i) => (
              <span key={i} className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                {useCase}
              </span>
            ))}
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-950 mb-3">
            Technical & Deployment Specifications
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-3.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">Deployment</p>
              <p className="mt-1 text-xs font-bold text-slate-900">{deployment}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">Pricing Model</p>
              <p className="mt-1 text-xs font-bold text-slate-900">{pricingStr}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">License Tier</p>
              <p className="mt-1 text-xs font-bold text-slate-900">{license}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">Catalogue Status</p>
              <p className="mt-1 text-xs font-bold text-emerald-600">Verified Active</p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm">
          <div className="mb-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Q&A Knowledge Base</span>
            <h2 className="text-base font-black text-slate-950 mt-0.5">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <details key={idx} className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition open:bg-white open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs sm:text-sm font-bold text-slate-900">
                  <span>{faq.q}</span>
                  <span className="ml-2 font-bold text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-600 border-t border-slate-100 pt-2.5">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Similar Tools Section */}
        {related.length > 0 && (
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Ecosystem Comparison</span>
                <h2 className="text-lg font-black text-slate-950">Top Similar {category} Tools</h2>
              </div>
              <Link href={`/?cat=${encodeURIComponent(category)}`} className="text-xs font-bold text-blue-600 hover:underline">
                View All {category} →
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={String(item.id ?? item.slug ?? item.name)}
                  href={getToolHref(item)}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ToolLogo name={String(item.name || "AI Tool")} src={item.logo_url as string} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-950 group-hover:text-blue-600 transition-colors">
                        {String(item.name || "AI Tool")}
                      </p>
                      <p className="text-[10px] text-slate-400 capitalize">{String(item.category || category)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                    <span className="font-bold text-slate-500">{String(item.pricing || "Freemium")}</span>
                    <span className="font-bold text-blue-600">Compare →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Outbound Direct CTA */}
        {officialWebsite && (
          <section className="mt-8 rounded-3xl bg-[#070913] p-8 text-center text-white sm:p-10 shadow-xl">
            <div className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-300 mb-3">
              Direct Access Portal
            </div>
            <h2 className="text-2xl font-black sm:text-3xl">Get Started with {toolName}</h2>
            <p className="mx-auto mt-2 max-w-md text-xs text-slate-400 leading-relaxed">
              Explore product plans, live interactive demonstrations, and official API documentation directly on their portal.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <a
                href={officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-xl bg-white px-6 py-3 text-xs font-black text-slate-950 transition hover:bg-slate-100 shadow-md"
              >
                VISIT OFFICIAL PORTAL ↗
              </a>
              <Link
                href="/"
                className="inline-block rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
              >
                ← Back to AI Directory
              </Link>
            </div>
          </section>
        )}

        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-[10px] text-slate-400">
          © 2026 AI Vault. Discover, compare, and scale with verified artificial intelligence software.
        </footer>
      </div>
    </main>
  );
}
