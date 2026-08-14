import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ToolLogo from "@/components/ToolLogo";

import {
  SITE_URL,
  clean,
  getAiVaultScore,
  getDescription,
  getFeatures,
  getIntegrations,
  getLimitations,
  getOverview,
  getToolBySlug,
  getToolCategory,
  getToolName,
  getUseCases,
  getWebsiteUrl,
  getSeoDescription,
  getSeoTitle,
  normalizePricing,
  safeDecode,
  toolUrl,
  type ToolRecord,
} from "@/lib/ai-vault";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

/* =========================================================
   SAFE HELPERS
========================================================= */

function normalizeCategorySlug(
  category: string
): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeString(
  value: unknown
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

function safeArray(
  value: unknown
): string[] {
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is string =>
          typeof item === "string" &&
          item.trim().length > 0
      )
      .map((item) =>
        item.trim()
      );
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return value
      .split(/[,;\n|]+/)
      .map((item) =>
        item.trim()
      )
      .filter(Boolean);
  }

  return [];
}

/**
 * Only use an audience value if the database
 * explicitly contains it.
 *
 * We NEVER invent audience segments.
 */
function getAudience(
  tool: ToolRecord
): string[] {
  const possibleFields = [
    "target_audience",
    "audience",
    "users",
    "user_types",
    "target_users",
  ];

  for (
    const field of possibleFields
  ) {
    const value =
      tool[field];

    const result =
      safeArray(value);

    if (result.length) {
      return result;
    }
  }

  return [];
}

/**
 * Only expose platforms when the source/database
 * explicitly contains them.
 */
function getPlatforms(
  tool: ToolRecord
): string[] {
  const values: string[] = [];

  const platformFields = [
    "platforms",
    "platform",
    "operating_system",
    "os",
    "supported_platforms",
  ];

  for (
    const field of platformFields
  ) {
    const value =
      tool[field];

    values.push(
      ...safeArray(value)
    );
  }

  return Array.from(
    new Set(values)
  );
}

/**
 * Explicit deployment information only.
 */
function getDeployment(
  tool: ToolRecord
): string {
  const fields = [
    "deployment",
    "hosting",
    "deployment_type",
  ];

  for (
    const field of fields
  ) {
    const value =
      safeString(tool[field]);

    if (value) {
      return value;
    }
  }

  return "";
}

/**
 * Explicit license information only.
 */
function getLicense(
  tool: ToolRecord
): string {
  return (
    safeString(tool.license) ||
    safeString(tool.licence)
  );
}

/**
 * Explicit pricing information.
 */
function getPricingRaw(
  tool: ToolRecord
): string {
  return (
    safeString(
      tool.pricing_model
    ) ||
    safeString(tool.pricing)
  );
}

/**
 * Official website.
 */
function getOfficialWebsite(
  tool: ToolRecord
): string {
  return getWebsiteUrl(tool);
}

/* =========================================================
   METADATA
========================================================= */

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;

  const requestedSlug =
    safeDecode(slug);

  /*
   * IMPORTANT:
   *
   * getToolBySlug must perform an exact canonical
   * database slug lookup.
   *
   * We never generate a slug from the tool name.
   */
  const tool =
    await getToolBySlug(
      requestedSlug
    );

  if (!tool) {
    return {
      title:
        "Tool Not Found | AI Vault",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const title =
    getSeoTitle(tool);

  const description =
    getSeoDescription(tool);

  const canonical =
    toolUrl(tool);

  return {
    title,
    description,

    alternates: {
      canonical,
    },

    robots: {
      index: true,
      follow: true,
    },

    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "AI Vault",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/* =========================================================
   SOFTWARE APPLICATION JSON-LD
========================================================= */

function ToolJsonLd({
  tool,
}: {
  tool: ToolRecord;
}) {
  const name =
    getToolName(tool);

  const description =
    getDescription(tool);

  const canonical =
    toolUrl(tool);

  const website =
    getOfficialWebsite(tool);

  const category =
    getToolCategory(tool);

  const jsonLd: Record<
    string,
    unknown
  > = {
    "@context":
      "https://schema.org",

    "@type":
      "SoftwareApplication",

    name,

    description:
      description || undefined,

    applicationCategory:
      category || undefined,

    url: canonical,
  };

  /*
   * Only include sameAs when an official URL
   * actually exists.
   */
  if (website) {
    jsonLd.sameAs = [
      website,
    ];
  }

  /*
   * Pricing is intentionally NOT placed into
   * offers/price because the database may contain
   * only a pricing label such as Freemium/Paid.
   *
   * This prevents fabricated structured-data prices.
   */

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html:
          JSON.stringify(
            jsonLd
          ),
      }}
    />
  );
}

