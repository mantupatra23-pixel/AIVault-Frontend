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
   HELPERS
========================================================= */

/**
 * Convert a category name into the existing category URL format.
 *
 * IMPORTANT:
 * This is only used for category navigation.
 * It does NOT modify the tool's canonical slug.
 */
function categoryToSlug(
  category: string
): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Safely resolve the official website.
 *
 * getWebsiteUrl() may return string | null.
 * This helper intentionally preserves null.
 */
function getSafeWebsiteUrl(
  tool: ToolRecord
): string | null {
  const website = getWebsiteUrl(tool);

  if (
    typeof website !== "string"
  ) {
    return null;
  }

  const trimmed =
    website.trim();

  return trimmed || null;
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

  const tool =
    await getToolBySlug(
      requestedSlug
    );

  if (!tool) {
    return {
      title:
        "Tool Not Found | AI Vault",
      description:
        "The requested tool could not be found in the AI Vault directory.",
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
      card: "summary",
      title,
      description,
    },
  };
}

/* =========================================================
   SOFTWARE JSON-LD
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
    getSafeWebsiteUrl(tool);

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
      category,

    url: canonical,
  };

  /*
   * Only include official website
   * when it actually exists.
   */
  if (website) {
    jsonLd.sameAs = [
      website,
    ];
  }

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
    categoryToSlug(
      category
    );

  const jsonLd = {
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

        name: category,

        item:
          `${SITE_URL}/category/${encodeURIComponent(
            categorySlug
          )}`,
      },

      {
        "@type":
          "ListItem",

        position: 3,

        name,

        item: toolUrl(tool),
      },
    ],
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
  const { slug } = await params;

  /*
   * Decode only the incoming URL parameter.
   *
   * NEVER create a slug from the tool name.
   */
  const requestedSlug =
    safeDecode(slug);

  if (
    !requestedSlug.trim()
  ) {
    notFound();
  }

  /*
   * EXACT DATABASE LOOKUP.
   *
   * getToolBySlug() is responsible for
   * resolving the canonical database slug.
   */
  const tool =
    await getToolBySlug(
      requestedSlug
    );

  /*
   * NEVER render another tool when
   * the requested slug does not exist.
   */
  if (!tool) {
    notFound();
  }

  /* =======================================================
     CANONICAL TOOL DATA
  ======================================================= */

  const name =
    getToolName(tool);

  const category =
    getToolCategory(tool);

  const pricing =
    normalizePricing(
      tool.pricing_model ??
        tool.pricing
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

  /*
   * IMPORTANT:
   *
   * getWebsiteUrl() can return null.
   * We keep it nullable instead of
   * forcing it into a string.
   */
  const website =
    getSafeWebsiteUrl(tool);

  const logo =
    clean(tool.logo_url) ||
    clean(tool.logo) ||
    clean(tool.image_url) ||
    null;

  const categorySlug =
    categoryToSlug(
      category
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white text-slate-950">

      {/* ===================================================
          STRUCTURED DATA
      =================================================== */}

      <ToolJsonLd
        tool={tool}
      />

      <BreadcrumbJsonLd
        tool={tool}
      />

      {/* ===================================================
          HEADER
      =================================================== */}

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

      {/* ===================================================
          MAIN CONTAINER
      =================================================== */}

      <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">

        {/* =================================================
            BREADCRUMB
        ================================================= */}

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

          <span>
            /
          </span>

          <Link
            href={`/category/${encodeURIComponent(
              categorySlug
            )}`}
            className="hover:text-slate-700"
          >
            {category}
          </Link>

          <span>
            /
          </span>

          <span className="font-medium text-slate-700">
            {name}
          </span>

        </nav>

        {/* =================================================
            HERO
        ================================================= */}

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
              QUICK DATA
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
                Data and catalog quality signal.
              </p>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">

              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Pricing
              </p>

              <p className="mt-2 text-sm font-bold">
                {pricing}
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

        {/* =================================================
            OFFICIAL ACCESS
        ================================================= */}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-7">

          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Official Access
          </p>

          <h2 className="mt-2 text-lg font-bold">
            Try {name}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Visit the official platform for current product information, availability and pricing.
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
            className="mt-3 flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 transition hover:border-slate-300"
          >
            ← Back to Directory
          </Link>

        </section>

        {/* =================================================
            OVERVIEW
        ================================================= */}

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

        {/* =================================================
            FEATURES
        ================================================= */}

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

                      <span className="text-sm font-medium text-slate-700">
                        {feature}
                      </span>

                    </div>

                  </div>
                )
              )}

            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              Feature information is not currently available.
            </p>
          )}

        </section>

        {/* =================================================
            USE CASES
        ================================================= */}

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
              Use-case information is not currently available.
            </p>
          )}

        </section>

        {/* =================================================
            PLATFORM DETAILS
        ================================================= */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            Platform Details
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">

            {[
              [
                "Operating System",
                clean(
                  tool.operating_system
                ) ||
                  clean(
                    tool.os
                  ),
              ],
              [
                "Deployment",
                clean(
                  tool.deployment
                ),
              ],
              [
                "License",
                clean(
                  tool.license
                ),
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
                    {value ||
                      "Information unavailable"}
                  </p>

                </div>
              )
            )}

          </div>

        </section>

        {/* =================================================
            INTEGRATIONS
        ================================================= */}

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
              Integration information is not currently available.
            </p>
          )}

        </section>

        {/* =================================================
            LIMITATIONS
        ================================================= */}

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
                    className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-slate-700"
                  >
                    {item}
                  </div>
                )
              )}

            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Limitation information is not currently available.
            </p>
          )}

        </section>

        {/* =================================================
            PRICING NOTE
        ================================================= */}

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">

          <h2 className="text-lg font-black">
            Pricing
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Current catalog pricing:
            {" "}
            <strong>
              {pricing}
            </strong>
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            Check the official website for current pricing and plan availability.
          </p>

        </section>

        {/* =================================================
            INTERNAL DISCOVERY
        ================================================= */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            Explore More
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">

            <Link
              href={`/category/${encodeURIComponent(
                categorySlug
              )}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-bold transition hover:border-blue-300 hover:text-blue-600"
            >
              More {category} Tools →
            </Link>

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

          </div>

        </section>

        {/* =================================================
            ALTERNATIVES / RELATED
        ================================================= */}

        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-7">

          <h2 className="text-xl font-black">
            Find Alternatives to {name}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Compare {name} with other tools in the AI Vault directory using category, use case and available product data.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">

            <Link
              href={`/best/${encodeURIComponent(
                categorySlug
              )}`}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
            >
              Browse {category} Tools
            </Link>

            <Link
              href="/compare"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
            >
              Compare Tools
            </Link>

            <Link
              href="/ai-finder"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
            >
              Use AI Finder
            </Link>

          </div>

        </section>

        {/* =================================================
            FINAL CTA
        ================================================= */}

        <section className="mt-10 rounded-3xl bg-slate-950 px-6 py-12 text-center text-white sm:px-10">

          <h2 className="text-2xl font-black sm:text-3xl">
            Explore {name}
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">
            Review the available catalog information and visit the official platform for the latest product details.
          </p>

          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-950 transition hover:bg-slate-100"
            >
              Visit Official Portal ↗
            </a>
          ) : (
            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-950"
            >
              Explore AI Vault
            </Link>
          )}

        </section>

      </div>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="border-t border-slate-200">

        <div className="mx-auto max-w-7xl px-4 py-8 text-xs text-slate-500 sm:px-6 lg:px-8">

          ©{" "}
          {new Date().getFullYear()}{" "}
          AI Vault. All rights reserved.

        </div>

      </footer>

    </main>
  );
}
