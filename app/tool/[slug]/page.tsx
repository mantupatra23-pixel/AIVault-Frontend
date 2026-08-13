import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ToolLogo } from "@/components/ToolLogo";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

type Tool = {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  pricing?: string | null;
  description?: string | null;
  image_url?: string | null;
  logo_url?: string | null;
  score?: number | null;

  overview?: string | null;
  who_should_use?: string | null;
  key_features?: unknown;
  limitations?: unknown;
  use_cases?: unknown;
  getting_started?: unknown;
  faqs?: unknown;

  operating_system?: string | null;
  deployment?: string | null;
  license?: string | null;
  integrations?: unknown;

  website_url?: string | null;
  official_url?: string | null;

  seo_title?: string | null;
  seo_description?: string | null;
};

function getSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  if (!url || !key) return null;

  return createClient(url, key);
}

function cleanSlug(value: string) {
  return decodeURIComponent(value || "")
    .trim()
    .toLowerCase();
}

function normalizeArray(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;

        if (
          typeof item === "object" &&
          item !== null &&
          "text" in item
        ) {
          return String(
            (item as { text?: unknown }).text || ""
          );
        }

        return String(item);
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|•|,/)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
}

function safeText(value: unknown, fallback = "") {
  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return value.trim();
  }

  return fallback;
}

