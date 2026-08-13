import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { getDirectSupabaseClient } from "@/lib/supabase-server";
import { ToolLogo } from "@/components/ToolLogo";
import AdSlot from "@/components/AdSlot";

import { SITE_URL } from "@/lib/site-url";
import { resolveToolOutboundUrl } from "@/lib/affiliate/resolver";
import { enrichMissingToolFields } from "@/lib/ai-enrichment";

import {
  DatabaseToolRecord,
  FormattedListItem,
  FAQItem,
  extractYouTubeId,
  normalizeScore,
  parseProsConsColumn,
} from "@/lib/tool-normalizer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

/* =========================================================
   SEO HELPERS
========================================================= */

function createToolCanonical(slug: string): string {
  const cleanSlug = String(slug || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");

  return `${SITE_URL}/tool/${encodeURIComponent(cleanSlug)}`;
}

function getStringField(
  tool: DatabaseToolRecord,
  key: string,
): string | undefined {
  const value = (tool as unknown as Record<string, unknown>)[key];

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function getStringArrayField(
  tool: DatabaseToolRecord,
  key: string,
): string[] {
  const value = (tool as unknown as Record<string, unknown>)[key];

  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function isToolIndexable(tool: DatabaseToolRecord): boolean {
  const verificationStatus = getStringField(
    tool,
    "verification_status",
  )?.toUpperCase();

  const websiteStatus = getStringField(
    tool,
    "website_status",
  )?.toUpperCase();

  if (verificationStatus === "REJECTED") {
    return false;
  }

  if (websiteStatus === "BROKEN") {
    return false;
  }

  return true;
}

/* =========================================================
   SUPABASE CLIENT
========================================================= */

async function getSupabaseClient() {
  try {
    return getDirectSupabaseClient();
  } catch {
    return null;
  }
}

/* =========================================================
   GET TOOL FROM DATABASE
========================================================= */

async function getToolFromDatabase(
  rawSlug: string,
): Promise<DatabaseToolRecord | null> {
  const supabase = await getSupabaseClient();

  if (!supabase || !rawSlug || typeof rawSlug !== "string") {
    return null;
  }

  try {
    const cleanSlug = decodeURIComponent(rawSlug)
      .toLowerCase()
      .trim();

    let { data, error } = await supabase
      .from("ai_tools")
      .select("*")
      .eq("slug", cleanSlug)
      .maybeSingle();

    /*
     * Fallback for slug formatting differences.
     */
    if (!data && !error) {
      const fallback = await supabase
        .from("ai_tools")
        .select("*")
        .ilike("slug", cleanSlug)
        .maybeSingle();

      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data) {
      return null;
    }

    let record = data as DatabaseToolRecord;

    /*
     * Normalize old/incomplete tool records.
     */
    try {
      record = enrichMissingToolFields(record);
    } catch {
      // Keep original database record if enrichment fails.
    }

    /*
     * Preserve existing pros/cons normalization.
     */
    try {
      const parsed = parseProsConsColumn(record.pros_cons);

      if (
        parsed &&
        typeof parsed === "object"
      ) {
        const parsedRecord = parsed as {
          pros?: FormattedListItem[];
          cons?: FormattedListItem[];
        };

        if (
          Array.isArray(parsedRecord.pros) &&
          parsedRecord.pros.length > 0
        ) {
          record.features_pros = parsedRecord.pros;
        }

        if (
          Array.isArray(parsedRecord.cons) &&
          parsedRecord.cons.length > 0
        ) {
          record.limitations_cons = parsedRecord.cons;
        }
      }
    } catch {
      // Ignore malformed legacy pros/cons data.
    }

    return record;
  } catch {
    return null;
  }
}

/* =========================================================
   RELATED TOOLS
========================================================= */

async function getRelatedTools(
  category: string,
  currentSlug: string,
): Promise<DatabaseToolRecord[]> {
  const supabase = await getSupabaseClient();

  if (!supabase || !category) {
    return [];
  }

  try {
    const { data } = await supabase
      .from("ai_tools")
      .select(
        "name, slug, category, pricing, image_url, logo_url, description, score, rating",
      )
      .ilike("category", category)
      .neq("slug", currentSlug)
      .limit(8);

    return (data || []) as DatabaseToolRecord[];
  } catch {
    return [];
  }
}

/* =========================================================
   DYNAMIC SEO METADATA
========================================================= */

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug;

  if (!rawSlug) {
    return {
      title: "Tool Not Found | AI Vault",
      description:
        "The requested AI tool could not be found in AI Vault.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const tool = await getToolFromDatabase(rawSlug);

  /*
   * IMPORTANT:
   * Never allow a missing tool page to become an indexed
   * thin/empty SEO page.
   */
  if (!tool) {
    return {
      title: "Tool Not Found | AI Vault",

      description:
        "The requested AI tool could not be found in the AI Vault directory.",

      robots: {
        index: false,
        follow: false,
      },

      alternates: {
        canonical: `${SITE_URL}/tool/${encodeURIComponent(rawSlug)}`,
      },
    };
  }

  const toolName =
    getStringField(tool, "name") || "AI Tool";

  const canonical =
    getStringField(tool, "canonical_url") ||
    createToolCanonical(tool.slug || rawSlug);

  /*
   * SEO TITLE
   *
   * Priority:
   * 1. meta_title
   * 2. seo_title
   * 3. generated title
   */
  const customMetaTitle =
    getStringField(tool, "meta_title");

  const seoTitle =
    getStringField(tool, "seo_title");

  const title =
    customMetaTitle ||
    seoTitle ||
    `${tool.name} — Features, Pricing, Reviews & Alternatives`;

  /*
   * SEO DESCRIPTION
   */
  const customMetaDescription =
    getStringField(tool, "meta_description");

  const seoDescription =
    getStringField(tool, "seo_description");

  const normalDescription =
    getStringField(tool, "description");

  const description =
    customMetaDescription ||
    seoDescription ||
    normalDescription ||
    `Discover ${tool.name} on AI Vault. Explore features, pricing, use cases, alternatives, reviews and AI Vault Score.`;

  /*
   * KEYWORDS
   */
  const databaseKeywords =
    getStringArrayField(tool, "seo_keywords");

  const keywords =
    databaseKeywords.length > 0
      ? databaseKeywords
      : [
          toolName,
          "AI tool",
          `${tool.name} alternatives`,
          `${tool.name} pricing`,
          `${tool.name} review`,
          `${tool.name} features`,
          "best AI tools",
          "AI tools directory",
        ];

  /*
   * INDEXATION CONTROL
   */
  const indexable = isToolIndexable(tool);

  /*
   * IMAGE
   *
   * Support multiple existing database column names.
   */
  const logoUrl =
    getStringField(tool, "logo_url") ||
    getStringField(tool, "logo") ||
    getStringField(tool, "image_url") ||
    getStringField(tool, "image");

  const openGraphImages = logoUrl
    ? [
        {
          url: logoUrl,
          width: 512,
          height: 512,
          alt: `${tool.name} logo`,
        },
      ]
    : [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `AI Vault — ${tool.name}`,
        },
      ];

  return {
    title,
    description,
    keywords,

    metadataBase: new URL(SITE_URL),

    alternates: {
      canonical,
    },

    robots: {
      index: indexable,
      follow: true,

      googleBot: {
        index: indexable,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: "AI Vault",
      locale: "en_US",
      images: openGraphImages,
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: logoUrl
        ? [logoUrl]
        : [`${SITE_URL}/og-image.png`],
    },
  };
}

/* =========================================================
   PAGE
========================================================= */

export default async function ToolPage({
  params,
}: Props) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug;

  if (!rawSlug) {
    notFound();
  }

  const tool = await getToolFromDatabase(rawSlug);

  if (!tool) {
    notFound();
  }

  /*
   * =======================================================
   * EXISTING PAGE LOGIC STARTS HERE
   * =======================================================
   */

  const relatedTools = await getRelatedTools(
    tool.category || "",
    tool.slug,
  );

  const generalRelated = relatedTools;

  const officialUrlClean =
    typeof tool.website_url === "string" &&
    tool.website_url.trim()
      ? tool.website_url.trim()
      : null;

  const {
    outboundUrl,
    isAffiliate,
    buttonLabel,
  } = await resolveToolOutboundUrl(
    tool.id,
    tool.slug,
    officialUrlClean,
  );

  const youtubeVideoId =
    extractYouTubeId(
      tool.youtube_id ||
        tool.youtube_url ||
        tool.youtube_id,
    );

  const normalizedScore =
    normalizeScore(
      tool.score ||
        tool.rating ||
        0,
    );

  const prosList: FormattedListItem[] =
    Array.isArray(tool.features_pros)
      ? tool.features_pros
      : [];

  const consList: FormattedListItem[] =
    Array.isArray(tool.limitations_cons)
      ? tool.limitations_cons
      : [];

  const howToSteps: string[] =
    Array.isArray(tool.how_to_use)
      ? tool.how_to_use
      : [];

  const useCasesList: string[] =
    Array.isArray(tool.use_cases)
      ? tool.use_cases
      : [];

  const integrationsList: string[] =
    Array.isArray(tool.integrations)
      ? tool.integrations
      : [];

  const tagsList: string[] =
    Array.isArray(tool.tags)
      ? tool.tags
      : [];

  const faqsList: FAQItem[] =
    Array.isArray(tool.faqs)
      ? tool.faqs
      : [];

  const whoShouldUseText =
    typeof tool.who_should_use === "string"
      ? tool.who_should_use
      : Array.isArray(tool.who_should_use)
        ? tool.who_should_use.join(", ")
        : typeof tool.whoShouldUse === "string"
          ? tool.whoShouldUse
          : Array.isArray(tool.whoShouldUse)
            ? tool.whoShouldUse.join(", ")
            : `${tool.name} is designed for developers, creators, marketers, businesses, and teams seeking AI-powered solutions.`;

  const pricingNote =
    typeof tool.pricing_details === "string"
      ? tool.pricing_details
      : typeof tool.pricing_details === "object" &&
          tool.pricing_details !== null
        ? String(
            (tool.pricing_details as Record<string, unknown>)
              .note || "",
          )
        : `${tool.name} pricing varies by plan. Check the official website for current pricing.`;

  /*
   * =======================================================
   * STRUCTURED DATA
   * =======================================================
   */

  const canonicalUrl = createToolCanonical(tool.slug);

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
        item: `${SITE_URL}/tools`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.category || "Software",
        item: `${SITE_URL}/category/${encodeURIComponent(
          tool.category || "software",
        )}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: tool.name,
        item: canonicalUrl,
      },
    ],
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",

    name: tool.name,

    applicationCategory:
      tool.category || "Software",

    operatingSystem:
      tool.operating_system || "Web / Cloud",

    url: outboundUrl || officialUrlClean || canonicalUrl,

    description:
      tool.description ||
      `${tool.name} AI tool listed on AI Vault.`,

    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      description:
        tool.pricing ||
        "Pricing varies",
    },

    aggregateRating:
      normalizedScore > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: normalizedScore,
            bestRating: 10,
            worstRating: 0,
            ratingCount:
              typeof 1 === "number"
                ? 1
                : 1,
          }
        : undefined,
  };

  const faqSchema =
    faqsList.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqsList.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSchema),
        }}
      />

      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
      )}

      <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans">

        {/* =================================================
            Sticky Header
        ================================================= */}

        <header className="sticky top-0 z-50 h-20 backdrop-blur-md border-b border-slate-200 bg-white/90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <span className="text-2xl font-black tracking-tight">
                AI Vault
              </span>
            </Link>

            <a
              href={outboundUrl}
              target="_blank"
              rel={
                isAffiliate
                  ? "nofollow sponsored"
                  : "noopener noreferrer"
              }
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-5 py-3 text-sm font-semibold hover:bg-slate-800 transition"
            >
              {isAffiliate
                ? "VISIT PARTNER PORTAL"
                : buttonLabel}
            </a>

          </div>
        </header>

        {/* =================================================
            MAIN
        ================================================= */}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Breadcrumbs */}

          <nav
            aria-label="Breadcrumb"
            className="text-xs font-medium text-slate-500 mb-6"
          >
            <ol className="flex flex-wrap items-center gap-2">

              <li>
                <Link
                  href="/"
                  className="hover:text-slate-900"
                >
                  Home
                </Link>
              </li>

              <li>/</li>

              <li>
                <Link
                  href="/"
                  className="hover:text-slate-900"
                >
                  AI Tools
                </Link>
              </li>

              <li>/</li>

              <li>
                <Link
                  href={`/category/${encodeURIComponent(
                    tool.category || "",
                  )}`}
                  className="hover:text-slate-900"
                >
                  {tool.category || "Software"}
                </Link>
              </li>

              <li>/</li>

              <li className="text-slate-900 font-bold">
                {tool.name}
              </li>

            </ol>
          </nav>

          {/* =================================================
              HERO
          ================================================= */}

          <section className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 mb-8">

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">

              <ToolLogo
                tool={tool}
                size="xl"
              />

              <div className="space-y-2">

                <div className="flex flex-wrap items-center gap-2">

                  <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-medium">
                    {tool.category || "Software"}
                  </span>

                  <span className="px-3 py-1 rounded-full bg-slate-100 text-xs">
                    {tool.pricing || "Freemium"}
                  </span>

                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                  {tool.name}
                </h1>

              </div>

            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  AI Vault Score
                </span>

                <div className="text-3xl font-black">
                  {normalizedScore}
                  <span className="text-base text-slate-400">
                    /10
                  </span>
                </div>
              </div>

            </div>

          </section>

          {/* =================================================
              OVERVIEW
          ================================================= */}

          {tool.description && (
            <section className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 mb-8">

              <h2 className="text-xl font-black text-slate-900 mb-4">
                Overview
              </h2>

              <div className="prose prose-slate max-w-none text-sm leading-relaxed">
                {tool.description}
              </div>

              {tagsList.length > 0 && (
                <div className="pt-4 flex flex-wrap gap-2">
                  {tagsList.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs font-bold text-slate-700 bg-slate-100 rounded-full px-3 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

            </section>
          )}

          <AdSlot slotId="tool-after-overview" />

          {/* =================================================
              WHO SHOULD USE
          ================================================= */}

          {whoShouldUseText && (
            <section className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 mb-8">

              <h2 className="text-xl font-black text-slate-900">
                Who Should Use {tool.name}?
              </h2>

              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {whoShouldUseText}
              </p>

            </section>
          )}

          {/* =================================================
              YOUTUBE
          ================================================= */}

          {youtubeVideoId && (
            <section className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 mb-8">

              <h2 className="text-xl font-black text-slate-900 mb-4">
                {tool.name} Video Overview
              </h2>

              <div className="relative w-full aspect-video rounded-2xl overflow-hidden">

                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
                  title={`${tool.name} Video Overview`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />

              </div>

            </section>
          )}

          {/* =================================================
              CONTENT GRID
          ================================================= */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <div className="lg:col-span-2 space-y-8">

              {/* Pricing */}

              {pricingNote && (
                <section className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8">

                  <div className="flex items-center justify-between gap-4">

                    <h2 className="text-xl font-black">
                      Pricing
                    </h2>

                    {tool.pricing_url && (
                      <a
                        href={tool.pricing_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-blue-600 hover:text-blue-800"
                      >
                        CHECK OFFICIAL PRICING →
                      </a>
                    )}

                  </div>

                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    {pricingNote}
                  </p>

                </section>
              )}

              {/* Pros / Cons */}

              {(prosList.length > 0 || consList.length > 0) && (
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                  {prosList.length > 0 && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6">

                      <h2 className="text-lg font-black mb-4">
                        Key Features
                      </h2>

                      <ol className="space-y-3 text-sm text-slate-600">

                        {prosList.map((item, i) => (
                          <li key={i}>
                            {item.title && (
                              <strong className="font-bold">
                                {item.title}:{" "}
                              </strong>
                            )}
                            {item.description}
                          </li>
                        ))}

                      </ol>

                    </div>
                  )}

                  {consList.length > 0 && (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6">

                      <h2 className="text-lg font-black mb-4">
                        Limitations
                      </h2>

                      <ol className="space-y-3 text-sm text-slate-600">

                        {consList.map((item, i) => (
                          <li key={i}>
                            {item.title && (
                              <strong className="font-bold">
                                {item.title}:{" "}
                              </strong>
                            )}
                            {item.description}
                          </li>
                        ))}

                      </ol>

                    </div>
                  )}

                </section>
              )}

              {/* Use Cases */}

              {useCasesList.length > 0 && (
                <section className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8">

                  <h2 className="text-xl font-black mb-4">
                    Use Cases
                  </h2>

                  <div className="flex flex-wrap gap-2">

                    {useCasesList.map((useCase, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium"
                      >
                        {useCase}
                      </span>
                    ))}

                  </div>

                </section>
              )}

              {/* How To Use */}

              {howToSteps.length > 0 && (
                <section className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8">

                  <h2 className="text-xl font-black mb-4">
                    How To Get Started
                  </h2>

                  <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">

                    {howToSteps.map((step, idx) => (
                      <li key={idx}>
                        {step}
                      </li>
                    ))}

                  </ol>

                </section>
              )}

              {/* FAQs */}

              {faqsList.length > 0 && (
                <section className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8">

                  <h2 className="text-xl font-black mb-5">
                    Frequently Asked Questions
                  </h2>

                  <div className="space-y-4 divide-y divide-slate-100">

                    {faqsList.map((faq, index) => (
                      <div
                        key={index}
                        className="pt-4 first:pt-0"
                      >
                        <h3 className="text-sm font-black">
                          {faq.q}
                        </h3>

                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    ))}

                  </div>

                </section>
              )}

            </div>

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6">

                <h2 className="text-lg font-black mb-4">
                  Tool Specifications
                </h2>

                <dl className="space-y-4 text-sm">

                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">
                      Category
                    </dt>
                    <dd className="font-bold text-right">
                      {tool.category || "—"}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">
                      Pricing Model
                    </dt>
                    <dd className="font-bold text-right">
                      {tool.pricing || "—"}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">
                      Operating System
                    </dt>
                    <dd className="font-bold text-right">
                      {tool.operating_system || "Web / Cloud"}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">
                      Deployment
                    </dt>
                    <dd className="font-bold text-right">
                      {tool.deployment || "Web"}
                    </dd>
                  </div>

                  {tool.license && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">
                        License
                      </dt>
                      <dd className="font-bold text-right">
                        {tool.license}
                      </dd>
                    </div>
                  )}

                  {integrationsList.length > 0 && (
                    <div className="pt-4 border-t border-slate-100">

                      <dt className="text-slate-500 font-medium mb-2">
                        Integrations
                      </dt>

                      <dd className="flex flex-wrap gap-1.5 justify-end">

                        {integrationsList.map((integration, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded"
                          >
                            {integration}
                          </span>
                        ))}

                      </dd>

                    </div>
                  )}

                </dl>

                <div className="space-y-2 pt-5">

                  <a
                    href={outboundUrl}
                    target="_blank"
                    rel={
                      isAffiliate
                        ? "nofollow sponsored"
                        : "noopener noreferrer"
                    }
                    className="w-full inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-5 py-3 text-sm font-bold hover:bg-slate-800 transition"
                  >
                    {isAffiliate
                      ? "VISIT PARTNER PORTAL"
                      : buttonLabel}
                  </a>

                  {tool.documentation_url && (
                    <a
                      href={tool.documentation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold hover:bg-slate-50 transition"
                    >
                      VIEW DOCUMENTATION
                    </a>
                  )}

                  {isAffiliate && officialUrlClean && (
                    <a
                      href={officialUrlClean}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold hover:bg-slate-50 transition"
                    >
                      Visit Official Direct Website
                    </a>
                  )}

                  {isAffiliate && (
                    <p className="text-[10px] text-slate-400 text-center pt-2">
                      Disclosure: Some links may be sponsored affiliate links.
                    </p>
                  )}

                </div>

              </div>

              <AdSlot
                slotId="tool-sidebar"
                format="rectangle"
              />

            </aside>

          </div>

          {/* =================================================
              RELATED TOOLS
          ================================================= */}

          {generalRelated.length > 0 && (
            <section className="mt-12 border-t border-slate-200/80 pt-8">

              <div className="flex items-center justify-between gap-4 mb-5">

                <h2 className="text-xl font-black">
                  Best Alternatives & Related Tools in{" "}
                  {tool.category || "AI"}
                </h2>

                <Link
                  href={`/category/${encodeURIComponent(
                    tool.category || "",
                  )}`}
                  className="text-xs font-bold text-blue-600"
                >
                  View Full Directory →
                </Link>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {generalRelated.map((relatedTool) => (

                  <Link
                    key={relatedTool.slug}
                    href={`/tool/${encodeURIComponent(
                      relatedTool.slug,
                    )}`}
                    className="group bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-slate-400 transition"
                  >

                    <div className="flex items-center gap-3">

                      <ToolLogo
                        tool={relatedTool}
                        size="md"
                      />

                      <div className="min-w-0">

                        <h3 className="font-bold text-sm text-slate-900 truncate">
                          {relatedTool.name}
                        </h3>

                        <p className="text-[10px] text-slate-400 truncate">
                          {relatedTool.category || "AI Tool"}
                        </p>

                      </div>

                    </div>

                  </Link>

                ))}

              </div>

            </section>
          )}

        </main>

      </div>
    </>
  );
}
