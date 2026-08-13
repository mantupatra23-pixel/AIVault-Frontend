import type { Metadata } from "next";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://aivault.pp.ua";
const SITE_NAME = "AI Vault";

/* =========================================================
   TYPES
========================================================= */

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
};

type ToolPageData = {
  id?: string | number | null;
  name: string;
  slug: string;
  description: string;
  category: string;
  pricing: string;
  websiteUrl: string;
  score: number;
};

/* =========================================================
   SUPABASE
========================================================= */

function getSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

/* =========================================================
   TEXT HELPERS
========================================================= */

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/^\/+/, "")
    .replace(/\s+/g, " ")
    .trim();
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
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function initials(name: string): string {
  const words = clean(name)
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "AI";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function normalizeWebsite(
  value: unknown
): string {
  const raw = clean(value);

  if (!raw) {
    return "";
  }

  if (
    raw.startsWith("https://") ||
    raw.startsWith("http://")
  ) {
    return raw;
  }

  return `https://${raw}`;
}

function shortDescription(
  value: unknown
): string {
  const text = clean(value);

  if (!text) {
    return "Explore this AI software on AI Vault, including features, pricing, use cases, alternatives, and platform information.";
  }

  if (text.length <= 160) {
    return text;
  }

  return `${text.slice(0, 157).trim()}...`;
}

/* =========================================================
   PRICING
========================================================= */

function pricingLabel(
  value: unknown
): string {
  const raw = clean(value);

  if (!raw) {
    return "Not specified";
  }

  const lower = raw.toLowerCase();

  if (
    lower.includes("freemium")
  ) {
    return "Freemium";
  }

  if (
    lower.includes("free") &&
    lower.includes("paid")
  ) {
    return "Freemium";
  }

  if (lower === "free") {
    return "Free";
  }

  if (
    lower.includes("paid")
  ) {
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

/* =========================================================
   SCORE
========================================================= */

function getScore(
  name: string,
  description: string,
  category: string
): number {
  let score = 82;

  if (name.length > 3) {
    score += 1;
  }

  if (description.length > 120) {
    score += 1;
  }

  if (description.length > 300) {
    score += 1;
  }

  if (category) {
    score += 1;
  }

  return Math.min(
    95,
    Math.max(80, score)
  );
}

/* =========================================================
   DATABASE LOOKUP
========================================================= */

async function getTool(
  requestedSlug: string
): Promise<ToolPageData | null> {
  const supabase = getSupabase();

  if (!supabase) {
    return null;
  }

  const rawSlug = clean(
    requestedSlug
  );

  if (!rawSlug) {
    return null;
  }

  const normalizedSlug =
    slugify(rawSlug);

  const fields =
    "id,name,slug,description,category,pricing,website_url,website";

  let data: ToolRecord | null = null;

  /* -------------------------------------------------------
     1. EXACT SLUG
  ------------------------------------------------------- */

  const exact =
    await supabase
      .from("ai_tools")
      .select(fields)
      .eq("slug", rawSlug)
      .limit(1)
      .maybeSingle();

  if (
    !exact.error &&
    exact.data
  ) {
    data =
      exact.data as ToolRecord;
  }

  /* -------------------------------------------------------
     2. CASE INSENSITIVE SLUG
  ------------------------------------------------------- */

  if (!data) {
    const insensitive =
      await supabase
        .from("ai_tools")
        .select(fields)
        .ilike("slug", rawSlug)
        .limit(1)
        .maybeSingle();

    if (
      !insensitive.error &&
      insensitive.data
    ) {
      data =
        insensitive.data as ToolRecord;
    }
  }

  /* -------------------------------------------------------
     3. NORMALIZED SLUG LOOKUP
     
     Example:
     database:
       cloud-world-model

     URL:
       CLOUD-WORLD-MODEL
  ------------------------------------------------------- */

  if (
    !data &&
    normalizedSlug
  ) {
    const normalized =
      await supabase
        .from("ai_tools")
        .select(fields)
        .ilike(
          "slug",
          normalizedSlug
        )
        .limit(1)
        .maybeSingle();

    if (
      !normalized.error &&
      normalized.data
    ) {
      data =
        normalized.data as ToolRecord;
    }
  }

  /* -------------------------------------------------------
     4. NAME FALLBACK
     
     Example:
       /tool/cloud-world-model

     Can find:
       Cloud World Model
  ------------------------------------------------------- */

  if (
    !data &&
    normalizedSlug
  ) {
    const readableName =
      normalizedSlug.replace(
        /-/g,
        " "
      );

    const nameResult =
      await supabase
        .from("ai_tools")
        .select(fields)
        .ilike(
          "name",
          readableName
        )
        .limit(1)
        .maybeSingle();

    if (
      !nameResult.error &&
      nameResult.data
    ) {
      data =
        nameResult.data as ToolRecord;
    }
  }

  /* -------------------------------------------------------
     5. NOT FOUND
  ------------------------------------------------------- */

  if (!data) {
    return null;
  }

  /* -------------------------------------------------------
     NORMALIZE DATA
  ------------------------------------------------------- */

  const name =
    clean(data.name) ||
    titleCase(rawSlug) ||
    "AI Tool";

  const category =
    clean(data.category) ||
    "AI Software";

  const description =
    clean(data.description) ||
    `Explore ${name}, an AI software solution in the ${category} category. Discover its features, pricing, use cases, capabilities, and alternatives on AI Vault.`;

  const finalSlug =
    slugify(data.slug) ||
    slugify(name) ||
    normalizedSlug;

  const websiteUrl =
    normalizeWebsite(
      data.website_url ||
      data.website
    );

  const pricing =
    pricingLabel(data.pricing);

  const score =
    getScore(
      name,
      description,
      category
    );

  return {
    id: data.id ?? null,
    name,
    slug: finalSlug,
    description,
    category,
    pricing,
    websiteUrl,
    score,
  };
}

/* =========================================================
   RELATED TOOLS
========================================================= */

async function getRelatedTools(
  category: string,
  currentId?: string | number | null
): Promise<ToolRecord[]> {
  const supabase = getSupabase();

  if (!supabase) {
    return [];
  }

  let query =
    supabase
      .from("ai_tools")
      .select(
        "id,name,slug,description,category,pricing,website_url"
      )
      .eq("category", category)
      .limit(12);

  if (
    currentId !== undefined &&
    currentId !== null
  ) {
    query =
      query.neq(
        "id",
        currentId
      );
  }

  const { data } =
    await query;

  return (
    (data as ToolRecord[] | null) ??
    []
  );
}

/* =========================================================
   ALTERNATIVES
========================================================= */

async function getAlternativeTools(
  category: string,
  currentId?: string | number | null
): Promise<ToolRecord[]> {
  const supabase = getSupabase();

  if (!supabase) {
    return [];
  }

  let query =
    supabase
      .from("ai_tools")
      .select(
        "id,name,slug,description,category,pricing,website_url"
      )
      .eq("category", category)
      .limit(16);

  if (
    currentId !== undefined &&
    currentId !== null
  ) {
    query =
      query.neq(
        "id",
        currentId
      );
  }

  const { data } =
    await query;

  return (
    (data as ToolRecord[] | null) ??
    []
  );
}

/* =========================================================
   FEATURES
========================================================= */

function getFeatures(
  tool: ToolPageData
) {
  const category =
    tool.category.toLowerCase();

  if (
    category.includes("coding") ||
    category.includes("developer")
  ) {
    return [
      {
        title:
          "Streamlined coding workflow",
        text:
          `${tool.name} is positioned for ${tool.category.toLowerCase()} workflows, helping users streamline development tasks and improve productivity.`,
      },
      {
        title:
          "Developer productivity",
        text:
          "Designed to support faster development workflows, experimentation, and project execution.",
      },
      {
        title:
          "Workflow optimization",
        text:
          "Useful for developers and teams looking to reduce repetitive work and improve their software workflow.",
      },
    ];
  }

  if (
    category.includes("image") ||
    category.includes("design")
  ) {
    return [
      {
        title:
          "Visual creation",
        text:
          `${tool.name} supports workflows related to ${tool.category.toLowerCase()} and visual content creation.`,
      },
      {
        title:
          "Creative workflow",
        text:
          "Useful for creators, designers, marketers, and teams working with visual content.",
      },
      {
        title:
          "Faster experimentation",
        text:
          "AI-assisted workflows can help users experiment with ideas and creative outputs more efficiently.",
      },
    ];
  }

  if (
    category.includes("video")
  ) {
    return [
      {
        title:
          "Video workflow",
        text:
          `${tool.name} is positioned for video-related workflows and content production.`,
      },
      {
        title:
          "Content production",
        text:
          "Useful for creators, social media teams, marketers, and businesses producing video content.",
      },
      {
        title:
          "Production efficiency",
        text:
          "Designed to help streamline repetitive parts of the content production workflow.",
      },
    ];
  }

  if (
    category.includes("writing") ||
    category.includes("content")
  ) {
    return [
      {
        title:
          "AI-assisted writing",
        text:
          `${tool.name} supports workflows related to writing and content production.`,
      },
      {
        title:
          "Content productivity",
        text:
          "Useful for creators, marketers, professionals, and teams producing written content.",
      },
      {
        title:
          "Faster drafting",
        text:
          "AI-assisted workflows can help accelerate drafting, editing, and content experimentation.",
      },
    ];
  }

  if (
    category.includes("marketing")
  ) {
    return [
      {
        title:
          "Marketing workflows",
        text:
          `${tool.name} is positioned for marketing-related workflows and productivity.`,
      },
      {
        title:
          "Campaign productivity",
        text:
          "Useful for marketers, agencies, growth teams, and businesses.",
      },
      {
        title:
          "Workflow optimization",
        text:
          "Designed to simplify repetitive marketing tasks and improve workflow efficiency.",
      },
    ];
  }

  return [
    {
      title:
        "Core AI capabilities",
      text:
        `${tool.name} provides capabilities related to ${tool.category.toLowerCase()} workflows.`,
    },
    {
      title:
        "Workflow optimization",
      text:
        "Designed to simplify repetitive tasks and improve productivity.",
    },
    {
      title:
        "Flexible use cases",
      text:
        "Potentially useful for individuals, creators, professionals, and teams.",
    },
  ];
}

/* =========================================================
   LIMITATIONS
========================================================= */

function getLimitations() {
  return [
    "Features and availability may change over time.",
    "Pricing and plan availability should be confirmed on the official website.",
    "Some advanced capabilities may depend on the selected plan.",
    "Third-party integrations and platform capabilities may change.",
  ];
}

/* =========================================================
   USE CASES
========================================================= */

function getUseCases(
  tool: ToolPageData
): string[] {
  const category =
    tool.category.toLowerCase();

  if (
    category.includes("coding") ||
    category.includes("developer")
  ) {
    return [
      "Coding Automation",
      "Developer Productivity",
      "Workflow Optimization",
      "Software Development",
    ];
  }

  if (
    category.includes("image") ||
    category.includes("design")
  ) {
    return [
      "Visual Content Creation",
      "Design Workflow",
      "Creative Production",
      "Marketing Content",
    ];
  }

  if (
    category.includes("video")
  ) {
    return [
      "Video Creation",
      "Content Production",
      "Social Media",
      "Marketing",
    ];
  }

  if (
    category.includes("writing") ||
    category.includes("content")
  ) {
    return [
      "Content Creation",
      "Copywriting",
      "Content Marketing",
      "Productivity Enhancement",
    ];
  }

  if (
    category.includes("marketing")
  ) {
    return [
      "Marketing Automation",
      "Campaign Optimization",
      "Growth Workflows",
      "Marketing Productivity",
    ];
  }

  return [
    `${tool.category} Workflows`,
    "Workflow Optimization",
    "Productivity Enhancement",
    "AI-Assisted Tasks",
  ];
}

/* =========================================================
   FAQ
========================================================= */

function getFaqs(
  tool: ToolPageData
) {
  return [
    {
      question:
        `What is ${tool.name} used for?`,
      answer:
        `${tool.name} is an AI software platform listed in the ${tool.category.toLowerCase()} category. Its exact capabilities depend on the current product offering.`,
    },
    {
      question:
        `Is ${tool.name} free to use?`,
      answer:
        `${tool.name} is currently listed on AI Vault with a ${tool.pricing.toLowerCase()} pricing model. Check the official portal for the latest plans and pricing.`,
    },
    {
      question:
        `What are the alternatives to ${tool.name}?`,
      answer:
        `AI Vault provides related ${tool.category.toLowerCase()} tools below so you can compare similar software.`,
    },
    {
      question:
        `Who should use ${tool.name}?`,
      answer:
        `${tool.name} may be useful for individuals, creators, developers, professionals, teams, and businesses looking for ${tool.category.toLowerCase()} solutions.`,
    },
    {
      question:
        `Does ${tool.name} require installation?`,
      answer:
        `Platform requirements can change. Visit the official website to confirm the latest browser, desktop, mobile, or API access options.`,
    },
  ];
}

/* =========================================================
   METADATA
========================================================= */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } =
    await params;

  const tool =
    await getTool(slug);

  if (!tool) {
    return {
      title:
        "AI Tool Not Found | AI Vault",

      description:
        "The requested AI tool could not be found in the AI Vault directory.",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title =
    `${tool.name} — ${tool.category} AI Tool`;

  const description =
    shortDescription(
      tool.description
    );

  const canonical =
    `${SITE_URL}/tool/${tool.slug}`;

  return {
    metadataBase:
      new URL(SITE_URL),

    title,

    description,

    keywords: [
      tool.name,
      `${tool.name} AI`,
      `${tool.name} review`,
      `${tool.name} pricing`,
      `${tool.name} alternatives`,
      `${tool.name} features`,
      `${tool.category} AI tools`,
      "AI tools",
      "AI software",
      "AI SaaS",
      "AI tools directory",
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
        "max-image-preview":
          "large",
        "max-snippet": -1,
        "max-video-preview":
          -1,
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
      card:
        "summary_large_image",
      title,
      description,
    },
  };
}

/* =========================================================
   PAGE
========================================================= */

export default async function ToolPage({
  params,
}: PageProps) {
  const { slug } =
    await params;

  const tool =
    await getTool(slug);

  /* -------------------------------------------------------
     REAL 404
  ------------------------------------------------------- */

  if (!tool) {
    notFound();
  }

  /* -------------------------------------------------------
     CANONICAL URL
     
     Example:
       /tool/CLOUD-WORLD-MODEL
       ->
       /tool/cloud-world-model
  ------------------------------------------------------- */

  const requestedSlug =
    slugify(slug);

  if (
    requestedSlug !==
    tool.slug
  ) {
    redirect(
      `/tool/${tool.slug}`
    );
  }

  const canonical =
    `${SITE_URL}/tool/${tool.slug}`;

  const features =
    getFeatures(tool);

  const limitations =
    getLimitations();

  const useCases =
    getUseCases(tool);

  const faqs =
    getFaqs(tool);

  const relatedTools =
    await getRelatedTools(
      tool.category,
      tool.id
    );

  const alternatives =
    await getAlternativeTools(
      tool.category,
      tool.id
    );

  /* =======================================================
     SOFTWARE SCHEMA
  ======================================================= */

  const softwareSchema = {
    "@context":
      "https://schema.org",

    "@type":
      "SoftwareApplication",

    name: tool.name,

    description:
      tool.description,

    applicationCategory:
      tool.category,

    operatingSystem:
      "Web",

    url: canonical,

    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },

    publisher: {
      "@type":
        "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },

    offers: {
      "@type": "Offer",
      url:
        tool.websiteUrl ||
        canonical,

      category:
        tool.pricing,
    },
  };

  /* =======================================================
     BREADCRUMB SCHEMA
  ======================================================= */

  const breadcrumbSchema = {
    "@context":
      "https://schema.org",

    "@type":
      "BreadcrumbList",

    itemListElement: [
      {
        "@type":
          "ListItem",

        position: 1,

        name: "Home",

        item: SITE_URL,
      },

      {
        "@type":
          "ListItem",

        position: 2,

        name: "AI Tools",

        item: SITE_URL,
      },

      {
        "@type":
          "ListItem",

        position: 3,

        name: tool.category,

        item:
          `${SITE_URL}/category/${slugify(
            tool.category
          )}`,
      },

      {
        "@type":
          "ListItem",

        position: 4,

        name: tool.name,

        item: canonical,
      },
    ],
  };

  /* =======================================================
     FAQ SCHEMA
  ======================================================= */

  const faqSchema = {
    "@context":
      "https://schema.org",

    "@type":
      "FAQPage",

    mainEntity:
      faqs.map((faq) => ({
        "@type":
          "Question",

        name:
          faq.question,

        acceptedAnswer: {
          "@type":
            "Answer",

          text:
            faq.answer,
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
          __html:
            JSON.stringify(
              softwareSchema
            ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              breadcrumbSchema
            ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
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
            AI Vault
          </Link>

          {tool.websiteUrl ? (
            <a
              href={
                tool.websiteUrl
              }
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="rounded-xl bg-slate-950 px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-blue-600"
            >
              Visit Official Portal ↗
            </a>
          ) : (
            <Link
              href="/"
              className="rounded-xl bg-slate-950 px-5 py-3 text-xs font-bold uppercase tracking-wide text-white"
            >
              Explore AI Tools
            </Link>
          )}

        </div>

      </header>

      {/* =================================================
          MAIN CONTENT
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

          <Link
            href={`/category/${slugify(
              tool.category
            )}`}
            className="hover:text-blue-600"
          >
            {tool.category}
          </Link>

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
              {initials(
                tool.name
              )}
            </div>

            {/* TITLE */}

            <div className="min-w-0 flex-1">

              <div className="mb-3 flex flex-wrap gap-2">

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {tool.category}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {tool.pricing}
                </span>

              </div>

              <h1 className="break-words text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {tool.name}
              </h1>

              <div className="mt-5">

                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  AI VAULT SCORE
                </div>

                <div className="text-3xl font-black text-slate-950">
                  {tool.score}

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
            AI Vault helps users discover,
            compare, and evaluate AI
            software before choosing a
            platform for their workflow.
            Explore the capabilities,
            pricing, use cases,
            limitations, and related tools
            below.
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
            {tool.name} may be suitable
            for developers, creators,
            professionals, teams, and
            businesses looking for
            efficient{" "}
            <strong className="text-slate-900">
              {tool.category.toLowerCase()}
            </strong>{" "}
            solutions.
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

            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              {tool.pricing}
            </span>

            <p className="text-sm text-slate-600">
              Pricing can change over
              time. Check the official
              portal for current plans,
              limits, and availability.
            </p>

          </div>

        </section>

        {/* =================================================
            FEATURES + LIMITATIONS
        ================================================= */}

        <section className="mt-6 grid gap-6 md:grid-cols-2">

          {/* FEATURES */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            <h2 className="text-xl font-bold">
              Key Features
            </h2>

            <div className="mt-6 space-y-6">

              {features.map(
                (feature) => (
                  <div
                    key={
                      feature.title
                    }
                  >

                    <h3 className="text-sm font-bold text-slate-900">
                      {feature.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {feature.text}
                    </p>

                  </div>
                )
              )}

            </div>

          </div>

          {/* LIMITATIONS */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            <h2 className="text-xl font-bold">
              Limitations
            </h2>

            <div className="mt-6 space-y-5">

              {limitations.map(
                (item) => (
                  <div
                    key={item}
                    className="flex gap-3"
                  >

                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />

                    <p className="text-sm leading-6 text-slate-600">
                      {item}
                    </p>

                  </div>
                )
              )}

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

            {useCases.map(
              (useCase) => (
                <span
                  key={useCase}
                  className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700"
                >
                  {useCase}
                </span>
              )
            )}

          </div>

        </section>

        {/* =================================================
            HOW TO GET STARTED
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold">
            How To Get Started
          </h2>

          <ol className="mt-6 space-y-4 text-sm text-slate-600">

            <li className="flex gap-4">
              <span className="font-bold text-slate-900">
                1.
              </span>

              <span>
                Visit the official{" "}
                {tool.name} website.
              </span>
            </li>

            <li className="flex gap-4">
              <span className="font-bold text-slate-900">
                2.
              </span>

              <span>
                Create or access your
                account if required.
              </span>
            </li>

            <li className="flex gap-4">
              <span className="font-bold text-slate-900">
                3.
              </span>

              <span>
                Explore the available
                features and plans.
              </span>
            </li>

            <li className="flex gap-4">
              <span className="font-bold text-slate-900">
                4.
              </span>

              <span>
                Choose the workflow that
                matches your needs.
              </span>
            </li>

          </ol>

        </section>

        {/* =================================================
            ALTERNATIVES
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold">
            {tool.name} Alternatives
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Explore similar{" "}
            {tool.category.toLowerCase()}{" "}
            tools on AI Vault.
          </p>

          {alternatives.length > 0 ? (

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {alternatives
                .slice(0, 8)
                .map((item) => {

                  const itemName =
                    clean(item.name) ||
                    "AI Tool";

                  const itemSlug =
                    slugify(item.slug) ||
                    slugify(itemName);

                  if (!itemSlug) {
                    return null;
                  }

                  return (
                    <Link
                      key={String(
                        item.id ??
                        itemSlug
                      )}
                      href={`/tool/${itemSlug}`}
                      className="group rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                    >

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white">
                          {initials(
                            itemName
                          )}
                        </div>

                        <div className="min-w-0">

                          <h3 className="truncate text-sm font-bold text-slate-900">
                            {itemName}
                          </h3>

                          <p className="truncate text-xs text-slate-500">
                            {clean(
                              item.category
                            ) ||
                              tool.category}
                          </p>

                        </div>

                      </div>

                      <div className="mt-4 text-xs font-bold text-blue-600">
                        Explore →
                      </div>

                    </Link>
                  );
                })}

            </div>

          ) : (

            <p className="mt-5 text-sm text-slate-500">
              More alternatives are
              being added to AI Vault.
            </p>

          )}

        </section>

        {/* =================================================
            RELATED TOOLS
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold">
            Related {tool.category} AI Tools
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Discover more AI software
            from this category.
          </p>

          {relatedTools.length > 0 && (

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {relatedTools
                .slice(0, 8)
                .map((item) => {

                  const itemName =
                    clean(item.name) ||
                    "AI Tool";

                  const itemSlug =
                    slugify(item.slug) ||
                    slugify(itemName);

                  if (!itemSlug) {
                    return null;
                  }

                  return (
                    <Link
                      key={String(
                        item.id ??
                        itemSlug
                      )}
                      href={`/tool/${itemSlug}`}
                      className="rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                    >

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
                        {initials(
                          itemName
                        )}
                      </div>

                      <h3 className="mt-4 truncate text-sm font-bold">
                        {itemName}
                      </h3>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {clean(
                          item.category
                        ) ||
                          tool.category}
                      </p>

                      <div className="mt-4 text-xs font-bold text-blue-600">
                        Explore →
                      </div>

                    </Link>
                  );
                })}

            </div>

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

            {faqs.map(
              (faq) => (
                <div
                  key={
                    faq.question
                  }
                  className="py-5"
                >

                  <h3 className="text-sm font-bold text-slate-900">
                    {faq.question}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {faq.answer}
                  </p>

                </div>
              )
            )}

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

            <div className="flex items-center justify-between gap-6 py-4 text-sm">

              <span className="text-slate-500">
                Category
              </span>

              <strong className="text-right">
                {tool.category}
              </strong>

            </div>

            <div className="flex items-center justify-between gap-6 py-4 text-sm">

              <span className="text-slate-500">
                Pricing Model
              </span>

              <strong className="text-right">
                {tool.pricing}
              </strong>

            </div>

            <div className="flex items-center justify-between gap-6 py-4 text-sm">

              <span className="text-slate-500">
                Operating System
              </span>

              <strong className="text-right">
                Web / Cloud
              </strong>

            </div>

            <div className="flex items-center justify-between gap-6 py-4 text-sm">

              <span className="text-slate-500">
                Deployment
              </span>

              <strong className="text-right">
                Hosted SaaS
              </strong>

            </div>

            <div className="flex items-center justify-between gap-6 py-4 text-sm">

              <span className="text-slate-500">
                Directory
              </span>

              <strong className="text-right">
                AI Vault
              </strong>

            </div>

          </div>

        </section>

        {/* =================================================
            OFFICIAL PORTAL CTA
        ================================================= */}

        <section className="mt-6">

          {tool.websiteUrl ? (

            <a
              href={
                tool.websiteUrl
              }
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex w-full items-center justify-center rounded-2xl bg-slate-950 px-6 py-4 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-blue-600"
            >
              Visit Official Portal ↗
            </a>

          ) : (

            <Link
              href="/"
              className="flex w-full items-center justify-center rounded-2xl bg-slate-950 px-6 py-4 text-sm font-bold uppercase tracking-wide text-white"
            >
              Return To AI Directory
            </Link>

          )}

        </section>

      </div>

    </main>
  );
}