async function getTool(slug: string) {
  const supabase = getSupabase();

  if (!supabase) {
    console.error("Supabase environment variables missing");
    return null;
  }

  const normalizedSlug = cleanSlug(slug);

  /*
   * IMPORTANT:
   * Resolve the tool case-insensitively.
   * This prevents /tool/Nylas-CLI and
   * /tool/nylas-cli from behaving differently.
   */

  const { data, error } = await supabase
    .from("ai_tools")
    .select("*")
    .ilike("slug", normalizedSlug)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "TOOL DETAIL QUERY ERROR:",
      error
    );
    return null;
  }

  return data as Tool | null;
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;

  const tool = await getTool(slug);

  if (!tool) {
    return {
      title: "AI Tool Not Found | AI Vault",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const category =
    safeText(tool.category, "AI Tools");

  const title =
    safeText(
      tool.seo_title,
      `${tool.name} Review, Features, Pricing & Alternatives | AI Vault`
    );

  const description =
    safeText(
      tool.seo_description,
      safeText(
        tool.description,
        `Discover ${tool.name}, including features, pricing, use cases, limitations and alternatives on AI Vault.`
      )
    );

  const canonicalSlug =
    safeText(tool.slug, slug);

  return {
    title,

    description,

    alternates: {
      canonical:
        `${SITE_URL}/tool/${encodeURIComponent(
          canonicalSlug
        )}`,
    },

    robots: {
      index: true,
      follow: true,
    },

    openGraph: {
      title,
      description,
      type: "website",
      url:
        `${SITE_URL}/tool/${encodeURIComponent(
          canonicalSlug
        )}`,
      siteName: "AI Vault",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ToolPage({
  params,
}: Props) {
  const { slug } = await params;

  const tool = await getTool(slug);

  /*
   * Only return 404 when the tool genuinely
   * does not exist.
   */

  if (!tool) {
    notFound();
  }

  const category =
    safeText(tool.category, "AI Tools");

  const pricing =
    safeText(tool.pricing, "Freemium");

  const overview =
    safeText(
      tool.overview,
      safeText(
        tool.description,
        `${tool.name} is an AI software platform available through the official portal.`
      )
    );

  const whoShouldUse =
    safeText(
      tool.who_should_use,
      `${tool.name} is designed for users and teams looking for efficient ${category.toLowerCase()} solutions.`
    );

  const features =
    normalizeArray(tool.key_features);

  const limitations =
    normalizeArray(tool.limitations);

  const useCases =
    normalizeArray(tool.use_cases);

  const gettingStarted =
    normalizeArray(tool.getting_started);

  const faqs =
    Array.isArray(tool.faqs)
      ? tool.faqs
      : [];

  const integrations =
    normalizeArray(tool.integrations);

  const officialUrl =
    safeText(
      tool.official_url,
      safeText(tool.website_url, "")
    );

  const canonicalSlug =
    safeText(tool.slug, slug);

  const canonicalUrl =
    `${SITE_URL}/tool/${encodeURIComponent(
      canonicalSlug
    )}`;

  /*
   * SEO structured data
   */

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",

    name: tool.name,

    description: overview,

    url: canonicalUrl,

    applicationCategory:
      category,

    operatingSystem:
      safeText(
        tool.operating_system,
        "Web / Cloud"
      ),

    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description:
        pricing,
    },

    aggregateRating:
      typeof tool.score === "number"
        ? {
            "@type": "AggregateRating",
            ratingValue: tool.score,
            bestRating: 100,
            worstRating: 0,
          }
        : undefined,
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
        name: category,
        item:
          `${SITE_URL}/category/${encodeURIComponent(
            category.toLowerCase().replace(/\s+/g, "-")
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

  return (
    <>
      {/* SEO: SoftwareApplication schema */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />

      {/* SEO: Breadcrumb schema */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              breadcrumbSchema
            ),
        }}
      />

      <div className="min-h-screen bg-[#FDFDFD] text-slate-900">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

            <Link
              href="/"
              className="text-2xl font-black font-serif tracking-tight"
            >
              AI Vault
              <span className="text-blue-600">
                .
              </span>
            </Link>

            {officialUrl ? (
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="px-5 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-bold uppercase tracking-wide"
              >
                Visit Official Portal ↗
              </a>
            ) : null}

          </div>

        </header>

        {/* =====================================================
            MAIN
        ===================================================== */}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

          {/* =====================================================
              BREADCRUMB
          ===================================================== */}

          <nav
            aria-label="Breadcrumb"
            className="text-xs text-slate-500"
          >
            <ol className="flex flex-wrap items-center gap-2">

              <li>
                <Link
                  href="/"
                  className="hover:text-blue-600"
                >
                  Home
                </Link>
              </li>

              <li>/</li>

              <li>
                <Link
                  href="/"
                  className="hover:text-blue-600"
                >
                  AI Tools
                </Link>
              </li>

              <li>/</li>

              <li>
                <Link
                  href={`/category/${encodeURIComponent(
                    category.toLowerCase().replace(/\s+/g, "-")
                  )}`}
                  className="hover:text-blue-600"
                >
                  {category}
                </Link>
              </li>

              <li>/</li>

              <li className="font-bold text-slate-900">
                {tool.name}
              </li>

            </ol>
          </nav>

          {/* =====================================================
              TOOL HERO
          ===================================================== */}

          <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8">

            <div className="flex flex-col sm:flex-row gap-5 items-start">

              <ToolLogo
                tool={tool}
                size="lg"
              />

              <div className="flex-1">

                <div className="flex flex-wrap gap-2 mb-3">

                  <span className="px-3 py-1 rounded-full bg-slate-100 text-xs">
                    {category}
                  </span>

                  <span className="px-3 py-1 rounded-full bg-slate-100 text-xs">
                    {pricing}
                  </span>

                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                  {tool.name}
                </h1>

                <div className="mt-6">

                  <div className="text-[10px] font-bold uppercase text-slate-500">
                    AI Vault Score
                  </div>

                  <div className="text-2xl font-black">
                    {tool.score ?? 0}
                    <span className="text-sm text-slate-400">
                      /10
                    </span>
                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* =====================================================
              OVERVIEW
          ===================================================== */}

          <section className="bg-white border border-slate-100 rounded-3xl p-6">

            <h2 className="text-lg font-bold mb-4">
              Overview
            </h2>

            <p className="text-sm text-slate-600 leading-7">
              {overview}
            </p>

            <div className="flex flex-wrap gap-2 mt-5">

              <span className="px-3 py-1 rounded-full bg-slate-100 text-xs">
                AI
              </span>

              <span className="px-3 py-1 rounded-full bg-slate-100 text-xs">
                {category}
              </span>

              <span className="px-3 py-1 rounded-full bg-slate-100 text-xs">
                {tool.name}
              </span>

            </div>

          </section>

          {/* =====================================================
              WHO SHOULD USE
          ===================================================== */}

          <section className="bg-white border border-slate-100 rounded-3xl p-6">

            <h2 className="text-lg font-bold mb-4">
              Who Should Use {tool.name}?
            </h2>

            <p className="text-sm text-slate-600 leading-7">
              {whoShouldUse}
            </p>

          </section>

          {/* =====================================================
              PRICING
          ===================================================== */}

          <section className="bg-white border border-slate-100 rounded-3xl p-6">

            <h2 className="text-lg font-bold mb-4">
              Pricing
            </h2>

            <p className="text-sm text-slate-600 leading-7">
              {tool.name} operates under a{" "}
              <strong>
                {pricing}
              </strong>{" "}
              model. Check the official portal for current
              plan pricing and availability.
            </p>

          </section>

          {/* =====================================================
              FEATURES + LIMITATIONS
          ===================================================== */}

          {(features.length > 0 ||
            limitations.length > 0) && (

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <section className="bg-white border border-slate-100 rounded-3xl p-6">

                <h2 className="text-lg font-bold mb-4">
                  Key Features
                </h2>

                {features.length > 0 ? (
                  <ul className="space-y-3">
                    {features.map(
                      (feature, index) => (
                        <li
                          key={`${feature}-${index}`}
                          className="text-sm text-slate-600"
                        >
                          {feature}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    Explore the official portal for
                    current features.
                  </p>
                )}

              </section>

              <section className="bg-white border border-slate-100 rounded-3xl p-6">

                <h2 className="text-lg font-bold mb-4">
                  Limitations
                </h2>

                {limitations.length > 0 ? (
                  <ul className="space-y-3">
                    {limitations.map(
                      (item, index) => (
                        <li
                          key={`${item}-${index}`}
                          className="text-sm text-slate-600"
                        >
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    Limitations may vary by plan.
                  </p>
                )}

              </section>

            </div>
          )}

          {/* =====================================================
              USE CASES
          ===================================================== */}

          {useCases.length > 0 && (

            <section className="bg-white border border-slate-100 rounded-3xl p-6">

              <h2 className="text-lg font-bold mb-4">
                Use Cases
              </h2>

              <div className="flex flex-wrap gap-2">

                {useCases.map(
                  (item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className="px-3 py-1.5 rounded-full bg-slate-100 text-xs"
                    >
                      {item}
                    </span>
                  )
                )}

              </div>

            </section>
          )}

          {/* =====================================================
              GETTING STARTED
          ===================================================== */}

          {gettingStarted.length > 0 && (

            <section className="bg-white border border-slate-100 rounded-3xl p-6">

              <h2 className="text-lg font-bold mb-4">
                How To Get Started
              </h2>

              <ol className="space-y-3 list-decimal list-inside">

                {gettingStarted.map(
                  (item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="text-sm text-slate-600"
                    >
                      {item}
                    </li>
                  )
                )}

              </ol>

            </section>
          )}

          {/* =====================================================
              FAQ
          ===================================================== */}

          {faqs.length > 0 && (

            <section className="bg-white border border-slate-100 rounded-3xl p-6">

              <h2 className="text-lg font-bold mb-6">
                Frequently Asked Questions
              </h2>

              <div className="space-y-5">

                {faqs.map(
                  (faq: any, index) => {

                    const question =
                      safeText(
                        faq?.question,
                        `Frequently asked question ${index + 1}`
                      );

                    const answer =
                      safeText(
                        faq?.answer,
                        ""
                      );

                    return (
                      <div
                        key={index}
                        className="border-b border-slate-100 pb-5"
                      >

                        <h3 className="text-sm font-bold">
                          {question}
                        </h3>

                        {answer && (
                          <p className="text-sm text-slate-600 mt-2">
                            {answer}
                          </p>
                        )}

                      </div>
                    );
                  }
                )}

              </div>

            </section>
          )}

          {/* =====================================================
              SPECIFICATIONS
          ===================================================== */}

          <section className="bg-white border border-slate-100 rounded-3xl p-6">

            <h2 className="text-lg font-bold mb-6">
              Tool Specifications
            </h2>

            <div className="space-y-4 text-sm">

              <div className="flex justify-between gap-5 border-b border-slate-100 pb-3">
                <span className="text-slate-500">
                  Category
                </span>

                <strong>
                  {category}
                </strong>
              </div>

              <div className="flex justify-between gap-5 border-b border-slate-100 pb-3">
                <span className="text-slate-500">
                  Pricing Model
                </span>

                <strong>
                  {pricing}
                </strong>
              </div>

              <div className="flex justify-between gap-5 border-b border-slate-100 pb-3">
                <span className="text-slate-500">
                  Operating System
                </span>

                <strong>
                  {safeText(
                    tool.operating_system,
                    "Web / Cloud"
                  )}
                </strong>
              </div>

              <div className="flex justify-between gap-5 border-b border-slate-100 pb-3">
                <span className="text-slate-500">
                  Deployment
                </span>

                <strong>
                  {safeText(
                    tool.deployment,
                    "Hosted SaaS"
                  )}
                </strong>
              </div>

              <div className="flex justify-between gap-5 border-b border-slate-100 pb-3">
                <span className="text-slate-500">
                  License
                </span>

                <strong>
                  {safeText(
                    tool.license,
                    "Proprietary"
                  )}
                </strong>
              </div>

              {integrations.length > 0 && (

                <div>

                  <div className="text-slate-500 mb-3">
                    Integrations
                  </div>

                  <div className="flex flex-wrap gap-2">

                    {integrations.map(
                      (item, index) => (
                        <span
                          key={`${item}-${index}`}
                          className="px-3 py-1 rounded-lg bg-slate-100 text-xs"
                        >
                          {item}
                        </span>
                      )
                    )}

                  </div>

                </div>
              )}

            </div>

            {officialUrl && (

              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="block text-center mt-8 px-5 py-3 bg-slate-950 text-white rounded-xl text-xs font-bold uppercase tracking-wide"
              >
                Visit Official Portal ↗
              </a>

            )}

          </section>

        </main>

      </div>
    </>
  );
}
