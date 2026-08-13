import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

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
  website?: string | null;
  created_at?: string | null;
};

type ToolData = {
  id: string | number | null;
  name: string;
  slug: string;
  description: string;
  category: string;
  pricing: string;
  websiteUrl: string;
  updatedAt?: string;
};

/* =========================================================
   SUPABASE
========================================================= */

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error(
      "[AI_VAULT] Missing Supabase environment variables."
    );
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/* =========================================================
   HELPERS
========================================================= */

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSlug(value: unknown): string {
  return clean(value)
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();
}

function slugify(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function initials(name: string): string {
  const words = name
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return "AI";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function normalizeWebsite(value: unknown): string {
  const raw = clean(value);

  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  return `https://${raw}`;
}

function pricingLabel(value: unknown): string {
  const raw = clean(value);

  if (!raw) {
    return "Not specified";
  }

  const lower = raw.toLowerCase();

  if (
    lower.includes("freemium") ||
    (lower.includes("free") && lower.includes("paid"))
  ) {
    return "Freemium";
  }

  if (lower === "free" || lower.includes("free")) {
    return "Free";
  }

  if (lower.includes("paid")) {
    return "Paid";
  }

  if (
    lower.includes("custom") ||
    lower.includes("contact")
  ) {
    return "Custom";
  }

  return titleCase(raw);
}

function descriptionText(
  value: unknown,
  name: string,
  category: string
): string {
  const text = clean(value);

  if (text) {
    return text;
  }

  return `${name} is an AI software solution in the ${category.toLowerCase()} category. Explore its capabilities, pricing, use cases, and related AI tools on AI Vault.`;
}

function shortDescription(value: string): string {
  const text = clean(value);

  if (text.length <= 160) {
    return text;
  }

  return `${text.slice(0, 157).trim()}...`;
}

/* =========================================================
   DATABASE MAPPING
========================================================= */

function mapTool(record: ToolRecord): ToolData {
  const name =
    clean(record.name) ||
    titleCase(normalizeSlug(record.slug)) ||
    "AI Tool";

  const category =
    clean(record.category) ||
    "AI Software";

  const slug =
    slugify(record.slug) ||
    slugify(name);

  const description = descriptionText(
    record.description,
    name,
    category
  );

  const websiteUrl = normalizeWebsite(
    record.website_url || record.website
  );

  const updatedAt =
    clean(record.created_at) ||
    undefined;

  return {
    id: record.id ?? null,
    name,
    slug,
    description,
    category,
    pricing: pricingLabel(record.pricing),
    websiteUrl,
    updatedAt,
  };
}

/* =========================================================
   GET SINGLE TOOL
========================================================= */

async function getTool(
  requestedSlug: string
): Promise<ToolData | null> {
  const supabase = getSupabase();

  if (!supabase) {
    return null;
  }

  const slug = normalizeSlug(requestedSlug);

  if (!slug) {
    return null;
  }

  const fields =
    "id,name,slug,description,category,pricing,website_url,website,created_at";

  /* -------------------------------------------------------
     1. Exact match
  ------------------------------------------------------- */

  const exact = await supabase
    .from("ai_tools")
    .select(fields)
    .eq("slug", slug)
    .maybeSingle();

  if (!exact.error && exact.data) {
    return mapTool(exact.data as ToolRecord);
  }

  /* -------------------------------------------------------
     2. Case-insensitive match
  ------------------------------------------------------- */

  const insensitive = await supabase
    .from("ai_tools")
    .select(fields)
    .ilike("slug", slug)
    .limit(1)
    .maybeSingle();

  if (!insensitive.error && insensitive.data) {
    return mapTool(
      insensitive.data as ToolRecord
    );
  }

  /* -------------------------------------------------------
     3. Cleaned slug comparison
     Useful if DB contains accidental spaces.
  ------------------------------------------------------- */

  const loose = await supabase
    .from("ai_tools")
    .select(fields)
    .ilike("slug", `%${slug}%`)
    .limit(10);

  if (!loose.error && Array.isArray(loose.data)) {
    const exactClean = loose.data.find(
      (item) =>
        normalizeSlug(
          (item as ToolRecord).slug
        ) === slug
    );

    if (exactClean) {
      return mapTool(
        exactClean as ToolRecord
      );
    }
  }

  console.warn(
    `[AI_VAULT] Tool not found for slug: ${slug}`
  );

  return null;
}

/* =========================================================
   GET RELATED TOOLS
========================================================= */

async function getRelatedTools(
  category: string,
  currentId: string | number | null
): Promise<ToolData[]> {
  const supabase = getSupabase();

  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("ai_tools")
    .select(
      "id,name,slug,description,category,pricing,website_url,website,created_at"
    )
    .eq("category", category)
    .limit(12);

  if (currentId !== null) {
    query = query.neq("id", currentId);
  }

  const result = await query;

  if (result.error || !result.data) {
    return [];
  }

  return (result.data as ToolRecord[])
    .map(mapTool)
    .filter((tool) => Boolean(tool.slug));
}

/* =========================================================
   SEO METADATA
========================================================= */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const tool = await getTool(slug);

  if (!tool) {
    return {
      title: "AI Tool Not Found | AI Vault",
      description:
        "The requested AI tool could not be found in the AI Vault directory.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const canonical =
    `${SITE_URL}/tool/${tool.slug}`;

  const title =
    `${tool.name} — ${tool.category} AI Tool | AI Vault`;

  const description =
    shortDescription(tool.description);

  return {
    metadataBase: new URL(SITE_URL),

    title,

    description,

    keywords: [
      tool.name,
      `${tool.name} AI`,
      `${tool.name} pricing`,
      `${tool.name} features`,
      `${tool.name} alternatives`,
      `${tool.name} review`,
      `${tool.category} AI tools`,
      "AI tools",
      "AI software",
      "AI SaaS",
      "AI Vault",
    ],

    alternates: {
      canonical,
    },

    robots: {
      index: true,
      follow: true,

      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: canonical,
      title,
      description,
      locale: "en_US",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/* =========================================================
   CONTENT GENERATORS
========================================================= */

function getFeatures(tool: ToolData): string[] {
  const category =
    tool.category.toLowerCase();

  if (category.includes("coding")) {
    return [
      "AI-assisted coding workflows.",
      "Developer productivity and workflow optimization.",
      "Useful for building, reviewing, or improving software workflows.",
    ];
  }

  if (category.includes("image")) {
    return [
      "AI-powered image and visual workflows.",
      "Creative generation and experimentation.",
      "Useful for design, marketing, and content creation.",
    ];
  }

  if (category.includes("video")) {
    return [
      "AI-assisted video creation workflows.",
      "Faster creative and content production.",
      "Useful for creators, social media, and marketing teams.",
    ];
  }

  if (category.includes("writing")) {
    return [
      "AI-assisted writing workflows.",
      "Faster drafting and content production.",
      "Useful for creators, marketers, and professional teams.",
    ];
  }

  if (category.includes("marketing")) {
    return [
      "Marketing workflow support and optimization.",
      "Helps streamline repetitive marketing tasks.",
      "Useful for marketers, agencies, and businesses.",
    ];
  }

  if (category.includes("chat")) {
    return [
      "AI-powered conversational workflows.",
      "Interactive assistance for common user tasks.",
      "Useful for individuals, teams, and customer-facing workflows.",
    ];
  }

  return [
    `AI-powered capabilities for ${tool.category.toLowerCase()} workflows.`,
    "Designed to improve productivity and reduce repetitive work.",
    "Useful for individuals, creators, professionals, and teams.",
  ];
}

function getUseCases(tool: ToolData): string[] {
  const category =
    tool.category.toLowerCase();

  if (category.includes("coding")) {
    return [
      "Software Development",
      "Coding Assistance",
      "Developer Productivity",
      "Workflow Automation",
    ];
  }

  if (category.includes("image")) {
    return [
      "Image Generation",
      "Visual Design",
      "Marketing Content",
      "Creative Production",
    ];
  }

  if (category.includes("video")) {
    return [
      "Video Creation",
      "Social Media",
      "Marketing Production",
      "Content Creation",
    ];
  }

  if (category.includes("writing")) {
    return [
      "Content Creation",
      "Copywriting",
      "Research Assistance",
      "Productivity",
    ];
  }

  if (category.includes("marketing")) {
    return [
      "Marketing Automation",
      "Campaign Workflows",
      "Growth",
      "Content Marketing",
    ];
  }

  return [
    `${tool.category} Workflows`,
    "AI-Assisted Tasks",
    "Productivity",
    "Workflow Optimization",
  ];
}

function getLimitations(): string[] {
  return [
    "Features and capabilities may change as the provider updates the product.",
    "Pricing, limits, and plan availability should be verified on the official website.",
    "Some advanced features may require a paid plan.",
  ];
}

function getFaqs(tool: ToolData) {
  return [
    {
      question: `What is ${tool.name} used for?`,
      answer: `${tool.name} is an AI software platform listed in the ${tool.category.toLowerCase()} category. Its exact capabilities depend on the provider's current product offering.`,
    },

    {
      question: `Is ${tool.name} free?`,
      answer: `${tool.name} is currently listed on AI Vault with a ${tool.pricing.toLowerCase()} pricing model. Check the official website for the latest plans, limits, and pricing.`,
    },

    {
      question: `What are the alternatives to ${tool.name}?`,
      answer: `AI Vault lists related ${tool.category.toLowerCase()} tools that can be compared as potential alternatives to ${tool.name}.`,
    },

    {
      question: `Who should use ${tool.name}?`,
      answer: `${tool.name} may be useful for individuals, creators, developers, professionals, teams, and businesses looking for ${tool.category.toLowerCase()} solutions.`,
    },

    {
      question: `Does ${tool.name} require installation?`,
      answer: `Access and installation requirements depend on the provider. Check the official ${tool.name} website for the latest browser, desktop, mobile, or API availability.`,
    },
  ];
}

/* =========================================================
   PAGE
========================================================= */

export default async function ToolPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const tool = await getTool(slug);

  if (!tool) {
    notFound();
  }

  const relatedTools = await getRelatedTools(
    tool.category,
    tool.id
  );

  const features = getFeatures(tool);
  const useCases = getUseCases(tool);
  const limitations = getLimitations();
  const faqs = getFaqs(tool);

  const canonical =
    `${SITE_URL}/tool/${tool.slug}`;

  /*
   * Stable score based on available catalog data.
   * This is a directory score, not an external review.
   */
  let score = 82;

  if (tool.name.length >= 4) {
    score += 1;
  }

  if (tool.description.length >= 120) {
    score += 2;
  }

  if (tool.category) {
    score += 1;
  }

  score = Math.min(95, score);

  /* =======================================================
     STRUCTURED DATA
  ======================================================= */

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",

    name: tool.name,

    description: tool.description,

    applicationCategory: tool.category,

    operatingSystem: "Web",

    url: canonical,

    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },

    ...(tool.websiteUrl
      ? {
          sameAs: [tool.websiteUrl],
        }
      : {}),

    offers: {
      "@type": "Offer",
      category: tool.pricing,
      url: tool.websiteUrl || canonical,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",

    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },

      {
        "@type": "ListItem",
        position: 2,
        name: "AI Tools",
        item: `${SITE_URL}/`,
      },

      {
        "@type": "ListItem",
        position: 3,
        name: tool.category,
        item: `${SITE_URL}/?cat=${encodeURIComponent(
          tool.category
        )}`,
      },

      {
        "@type": "ListItem",
        position: 4,
        name: tool.name,
        item: canonical,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",

    mainEntity: faqs.map((faq) => ({
      "@type": "Question",

      name: faq.question,

      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-slate-900">

      {/* =================================================
          JSON-LD
      ================================================= */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            softwareSchema
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqSchema
          ),
        }}
      />

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

          <Link
            href="/"
            className="text-xl font-black tracking-tight text-slate-950"
          >
            AI Vault.
          </Link>

          {tool.websiteUrl ? (
            <a
              href={tool.websiteUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="rounded-xl bg-slate-950 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-blue-600 sm:px-5"
            >
              Visit Official Portal ↗
            </a>
          ) : (
            <Link
              href="/"
              className="rounded-xl bg-slate-950 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-white"
            >
              Explore AI Tools
            </Link>
          )}

        </div>
      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">

        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 py-6 text-xs text-slate-500"
        >
          <Link
            href="/"
            className="hover:text-blue-600"
          >
            Home
          </Link>

          <span>/</span>

          <Link
            href="/"
            className="hover:text-blue-600"
          >
            AI Tools
          </Link>

          <span>/</span>

          <span>
            {tool.category}
          </span>

          <span>/</span>

          <span className="font-semibold text-slate-900">
            {tool.name}
          </span>
        </nav>

        {/* =================================================
            HERO
        ================================================= */}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">

          <div className="flex flex-col gap-7 md:flex-row md:items-center">

            {/* LOGO */}

            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-2xl font-black text-white shadow-lg"
              aria-label={`${tool.name} logo`}
            >
              {initials(tool.name)}
            </div>

            {/* MAIN INFO */}

            <div className="min-w-0 flex-1">

              <div className="mb-3 flex flex-wrap gap-2">

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {tool.category}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {tool.pricing}
                </span>

              </div>

              <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                {tool.name}
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                {tool.description}
              </p>

              <div className="mt-5">

                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  AI Vault Score
                </span>

                <div className="mt-1 text-3xl font-black text-slate-950">
                  {score}
                  <span className="text-sm font-medium text-slate-400">
                    /100
                  </span>
                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            OVERVIEW
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold">
            Overview
          </h2>

          <p className="mt-5 max-w-5xl text-sm leading-7 text-slate-600">
            {tool.description}
          </p>

          <p className="mt-4 max-w-5xl text-sm leading-7 text-slate-600">
            AI Vault helps users discover, compare, and
            evaluate AI software. This page provides
            information about {tool.name}, including its
            category, pricing model, potential use cases,
            features, limitations, and related tools.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              AI
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {tool.category}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {tool.pricing}
            </span>

          </div>

        </section>

        {/* =================================================
            WHO SHOULD USE
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold">
            Who Should Use {tool.name}?
          </h2>

          <p className="mt-4 max-w-5xl text-sm leading-7 text-slate-600">
            {tool.name} may be suitable for individuals,
            creators, professionals, developers, teams,
            agencies, and businesses looking for solutions
            related to{" "}
            <strong className="font-semibold text-slate-900">
              {tool.category.toLowerCase()}
            </strong>
            .
          </p>

        </section>

        {/* =================================================
            PRICING
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold">
            {tool.name} Pricing
          </h2>

          <div className="mt-5 flex flex-wrap items-center gap-4">

            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {tool.pricing}
            </span>

            <p className="text-sm text-slate-600">
              Pricing and plan availability can change.
              Check the official portal for current details.
            </p>

          </div>

        </section>

        {/* =================================================
            FEATURES + LIMITATIONS
        ================================================= */}

        <section className="mt-6 grid gap-6 md:grid-cols-2">

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            <h2 className="text-xl font-bold">
              Key Features
            </h2>

            <div className="mt-6 space-y-6">

              {features.map((feature) => (
                <div key={feature}>

                  <div className="flex gap-3">

                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                      ✓
                    </span>

                    <p className="text-sm leading-6 text-slate-600">
                      {feature}
                    </p>

                  </div>

                </div>
              ))}

            </div>

          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            <h2 className="text-xl font-bold">
              Limitations
            </h2>

            <div className="mt-6 space-y-5">

              {limitations.map((item) => (
                <div
                  key={item}
                  className="flex gap-3"
                >

                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                    !
                  </span>

                  <p className="text-sm leading-6 text-slate-600">
                    {item}
                  </p>

                </div>
              ))}

            </div>

          </div>

        </section>

        {/* =================================================
            USE CASES
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold">
            Use Cases
          </h2>

          <div className="mt-5 flex flex-wrap gap-2">

            {useCases.map((useCase) => (
              <span
                key={useCase}
                className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700"
              >
                {useCase}
              </span>
            ))}

          </div>

        </section>

        {/* =================================================
            HOW TO GET STARTED
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold">
            How To Get Started
          </h2>

          <ol className="mt-6 space-y-4">

            <li className="flex gap-4">

              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                1
              </span>

              <p className="text-sm leading-6 text-slate-600">
                Visit the official {tool.name} website.
              </p>

            </li>

            <li className="flex gap-4">

              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                2
              </span>

              <p className="text-sm leading-6 text-slate-600">
                Create or access your account if required.
              </p>

            </li>

            <li className="flex gap-4">

              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                3
              </span>

              <p className="text-sm leading-6 text-slate-600">
                Explore the available features and plans.
              </p>

            </li>

            <li className="flex gap-4">

              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                4
              </span>

              <p className="text-sm leading-6 text-slate-600">
                Choose the workflow that best matches your
                requirements.
              </p>

            </li>

          </ol>

          {tool.websiteUrl && (
            <div className="mt-7">

              <a
                href={tool.websiteUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Open Official Website ↗
              </a>

            </div>
          )}

        </section>

        {/* =================================================
            ALTERNATIVES
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <div>

            <h2 className="text-xl font-bold">
              {tool.name} Alternatives
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Explore similar {tool.category.toLowerCase()} tools
              available in the AI Vault directory.
            </p>

          </div>

          {relatedTools.length > 0 ? (

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {relatedTools
                .slice(0, 8)
                .map((item) => {

                  const itemSlug =
                    slugify(item.slug) ||
                    slugify(item.name);

                  return (
                    <Link
                      key={`${String(item.id)}-${itemSlug}`}
                      href={`/tool/${itemSlug}`}
                      className="group rounded-2xl border border-slate-100 bg-white p-4 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                    >

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-xs font-bold text-white">
                          {initials(item.name)}
                        </div>

                        <div className="min-w-0">

                          <h3 className="truncate text-sm font-bold text-slate-900">
                            {item.name}
                          </h3>

                          <p className="truncate text-xs text-slate-500">
                            {item.category}
                          </p>

                        </div>

                      </div>

                      <div className="mt-4 text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                        Explore →
                      </div>

                    </Link>
                  );
                })}

            </div>

          ) : (

            <p className="mt-6 text-sm text-slate-500">
              More related AI tools are being added to the
              AI Vault directory.
            </p>

          )}

        </section>

        {/* =================================================
            FAQ
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold">
            Frequently Asked Questions
          </h2>

          <div className="mt-6 divide-y divide-slate-100">

            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="py-5"
              >

                <h3 className="text-sm font-bold text-slate-900">
                  {faq.question}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {faq.answer}
                </p>

              </div>
            ))}

          </div>

        </section>

        {/* =================================================
            SPECIFICATIONS
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold">
            Tool Specifications
          </h2>

          <div className="mt-6 divide-y divide-slate-100">

            <div className="flex flex-col gap-2 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <span className="text-slate-500">
                Tool
              </span>

              <strong className="text-slate-900">
                {tool.name}
              </strong>
            </div>

            <div className="flex flex-col gap-2 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <span className="text-slate-500">
                Category
              </span>

              <strong className="text-slate-900">
                {tool.category}
              </strong>
            </div>

            <div className="flex flex-col gap-2 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <span className="text-slate-500">
                Pricing Model
              </span>

              <strong className="text-slate-900">
                {tool.pricing}
              </strong>
            </div>

            <div className="flex flex-col gap-2 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <span className="text-slate-500">
                Platform
              </span>

              <strong className="text-slate-900">
                Web / Cloud
              </strong>
            </div>

            <div className="flex flex-col gap-2 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <span className="text-slate-500">
                AI Vault URL
              </span>

              <strong className="break-all text-slate-900">
                {canonical}
              </strong>
            </div>

          </div>

        </section>

        {/* =================================================
            FINAL CTA
        ================================================= */}

        <section className="mt-6 rounded-3xl bg-slate-950 p-7 text-white shadow-sm sm:p-10">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
                AI Vault Directory
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Explore More AI Software
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Discover more AI tools, software, developer
                utilities, creative platforms, and productivity
                solutions.
              </p>

            </div>

            <Link
              href="/"
              className="inline-flex shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-blue-50"
            >
              Explore AI Directory →
            </Link>

          </div>

        </section>

      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">

          <p>
            © {new Date().getFullYear()} AI Vault. All rights
            reserved.
          </p>

          <div className="flex flex-wrap gap-4">

            <Link
              href="/about"
              className="hover:text-slate-900"
            >
              About
            </Link>

            <Link
              href="/contact"
              className="hover:text-slate-900"
            >
              Contact
            </Link>

            <Link
              href="/privacy"
              className="hover:text-slate-900"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="hover:text-slate-900"
            >
              Terms
            </Link>

          </div>

        </div>

      </footer>

    </main>
  );
}