/* =========================================================
   BREADCRUMB JSON-LD
========================================================= */

function BreadcrumbJsonLd({
  tool,
}: {
  tool: ToolRecord;
}) {
  const name =
    getToolName(tool);

  const category =
    getToolCategory(tool);

  const categorySlug =
    normalizeCategorySlug(
      category
    );

  const items = [
    {
      "@type":
        "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
  ];

  if (
    category &&
    categorySlug
  ) {
    items.push({
      "@type":
        "ListItem",
      position: 2,
      name: category,
      item:
        `${SITE_URL}/category/${encodeURIComponent(
          categorySlug
        )}`,
    });
  }

  items.push({
    "@type":
      "ListItem",
    position:
      items.length + 1,
    name,
    item:
      toolUrl(tool),
  });

  const jsonLd = {
    "@context":
      "https://schema.org",

    "@type":
      "BreadcrumbList",

    itemListElement:
      items,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html:
          JSON.stringify(
            jsonLd
          ),
      }}
    />
  );
}

/* =========================================================
   FAQ DATA
========================================================= */

function buildFaqs(
  tool: ToolRecord,
  name: string,
  pricing: string,
  website: string,
  features: string[],
  useCases: string[],
  platforms: string[],
  integrations: string[]
) {
  const faqs: {
    question: string;
    answer: string;
  }[] = [];

  /*
   * What is the tool?
   *
   * Only create this when description exists.
   */
  const description =
    getDescription(tool);

  if (description) {
    faqs.push({
      question:
        `What is ${name} used for?`,
      answer:
        description,
    });
  }

  /*
   * Features FAQ only when real features exist.
   */
  if (features.length) {
    faqs.push({
      question:
        `What are the key features of ${name}?`,
      answer:
        features
          .slice(0, 6)
          .join(", ") + ".",
    });
  }

  /*
   * Use-case FAQ only when actual use cases
   * are present in the database.
   */
  if (useCases.length) {
    faqs.push({
      question:
        `What can you use ${name} for?`,
      answer:
        useCases
          .slice(0, 6)
          .join(", ") + ".",
    });
  }

  /*
   * Pricing FAQ.
   */
  if (pricing) {
    faqs.push({
      question:
        `Is ${name} free?`,
      answer:
        `${name} is listed in AI Vault with the pricing model "${pricing}". Check the official website for current pricing and plan availability.`,
    });
  }

  /*
   * Platform FAQ only when actual platform
   * data exists.
   */
  if (platforms.length) {
    faqs.push({
      question:
        `What platforms does ${name} support?`,
      answer:
        `${name} is listed with the following platform information: ${platforms
          .slice(0, 8)
          .join(", ")}.`,
    });
  }

  /*
   * Integration FAQ only when actual integration
   * data exists.
   */
  if (integrations.length) {
    faqs.push({
      question:
        `Does ${name} offer integrations?`,
      answer:
        `AI Vault lists these integrations for ${name}: ${integrations
          .slice(0, 8)
          .join(", ")}.`,
    });
  }

  /*
   * Getting started.
   *
   * This does NOT claim a specific signup process.
   */
  if (website) {
    faqs.push({
      question:
        `How do I get started with ${name}?`,
      answer:
        `Visit the official ${name} website to review the current product information and available access options.`,
    });
  }

  return faqs;
}

/* =========================================================
   FAQ JSON-LD
========================================================= */

