import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://aivault.pp.ua";
const SITE_NAME = "AI Vault";

/* =========================================================
   TYPES
========================================================= */

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
};

/* =========================================================
   SUPABASE
========================================================= */

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeWebsite(value: unknown): string {
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

function shortDescription(value: unknown): string {
  const text = clean(value);

  if (!text) {
    return "Explore this AI software on AI Vault, including features, pricing, use cases, specifications, and alternatives.";
  }

  if (text.length <= 160) {
    return text;
  }

  return `${text.slice(0, 157).trim()}...`;
}

function pricingLabel(value: unknown): string {
  const pricing = clean(value).toLowerCase();

  if (!pricing) {
    return "Not specified";
  }

  if (
    pricing.includes("freemium") ||
    (pricing.includes("free") &&
      pricing.includes("paid"))
  ) {
    return "Freemium";
  }

  if (pricing === "free" || pricing.includes("free")) {
    return "Free";
  }

  if (pricing.includes("paid")) {
    return "Paid";
  }

  if (
    pricing.includes("custom") ||
    pricing.includes("contact")
  ) {
    return "Custom";
  }

  return titleCase(pricing);
}

/* =========================================================
   LOGO HELPERS
========================================================= */

function getInitials(name: string): string {
  const words = name
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "AI";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return (
    words[0][0] +
    words[1][0]
  ).toUpperCase();
}

/* =========================================================
   TOOL LOOKUP
========================================================= */

async function getTool(
  requestedSlug: string
): Promise<ToolPageData | null> {
  const supabase = getSupabase();

  if (!supabase) {
    return null;
  }

  const normalizedSlug = clean(requestedSlug);

  if (!normalizedSlug) {
    return null;
  }

  const fields =
    "id,name,slug,description,category,pricing,website_url,website";

  /* -------------------------------------------------------
     Exact slug
  ------------------------------------------------------- */

  const exactResult = await supabase
    .from("ai_tools")
    .select(fields)
    .eq("slug", normalizedSlug)
    .maybeSingle();

  let data: ToolRecord | null = null;

  if (!exactResult.error && exactResult.data) {
    data = exactResult.data as ToolRecord;
  }

  /* -------------------------------------------------------
     Fallback slug
  ------------------------------------------------------- */

  if (!data) {
    const fallbackResult = await supabase
      .from("ai_tools")
      .select(fields)
      .ilike("slug", normalizedSlug)
      .limit(1)
      .maybeSingle();

    if (
      !fallbackResult.error &&
      fallbackResult.data
    ) {
      data =
        fallbackResult.data as ToolRecord;
    }
  }

  if (!data) {
    return null;
  }

  const name =
    clean(data.name) ||
    titleCase(normalizedSlug) ||
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
    slugify(normalizedSlug);

  const websiteUrl = normalizeWebsite(
    data.website_url ||
      data.website
  );

  return {
    id: data.id,

    name,

    slug: finalSlug,

    description,

    category,

    pricing: pricingLabel(
      data.pricing
    ),

    websiteUrl,
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

  let query = supabase
    .from("ai_tools")
    .select(
      "id,name,slug,description,category,pricing,website_url,website"
    )
    .eq("category", category)
    .limit(12);

  if (
    currentId !== undefined &&
    currentId !== null
  ) {
    query = query.neq(
      "id",
      currentId
    );
  }

  const { data } = await query;

  return (
    (data as ToolRecord[] | null) ??
    []
  );
}

/* =========================================================
   SCORE
========================================================= */

function calculateScore(
  tool: ToolPageData
): number {
  let score = 82;

  if (tool.name.length >= 4) {
    score += 1;
  }

  if (tool.description.length >= 120) {
    score += 1;
  }

  if (tool.description.length >= 300) {
    score += 1;
  }

  if (tool.category) {
    score += 1;
  }

  if (tool.websiteUrl) {
    score += 1;
  }

  return Math.min(
    95,
    Math.max(80, score)
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

  if (category.includes("coding")) {
    return [
      {
        title: "Coding workflow",
        text: `${tool.name} is designed to support coding and software development workflows.`,
      },
      {
        title: "Developer productivity",
        text: "Useful for reducing repetitive development work and improving workflow efficiency.",
      },
      {
        title: "Project workflows",
        text: "Can be evaluated for development, automation, and technical project workflows.",
      },
    ];
  }

  if (
    category.includes("image") ||
    category.includes("design")
  ) {
    return [
      {
        title: "Visual creation",
        text: `${tool.name} supports workflows related to visual content and creative production.`,
      },
      {
        title: "Creative workflow",
        text: "Useful for designers, creators, marketers, and teams working with visual content.",
      },
      {
        title: "Faster experimentation",
        text: "Helps users explore ideas and accelerate creative workflows.",
      },
    ];
  }

  if (category.includes("video")) {
    return [
      {
        title: "Video workflow",
        text: `${tool.name} supports workflows related to video creation, editing, or production.`,
      },
      {
        title: "Content production",
        text: "Useful for creators, marketers, social media teams, and businesses.",
      },
      {
        title: "Productivity",
        text: "Designed to help reduce repetitive work during content production.",
      },
    ];
  }

  if (
    category.includes("writing") ||
    category.includes("content")
  ) {
    return [
      {
        title: "Content workflow",
        text: `${tool.name} supports writing and content-related workflows.`,
      },
      {
        title: "Faster drafting",
        text: "Can help accelerate drafting, editing, and content production.",
      },
      {
        title: "Professional use",
        text: "Useful for creators, marketers, writers, and professional teams.",
      },
    ];
  }

  if (category.includes("marketing")) {
    return [
      {
        title: "Marketing workflows",
        text: `${tool.name} provides capabilities relevant to marketing and growth workflows.`,
      },
      {
        title: "Workflow optimization",
        text: "Can help teams streamline repetitive marketing tasks.",
      },
      {
        title: "Business productivity",
        text: "Useful for marketers, agencies, startups, and businesses.",
      },
    ];
  }

  return [
    {
      title: "AI-powered workflow",
      text: `${tool.name} is designed for workflows related to ${tool.category.toLowerCase()}.`,
    },
    {
      title: "Productivity",
      text: "Designed to simplify tasks and improve workflow efficiency.",
    },
    {
      title: "Flexible use cases",
      text: "Can be evaluated by individuals, creators, professionals, and teams.",
    },
  ];
}

/* =========================================================
   LIMITATIONS
========================================================= */

function getLimitations() {
  return [
    "Features and capabilities may change as the provider updates the product.",
    "Pricing and plan limits should be confirmed on the official website.",
    "Some advanced features may only be available on selected plans.",
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

  if (category.includes("coding")) {
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
      "Visual Content",
      "Design Workflow",
      "Creative Production",
      "Marketing Content",
    ];
  }

  if (category.includes("video")) {
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
      "Writing Assistance",
      "Productivity",
    ];
  }

  if (category.includes("marketing")) {
    return [
      "Marketing Automation",
      "Campaign Optimization",
      "Growth Workflows",
      "Business Productivity",
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
        `Who should use ${tool.name}?`,

      answer:
        `${tool.name} may be useful for individuals, creators, professionals, developers, teams, and businesses looking for ${tool.category.toLowerCase()} solutions.`,
    },

    {
      question:
        `What are the alternatives to ${tool.name}?`,

      answer:
        `AI Vault lists related tools from the same category so you can compare similar software and find an option that fits your workflow.`,
    },

    {
      question:
        `Does ${tool.name} require installation?`,

      answer:
        `Access and installation requirements can change. Check the official ${tool.name} website for the latest platform and access information.`,
    },
  ];
}

/* =========================================================
   JSON-LD
========================================================= */

function createSoftwareSchema(
  tool: ToolPageData,
  canonicalUrl: string
) {
  return {
    "@context":
      "https://schema.org",

    "@type":
      "SoftwareApplication",

    name:
      tool.name,

    description:
      shortDescription(
        tool.description
      ),

    applicationCategory:
      tool.category,

    operatingSystem:
      "Web",

    url:
      canonicalUrl,

    isPartOf: {
      "@type":
        "WebSite",

      name:
        SITE_NAME,

      url:
        SITE_URL,
    },

    publisher: {
      "@type":
        "Organization",

      name:
        SITE_NAME,

      url:
        SITE_URL,
    },
  };
}

function createBreadcrumbSchema(
  tool: ToolPageData,
  canonicalUrl: string
) {
  return {
    "@context":
      "https://schema.org",

    "@type":
      "BreadcrumbList",

    itemListElement: [
      {
        "@type":
          "ListItem",

        position:
          1,

        name:
          "Home",

        item:
          SITE_URL,
      },

      {
        "@type":
          "ListItem",

        position:
          2,

        name:
          "AI Tools",

        item:
          SITE_URL,
      },

      {
        "@type":
          "ListItem",

        position:
          3,

        name:
          tool.category,

        item:
          `${SITE_URL}/?category=${encodeURIComponent(
            tool.category
          )}`,
      },

      {
        "@type":
          "ListItem",

        position:
          4,

        name:
          tool.name,

        item:
          canonicalUrl,
      },
    ],
  };
}

function createFaqSchema(
  faqs: {
    question: string;
    answer: string;
  }[]
) {
  return {
    "@context":
      "https://schema.org",

    "@type":
      "FAQPage",

    mainEntity:
      faqs.map(
        (faq) => ({
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
        })
      ),
  };
}

/* =========================================================
   PAGE
========================================================= */

export default async function ToolPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;

  const tool =
    await getTool(slug);

  if (!tool) {
    notFound();
  }

  const canonicalUrl =
    `${SITE_URL}/tool/${tool.slug}`;

  const score =
    calculateScore(tool);

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

  const softwareSchema =
    createSoftwareSchema(
      tool,
      canonicalUrl
    );

  const breadcrumbSchema =
    createBreadcrumbSchema(
      tool,
      canonicalUrl
    );

  const faqSchema =
    createFaqSchema(faqs);

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-slate-900">

      {/* =================================================
          STRUCTURED DATA
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

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

            {/* LOGO */}

            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-2xl font-black text-white shadow-lg"
              aria-label={`${tool.name} logo`}
            >
              {getInitials(
                tool.name
              )}
            </div>

            {/* INFO */}

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

                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  AI Vault Score
                </div>

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
            evaluate AI software before choosing a platform
            for their workflow. Explore the capabilities,
            pricing model, use cases, limitations, and related
            tools below.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              AI
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {tool.category}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {tool.name}
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

          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">
            {tool.name} may be suitable for developers,
            creators, professionals, teams, and businesses
            looking for efficient{" "}
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
            Pricing
          </h2>

          <div className="mt-5 flex flex-wrap items-center gap-4">

            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {tool.pricing}
            </span>

            <p className="text-sm leading-6 text-slate-600">
              Pricing and plan availability can change.
              Check the official portal for current information.
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

                    <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-slate-400" />

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

          <ol className="mt-6 space-y-4">

            <li className="flex gap-4 text-sm text-slate-600">
              <span className="font-bold text-slate-900">
                1.
              </span>

              <span>
                Visit the official platform portal for{" "}
                <strong className="text-slate-900">
                  {tool.name}
                </strong>
                .
              </span>
            </li>

            <li className="flex gap-4 text-sm text-slate-600">
              <span className="font-bold text-slate-900">
                2.
              </span>

              <span>
                Create or authenticate your account if required.
              </span>
            </li>

            <li className="flex gap-4 text-sm text-slate-600">
              <span className="font-bold text-slate-900">
                3.
              </span>

              <span>
                Explore the available features and plans.
              </span>
            </li>

            <li className="flex gap-4 text-sm text-slate-600">
              <span className="font-bold text-slate-900">
                4.
              </span>

              <span>
                Start your workflow and evaluate the results.
              </span>
            </li>

          </ol>

        </section>

        {/* =================================================
            ALTERNATIVES / RELATED TOOLS
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <div>

            <h2 className="text-xl font-bold">
              {tool.name} Alternatives
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Explore similar {tool.category.toLowerCase()} AI tools.
            </p>

          </div>

          {relatedTools.length > 0 ? (

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

                  return (
                    <Link
                      key={
                        String(
                          item.id ??
                          itemSlug
                        )
                      }
                      href={
                        `/tool/${itemSlug}`
                      }
                      className="group rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                    >

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white">
                          {getInitials(
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

                      <div className="mt-4 text-xs font-semibold text-blue-600">
                        Explore →
                      </div>

                    </Link>
                  );
                })}

            </div>

          ) : (

            <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
              More alternatives are being added to AI Vault.
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
                  className="py-5 first:pt-0 last:pb-0"
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
            TOOL SPECIFICATIONS
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

              <strong className="text-right text-slate-900">
                {tool.category}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-6 py-4 text-sm">
              <span className="text-slate-500">
                Pricing Model
              </span>

              <strong className="text-right text-slate-900">
                {tool.pricing}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-6 py-4 text-sm">
              <span className="text-slate-500">
                Operating System
              </span>

              <strong className="text-right text-slate-900">
                Web / Cloud
              </strong>
            </div>

            <div className="flex items-center justify-between gap-6 py-4 text-sm">
              <span className="text-slate-500">
                Deployment
              </span>

              <strong className="text-right text-slate-900">
                Hosted SaaS
              </strong>
            </div>

            <div className="flex items-center justify-between gap-6 py-4 text-sm">
              <span className="text-slate-500">
                License
              </span>

              <strong className="text-right text-slate-900">
                Proprietary
              </strong>
            </div>

          </div>

        </section>

        {/* =================================================
            OFFICIAL CTA
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
              Explore More AI Tools
            </Link>

          )}

        </section>

        {/* =================================================
            DISCLAIMER
        ================================================= */}

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          AI Vault is an independent AI software directory.
          Product information, pricing, features, and
          availability may change. Always verify current
          information on the official provider website.
        </p>

      </div>

    </main>
  );
}
