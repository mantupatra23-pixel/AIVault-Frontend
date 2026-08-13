import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SITE_URL = "https://www.aivault.pp.ua";
const SITE_NAME = "AI Vault";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ToolRecord = {
  id?: string | number | null;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  category?: string | null;
  pricing?: string | null;
  website_url?: string | null;
  created_at?: string | null;
};

type ToolPageData = {
  id: string | number | null;
  name: string;
  slug: string;
  description: string;
  category: string;
  pricing: string;
  websiteUrl: string;
  score: number;
  overview: string;
  whoShouldUse: string;
  pricingText: string;
  features: string[];
  limitations: string[];
  useCases: string[];
  gettingStarted: string[];
  faqs: {
    question: string;
    answer: string;
  }[];
  specifications: {
    label: string;
    value: string;
  }[];
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("[AI_VAULT] Missing Supabase environment variables");
    return null;
  }

  return createClient(url, key);
}

function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function normalizeSlug(value: unknown): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "-");
}

function normalizeWebsite(value: unknown): string {
  const raw = cleanText(value);

  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  return `https://${raw}`;
}

function titleCase(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(name: string): string {
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "AI";

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function normalizePricing(value: string): string {
  const pricing = value.toLowerCase();

  if (pricing.includes("free")) return "Free";
  if (pricing.includes("freemium")) return "Freemium";
  if (pricing.includes("paid")) return "Paid";
  if (pricing.includes("enterprise")) return "Enterprise";

  return value ? titleCase(value) : "Freemium";
}

function scoreForTool(name: string, category: string): number {
  const seed =
    [...`${name}-${category}`].reduce(
      (sum, char) => sum + char.charCodeAt(0),
      0,
    ) % 16;

  return 84 + seed;
}

function buildToolData(record: ToolRecord): ToolPageData {
  const name = cleanText(record.name) || titleCase(normalizeSlug(record.slug));
  const slug = normalizeSlug(record.slug || name);
  const category = titleCase(cleanText(record.category) || "AI Tools");
  const pricing = normalizePricing(cleanText(record.pricing));
  const description =
    cleanText(record.description) ||
    `${name} is an AI-powered software solution designed to help users improve productivity, automate workflows, and complete tasks more efficiently.`;

  const websiteUrl = normalizeWebsite(record.website_url);
  const score = scoreForTool(name, category);

  const categoryLower = category.toLowerCase();

  let features = [
    "User-friendly interface for easy navigation and task management",
    "Powerful capabilities designed to streamline everyday workflows",
    "Fast and practical experience for individuals and teams",
  ];

  let limitations = [
    "Some advanced capabilities may require a paid plan",
    "Feature availability can vary by plan and platform",
    "Internet connectivity may be required for cloud-based functionality",
  ];

  let useCases = [
    "Productivity Enhancement",
    "Workflow Optimization",
    "Task Automation",
  ];

  let whoShouldUse = `${name} is designed for individuals, creators, professionals, and teams looking for a practical ${category.toLowerCase()} solution that can improve efficiency and simplify everyday workflows.`;

  if (
    categoryLower.includes("coding") ||
    categoryLower.includes("developer") ||
    categoryLower.includes("development")
  ) {
    features = [
      "Developer-focused workflow and productivity capabilities",
      "Tools designed to simplify technical and development tasks",
      "Integration-friendly experience for modern development workflows",
    ];

    limitations = [
      "Advanced development workflows may require technical knowledge",
      "Some integrations or features may depend on external services",
      "Availability of advanced capabilities can vary by plan",
    ];

    useCases = [
      "Software Development",
      "Developer Productivity",
      "Code Workflow",
    ];

    whoShouldUse = `${name} is designed for developers, engineers, technical teams, and creators who want to improve their development workflow and reduce repetitive technical work.`;
  } else if (
    categoryLower.includes("image") ||
    categoryLower.includes("design")
  ) {
    features = [
      "AI-assisted visual creation and design workflows",
      "Simple interface for creating and refining visual content",
      "Useful capabilities for creators, marketers, and design teams",
    ];

    limitations = [
      "Output quality can vary depending on the input and use case",
      "Some premium generation features may require payment",
      "Commercial usage terms should be checked before publishing outputs",
    ];

    useCases = [
      "Image Creation",
      "Creative Design",
      "Marketing Visuals",
    ];

    whoShouldUse = `${name} is designed for creators, designers, marketers, agencies, and businesses that need an efficient AI-powered visual workflow.`;
  } else if (
    categoryLower.includes("writing") ||
    categoryLower.includes("content")
  ) {
    features = [
      "AI-assisted content creation and writing workflows",
      "Useful tools for drafting, editing, and improving written content",
      "Designed to help users produce content more efficiently",
    ];

    limitations = [
      "AI-generated content should be reviewed before publishing",
      "Output quality depends on prompts and provided context",
      "Advanced capabilities may depend on the selected plan",
    ];

    useCases = [
      "Content Creation",
      "Copywriting",
      "Content Optimization",
    ];

    whoShouldUse = `${name} is designed for writers, marketers, creators, businesses, and teams that want to speed up content production while maintaining control over the final result.`;
  } else if (
    categoryLower.includes("marketing") ||
    categoryLower.includes("seo")
  ) {
    features = [
      "Marketing-focused workflow and productivity capabilities",
      "Tools designed to support research, optimization, and campaign workflows",
      "Useful for professionals managing recurring marketing tasks",
    ];

    limitations = [
      "Marketing results depend on strategy and implementation",
      "Some advanced capabilities may require a premium plan",
      "External platforms may be required for certain workflows",
    ];

    useCases = [
      "Marketing Automation",
      "SEO Workflow",
      "Campaign Optimization",
    ];

    whoShouldUse = `${name} is designed for marketers, SEO professionals, agencies, creators, and businesses looking to improve their marketing workflow and operational efficiency.`;
  } else if (
    categoryLower.includes("video") ||
    categoryLower.includes("audio")
  ) {
    features = [
      "AI-powered media workflow capabilities",
      "Designed to simplify content production and editing tasks",
      "Useful for creators, marketers, and media teams",
    ];

    limitations = [
      "Generation or processing speed can depend on workload",
      "Higher-quality outputs may require a premium plan",
      "Usage limits may apply depending on the selected subscription",
    ];

    useCases = [
      "Media Creation",
      "Content Production",
      "Creative Workflow",
    ];

    whoShouldUse = `${name} is designed for creators, media professionals, marketers, and businesses looking to simplify AI-assisted media production.`;
  }

  const overview = `${name} is a ${category.toLowerCase()} solution featured in the AI Vault directory. ${description} For users evaluating ${name}, the most important areas to consider are its core capabilities, pricing model, workflow fit, integrations, and overall ease of use.`;

  const pricingText =
    pricing === "Free"
      ? `${name} currently appears in the AI Vault directory with a Free pricing model. Users should check the official portal for the latest feature limits and usage terms.`
      : pricing === "Freemium"
        ? `${name} operates under a Freemium model, providing access to core capabilities while potentially reserving advanced features or higher usage limits for paid plans. Check the official portal for current pricing.`
        : `${name} is listed with a ${pricing} pricing model. Pricing, plan limits, and available features can change, so users should check the official portal for the latest information.`;

  const gettingStarted = [
    `Visit the official ${name} portal`,
    "Create or authenticate your user account if required",
    "Configure the available workspace, preferences, or integrations",
    "Start using the platform and evaluate it against your workflow requirements",
  ];

  const faqs = [
    {
      question: `What is ${name} used for?`,
      answer: `${name} is a ${category.toLowerCase()} solution designed to help users improve productivity, simplify workflows, and complete relevant tasks more efficiently.`,
    },
    {
      question: `Is ${name} free to use?`,
      answer:
        pricing === "Free"
          ? `${name} is currently listed as Free in the AI Vault directory. Check the official portal for current limits and terms.`
          : `${name} is currently listed as ${pricing}. Check the official portal for the latest pricing plans and feature availability.`,
    },
    {
      question: `Who should use ${name}?`,
      answer: whoShouldUse,
    },
    {
      question: `Does ${name} require software installation?`,
      answer: `${name} availability depends on its current platform. Users should check the official portal for supported web, desktop, mobile, API, or other deployment options.`,
    },
    {
      question: `Where can I access ${name}?`,
      answer: websiteUrl
        ? `You can access ${name} through its official website or portal using the Visit Official Portal button on this page.`
        : `The official access URL for ${name} is not currently available in the AI Vault database.`,
    },
  ];

  const specifications = [
    {
      label: "Category",
      value: category,
    },
    {
      label: "Pricing Model",
      value: pricing,
    },
    {
      label: "Operating System",
      value: "Web / Cloud",
    },
    {
      label: "Deployment",
      value: "Hosted SaaS",
    },
    {
      label: "License",
      value: "Proprietary",
    },
    {
      label: "Integrations",
      value: "Web APIs / Cloud Services",
    },
  ];

  return {
    id: record.id ?? null,
    name,
    slug,
    description,
    category,
    pricing,
    websiteUrl,
    score,
    overview,
    whoShouldUse,
    pricingText,
    features,
    limitations,
    useCases,
    gettingStarted,
    faqs,
    specifications,
  };
}

async function getTool(slug: string): Promise<ToolPageData | null> {
  const supabase = getSupabase();

  if (!supabase) {
    return null;
  }

  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    return null;
  }

  /*
   * IMPORTANT:
   * Only use columns that actually exist in ai_tools.
   *
   * Existing schema:
   * id
   * name
   * slug
   * description
   * category
   * pricing
   * website_url
   * created_at
   *
   * DO NOT add updated_at here.
   */

  const { data, error } = await supabase
    .from("ai_tools")
    .select(
      "id,name,slug,description,category,pricing,website_url,created_at",
    )
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (error) {
    console.error("[AI_VAULT] Supabase tool query error:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return buildToolData(data as ToolRecord);
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const tool = await getTool(slug);

  if (!tool) {
    return {
      title: `AI Tool | ${SITE_NAME}`,
      description: "Discover AI software and tools on AI Vault.",
    };
  }

  return {
    title: `${tool.name} — AI Tool Review | ${SITE_NAME}`,
    description: `${tool.name} — features, pricing, use cases, limitations and specifications.`,
    alternates: {
      canonical: `${SITE_URL}/tool/${tool.slug}`,
    },
    openGraph: {
      title: `${tool.name} — AI Tool Review`,
      description: tool.description,
      url: `${SITE_URL}/tool/${tool.slug}`,
      siteName: SITE_NAME,
      type: "article",
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;

  const tool = await getTool(slug);

  if (!tool) {
    notFound();
  }

  const initials = getInitials(tool.name);

  return (
    <main className="min-h-screen bg-white text-[#111827]">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="text-[20px] font-black tracking-[-0.04em] text-[#111827]"
          >
            AI Vault
          </Link>

          {tool.websiteUrl ? (
            <a
              href={tool.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-[#101828] px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.02em] text-white shadow-sm transition hover:bg-[#1d2939]"
            >
              Visit Official Portal ↗
            </a>
          ) : (
            <span className="rounded-xl bg-slate-100 px-5 py-3 text-[11px] font-extrabold uppercase text-slate-500">
              Official Portal Unavailable
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-5 pb-20 pt-7 sm:px-8 lg:px-10">
        {/* BREADCRUMB */}
        <nav className="mb-7 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>

          <span>/</span>

          <Link href="/" className="hover:text-slate-900">
            AI Tools
          </Link>

          <span>/</span>

          <span>{tool.category}</span>

          <span>/</span>

          <span className="font-semibold text-slate-800">{tool.name}</span>
        </nav>

        {/* HERO */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-5">
              {/* LOGO */}
              <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#334cff] to-[#4534e8] text-[24px] font-black text-white shadow-[0_8px_22px_rgba(51,76,255,0.22)]">
                {initials}
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600">
                    {tool.category}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600">
                    {tool.pricing}
                  </span>
                </div>

                <h1 className="break-words text-[34px] font-black tracking-[-0.045em] text-[#101828] sm:text-[46px]">
                  {tool.name}
                </h1>

                <div className="mt-5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    AI Vault Score
                  </div>

                  <div className="mt-1 flex items-end">
                    <span className="text-[27px] font-black text-[#111827]">
                      {tool.score}
                    </span>

                    <span className="mb-1 ml-1 text-[14px] font-bold text-slate-400">
                      /10
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* DESKTOP CTA */}
            {tool.websiteUrl && (
              <a
                href={tool.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden shrink-0 rounded-xl bg-[#101828] px-7 py-4 text-[11px] font-extrabold uppercase tracking-wide text-white transition hover:bg-[#1d2939] sm:inline-flex lg:self-start"
              >
                Visit Official Portal ↗
              </a>
            )}
          </div>
        </section>

        {/* OVERVIEW */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.03)] sm:p-8">
          <h2 className="text-[20px] font-extrabold tracking-[-0.02em]">
            Overview
          </h2>

          <div className="mt-5 space-y-5 text-[13px] leading-7 text-slate-600">
            <p>{tool.overview}</p>

            <p>{tool.description}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
              AI
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
              {tool.category}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
              {tool.name}
            </span>
          </div>
        </section>

        {/* WHO SHOULD USE */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.03)] sm:p-8">
          <h2 className="text-[20px] font-extrabold tracking-[-0.02em]">
            Who Should Use {tool.name}?
          </h2>

          <p className="mt-5 text-[13px] leading-7 text-slate-600">
            {tool.whoShouldUse}
          </p>
        </section>

        {/* PRICING */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.03)] sm:p-8">
          <h2 className="text-[20px] font-extrabold tracking-[-0.02em]">
            Pricing
          </h2>

          <p className="mt-5 text-[13px] leading-7 text-slate-600">
            {tool.pricingText}
          </p>
        </section>

        {/* FEATURES / LIMITATIONS */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.03)] sm:p-8">
            <h2 className="text-[20px] font-extrabold tracking-[-0.02em]">
              Key Features
            </h2>

            <div className="mt-5 space-y-4">
              {tool.features.map((feature, index) => (
                <div
                  key={`${feature}-${index}`}
                  className="flex gap-3 text-[13px] leading-6 text-slate-600"
                >
                  <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#334cff]" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.03)] sm:p-8">
            <h2 className="text-[20px] font-extrabold tracking-[-0.02em]">
              Limitations
            </h2>

            <div className="mt-5 space-y-4">
              {tool.limitations.map((limitation, index) => (
                <div
                  key={`${limitation}-${index}`}
                  className="flex gap-3 text-[13px] leading-6 text-slate-600"
                >
                  <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                  <span>{limitation}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* USE CASES */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.03)] sm:p-8">
          <h2 className="text-[20px] font-extrabold tracking-[-0.02em]">
            Use Cases
          </h2>

          <div className="mt-5 flex flex-wrap gap-2">
            {tool.useCases.map((useCase) => (
              <span
                key={useCase}
                className="rounded-full bg-slate-100 px-4 py-2 text-[11px] font-semibold text-slate-600"
              >
                {useCase}
              </span>
            ))}
          </div>
        </section>

        {/* HOW TO GET STARTED */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.03)] sm:p-8">
          <h2 className="text-[20px] font-extrabold tracking-[-0.02em]">
            How To Get Started
          </h2>

          <ol className="mt-5 space-y-3 text-[13px] leading-6 text-slate-600">
            {tool.gettingStarted.map((step, index) => (
              <li key={`${step}-${index}`} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                  {index + 1}
                </span>

                <span className="pt-[1px]">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.03)] sm:p-8">
          <h2 className="text-[20px] font-extrabold tracking-[-0.02em]">
            Frequently Asked Questions
          </h2>

          <div className="mt-5 divide-y divide-slate-100">
            {tool.faqs.map((faq, index) => (
              <div
                key={`${faq.question}-${index}`}
                className="py-5 first:pt-0 last:pb-0"
              >
                <h3 className="text-[12px] font-extrabold text-slate-800">
                  {faq.question}
                </h3>

                <p className="mt-2 text-[12px] leading-6 text-slate-500">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SPECIFICATIONS */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.03)] sm:p-8">
          <h2 className="text-[20px] font-extrabold tracking-[-0.02em]">
            Tool Specifications
          </h2>

          <div className="mt-6 divide-y divide-slate-100">
            {tool.specifications.map((specification) => (
              <div
                key={specification.label}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-[12px] font-medium text-slate-500">
                  {specification.label}
                </span>

                <span className="text-[12px] font-bold text-slate-800 sm:text-right">
                  {specification.value}
                </span>
              </div>
            ))}
          </div>

          {/* INTEGRATION TAGS */}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <span className="rounded-md bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-600">
              Web APIs
            </span>

            <span className="rounded-md bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-600">
              Cloud Services
            </span>
          </div>

          {/* BOTTOM CTA */}
          {tool.websiteUrl && (
            <a
              href={tool.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 flex w-full items-center justify-center rounded-xl bg-[#101828] px-5 py-4 text-[11px] font-extrabold uppercase tracking-wide text-white transition hover:bg-[#1d2939]"
            >
              Visit Official Portal ↗
            </a>
          )}
        </section>

        {/* BACK */}
        <div className="mt-7">
          <Link
            href="/"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50"
          >
            ← Back to AI Directory
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-5 py-7 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <span>© 2026 AI Vault. All rights reserved.</span>

          <div className="flex gap-5">
            <Link href="/about" className="hover:text-slate-900">
              About
            </Link>

            <Link href="/contact" className="hover:text-slate-900">
              Contact
            </Link>

            <Link href="/privacy" className="hover:text-slate-900">
              Privacy
            </Link>

            <Link href="/terms" className="hover:text-slate-900">
              Terms
            </Link>
          </div>
        </div>
      </footer>

      {/* STRUCTURED DATA */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: tool.name,
            description: tool.description,
            applicationCategory: tool.category,
            operatingSystem: "Web",
            url: `${SITE_URL}/tool/${tool.slug}`,
            ...(tool.websiteUrl
              ? {
                  sameAs: tool.websiteUrl,
                }
              : {}),
            offers: {
              "@type": "Offer",
              category: tool.pricing,
            },
          }),
        }}
      />
    </main>
  );
}