function FaqJsonLd({
  faqs,
}: {
  faqs: {
    question: string;
    answer: string;
  }[];
}) {
  if (!faqs.length) {
    return null;
  }

  const jsonLd = {
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html:
          JSON.stringify(
            jsonLd
          ),
      }}
    />
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function ToolPage({
  params,
}: Props) {
  const { slug: rawSlug } =
    await params;

  /*
   * =======================================================
   * EXACT CANONICAL SLUG
   * =======================================================
   *
   * We decode the requested URL once.
   *
   * We NEVER:
   *
   * normalize name -> slug
   * generate fallback slug
   * redirect one tool to another tool
   *
   * Existing database slugs remain sacred.
   */
  const requestedSlug =
    safeDecode(rawSlug);

  if (
    !requestedSlug.trim()
  ) {
    notFound();
  }

  /*
   * SINGLE SOURCE OF TRUTH
   *
   * getToolBySlug() is used instead of maintaining
   * a second competing query here.
   *
   * This prevents:
   *
   * - duplicate lookup logic
   * - accidental name-based routing
   * - mismatched records
   */
  const tool =
    await getToolBySlug(
      requestedSlug
    );

  if (!tool) {
    notFound();
  }

  /* =======================================================
     NORMALIZED DATA
  ======================================================= */

  const name =
    getToolName(tool);

  const category =
    getToolCategory(tool);

  const categorySlug =
    normalizeCategorySlug(
      category
    );

  const pricing =
    normalizePricing(
      getPricingRaw(tool)
    );

  const score =
    getAiVaultScore(tool);

  const description =
    getDescription(tool);

  const overview =
    getOverview(tool);

  const features =
    getFeatures(tool);

  const useCases =
    getUseCases(tool);

  const limitations =
    getLimitations(tool);

  const integrations =
    getIntegrations(tool);

  const website =
    getOfficialWebsite(tool);

  const platforms =
    getPlatforms(tool);

  const deployment =
    getDeployment(tool);

  const license =
    getLicense(tool);

  const audience =
    getAudience(tool);

  const faqs =
    buildFaqs(
      tool,
      name,
      pricing,
      website,
      features,
      useCases,
      platforms,
      integrations
    );

  const logo =
    clean(tool.logo_url) ||
    clean(tool.logo) ||
    clean(tool.image_url) ||
    clean(tool.icon_url) ||
    null;

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white text-slate-950">

      {/* =====================================================
          STRUCTURED DATA
      ====================================================== */}

      <ToolJsonLd
        tool={tool}
      />

      <BreadcrumbJsonLd
        tool={tool}
      />

      <FaqJsonLd
        faqs={faqs}
      />

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">

        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

          <Link
            href="/"
            className="shrink-0 text-base font-bold tracking-tight sm:text-xl"
          >
            AI Vault
            <span className="text-blue-600">
              .
            </span>
          </Link>

          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-xl bg-slate-950 px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-white transition hover:bg-blue-600 sm:px-5 sm:py-2.5 sm:text-[10px]"
            >
              Visit Official Portal ↗
            </a>
          ) : (
            <span className="rounded-xl bg-slate-100 px-3 py-2 text-[9px] font-bold uppercase text-slate-400">
              Official Portal Unavailable
            </span>
          )}

        </div>

      </header>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">

        {/* ===================================================
            BREADCRUMB
        ==================================================== */}

        <nav
          aria-label="Breadcrumb"
          className="mb-7 flex flex-wrap items-center gap-2 text-xs text-slate-400"
        >

          <Link
            href="/"
            className="hover:text-slate-700"
          >
            Home
          </Link>

          <span>/</span>

          {categorySlug ? (
            <Link
              href={`/category/${encodeURIComponent(
                categorySlug
              )}`}
              className="hover:text-slate-700"
            >
              {category}
            </Link>
          ) : (
            <span>
              {category}
            </span>
          )}

          <span>/</span>

          <span className="font-medium text-slate-700">
            {name}
          </span>

        </nav>

        {/* ===================================================
            HERO
        ==================================================== */}

        <section className="grid gap-7 lg:grid-cols-[1fr_320px]">

          <div>

            <div className="flex items-start gap-4">

              <ToolLogo
                src={logo}
                name={name}
                size="lg"
              />

              <div className="min-w-0">

                <div className="mb-2 flex flex-wrap gap-2">

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                    Verified AI Tool
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    {category}
                  </span>

                </div>

                <h1 className="break-words text-3xl font-black tracking-tight sm:text-4xl">
                  {name}
                </h1>

              </div>

            </div>

            {description && (
              <p className="mt-6 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">
                {description}
              </p>
            )}

          </div>

          {/* =================================================
              QUICK FACTS
          ================================================= */}

          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">

            <div className="rounded-2xl border border-slate-200 bg-white p-4">

              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                AI Vault Score
              </p>

              <p className="mt-2 text-xl font-black">

                {score}

                <span className="text-xs font-medium text-slate-400">
                  /100
                </span>

              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-400">
                Data-quality and catalog completeness signal.
              </p>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">

              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Pricing
              </p>

              <p className="mt-2 text-sm font-bold">
                {pricing || "Unknown"}
              </p>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">

              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Category
              </p>

              <p className="mt-2 text-sm font-bold">
                {category}
              </p>

            </div>

          </div>

        </section>

        {/* ===================================================
            OFFICIAL ACCESS
        ==================================================== */}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-7">

          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Official Access
          </p>

          <h2 className="mt-2 text-lg font-bold">
            Explore {name}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Visit the official platform for the latest product information, availability and pricing.
          </p>

          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-blue-700"
            >
              Visit Official Portal ↗
            </a>
          ) : (
            <div className="mt-5 rounded-xl bg-white px-5 py-3 text-center text-xs font-semibold text-slate-400">
              Official website information is unavailable.
            </div>
          )}

          <Link
            href="/"
            className="mt-3 flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
          >
            ← Back to Directory
          </Link>

        </section>

        {/* ===================================================
            OVERVIEW
        ==================================================== */}

        {overview && (
          <section className="mt-10">

            <h2 className="text-xl font-black">
              About {name}
            </h2>

            <p className="mt-4 max-w-5xl text-sm leading-7 text-slate-600">
              {overview}
            </p>

          </section>
        )}

        {/* ===================================================
            WHO IS IT FOR?
        ==================================================== */}

        {audience.length > 0 && (
          <section className="mt-10">

            <h2 className="text-xl font-black">
              Who is {name} for?
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">

              {audience.map(
                (
                  item,
                  index
                ) => (
                  <span
                    key={`${item}-${index}`}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600"
                  >
                    {item}
                  </span>
                )
              )}

            </div>

          </section>
        )}

        {/* ===================================================
            FEATURES
        ==================================================== */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            Key Features
          </h2>

          {features.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">

              {features.map(
                (
                  feature,
                  index
                ) => (
                  <div
                    key={`${feature}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >

                    <div className="flex gap-3">

                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs text-blue-600">
                        ✓
                      </span>

                      <span className="text-sm font-medium leading-6 text-slate-700">
                        {feature}
                      </span>

                    </div>

                  </div>
                )
              )}

            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              Feature information is not currently available in the catalog.
            </p>
          )}

        </section>

        {/* ===================================================
            USE CASES
        ==================================================== */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            Use Cases
          </h2>

          {useCases.length ? (
            <div className="mt-4 flex flex-wrap gap-2">

              {useCases.map(
                (
                  item,
                  index
                ) => (
                  <span
                    key={`${item}-${index}`}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600"
                  >
                    {item}
                  </span>
                )
              )}

            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Use-case information is not currently available in the catalog.
            </p>
          )}

        </section>

        {/* ===================================================
            PLATFORM DETAILS
        ==================================================== */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            Platform Details
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">

            {[
              [
                "Operating System",
                safeString(
                  tool.operating_system
                ) ||
                  safeString(
                    tool.os
                  ),
              ],
              [
                "Platform",
                platforms.join(
                  ", "
                ),
              ],
              [
                "Deployment",
                deployment,
              ],
              [
                "License",
                license,
              ],
              [
                "Pricing",
                pricing,
              ],
            ].map(
              ([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >

                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {label}
                  </p>

                  <p className="mt-2 text-sm font-bold">
                    {value || "Information unavailable"}
                  </p>

                </div>
              )
            )}

          </div>

        </section>

        {/* ===================================================
            PRICING
        ==================================================== */}

        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">

          <h2 className="text-xl font-black">
            Pricing
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">

            {pricing
              ? `${name} is currently listed with the pricing model "${pricing}".`
              : `AI Vault does not currently have a verified pricing model for ${name}.`}

          </p>

          <p className="mt-2 text-xs font-medium text-slate-500">
            Check the official website for current pricing, plans and availability.
          </p>

          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-blue-600"
            >
              Check Official Pricing ↗
            </a>
          )}

        </section>

        {/* ===================================================
            INTEGRATIONS
        ==================================================== */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            Integrations
          </h2>

          {integrations.length ? (
            <div className="mt-4 flex flex-wrap gap-2">

              {integrations.map(
                (
                  item,
                  index
                ) => (
                  <span
                    key={`${item}-${index}`}
                    className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600"
                  >
                    {item}
                  </span>
                )
              )}

            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Integration information is not currently available in the catalog.
            </p>
          )}

        </section>

        {/* ===================================================
            LIMITATIONS
        ==================================================== */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            Limitations
          </h2>

          {limitations.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">

              {limitations.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={`${item}-${index}`}
                    className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-slate-700"
                  >
                    {item}
                  </div>
                )
              )}

            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Limitation information is not currently available in the catalog.
            </p>
          )}

        </section>

        {/* ===================================================
            HOW TO GET STARTED
        ==================================================== */}

        {website && (
          <section className="mt-10">

            <h2 className="text-xl font-black">
              How to Get Started
            </h2>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">

              <p className="text-sm leading-7 text-slate-600">
                Start by visiting the official {name} website to review its current product information and available access options.
              </p>

              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-blue-700"
              >
                Visit {name} ↗
              </a>

            </div>

          </section>
        )}

        {/* ===================================================
            FAQ
        ==================================================== */}

        {faqs.length > 0 && (
          <section className="mt-10">

            <h2 className="text-xl font-black">
              Frequently Asked Questions
            </h2>

            <div className="mt-5 space-y-3">

              {faqs.map(
                (
                  faq,
                  index
                ) => (
                  <details
                    key={`${faq.question}-${index}`}
                    className="group rounded-2xl border border-slate-200 bg-white"
                  >

                    <summary className="cursor-pointer list-none px-5 py-4 text-sm font-bold text-slate-800">
                      <div className="flex items-center justify-between gap-4">

                        <span>
                          {faq.question}
                        </span>

                        <span className="text-slate-400 transition group-open:rotate-45">
                          +
                        </span>

                      </div>
                    </summary>

                    <div className="border-t border-slate-100 px-5 py-4">

                      <p className="text-sm leading-7 text-slate-600">
                        {faq.answer}
                      </p>

                    </div>

                  </details>
                )
              )}

            </div>

          </section>
        )}

        {/* ===================================================
            INTERNAL LINKS
        ==================================================== */}

        <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          {categorySlug && (
            <Link
              href={`/category/${encodeURIComponent(
                categorySlug
              )}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-bold transition hover:border-blue-300 hover:text-blue-600"
            >
              More {category} Tools →
            </Link>
          )}

          <Link
            href="/ai-finder"
            className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-bold transition hover:border-blue-300 hover:text-blue-600"
          >
            Find AI Tools →
          </Link>

          <Link
            href="/compare"
            className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-bold transition hover:border-blue-300 hover:text-blue-600"
          >
            Compare Tools →
          </Link>

          <Link
            href="/"
            className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-bold transition hover:border-blue-300 hover:text-blue-600"
          >
            Explore Directory →
          </Link>

        </section>

        {/* ===================================================
            FINAL CTA
        ==================================================== */}

        <section className="mt-10 rounded-3xl bg-slate-950 px-6 py-12 text-center text-white sm:px-10">

          <h2 className="text-2xl font-black sm:text-3xl">
            Explore {name}
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Review the verified information available in AI Vault and check the official platform for the latest product details.
          </p>

          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-950 transition hover:bg-blue-50"
            >
              Visit Official Portal ↗
            </a>
          )}

        </section>

      </div>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-slate-200">

        <div className="mx-auto max-w-7xl px-4 py-8 text-xs text-slate-500 sm:px-6 lg:px-8">

          © {new Date().getFullYear()} AI Vault. All rights reserved.

        </div>

      </footer>

    </main>
  );
}
