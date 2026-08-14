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

function categoryToSlug(category: string): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const valueClean = value.trim();

  return valueClean.length > 0
    ? valueClean
    : null;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

/*
 * Important:
 * Website URL can legitimately be null.
 * Never force it into a string.
 */
function getSafeWebsiteUrl(
  tool: ToolRecord
): string | null {
  const value = getWebsiteUrl(tool);

  return safeText(value);
}

/* =========================================================
   METADATA
========================================================= */

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;

  const requestedSlug = safeDecode(slug);

  const tool = await getToolBySlug(
    requestedSlug
  );

  if (!tool) {
    return {
      title: "Tool Not Found | AI Vault",
      description:
        "The requested AI tool could not be found.",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const title = getSeoTitle(tool);
  const description = getSeoDescription(tool);
  const canonical = toolUrl(tool);

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
   SOFTWARE APPLICATION JSON-LD
========================================================= */

function ToolJsonLd({
  tool,
}: {
  tool: ToolRecord;
}) {
  const name = getToolName(tool);
  const description = getDescription(tool);
  const category = getToolCategory(tool);
  const canonical = toolUrl(tool);
  const website = getSafeWebsiteUrl(tool);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    url: canonical,
  };

  /*
   * Only add factual fields.
   */
  if (description) {
    jsonLd.description = description;
  }

  if (category) {
    jsonLd.applicationCategory = category;
  }

  if (website) {
    jsonLd.sameAs = [website];
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
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
  const name = getToolName(tool);
  const category = getToolCategory(tool);

  const categorySlug =
    categoryToSlug(category);

  const canonical = toolUrl(tool);

  const jsonLd = {
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
        name: category,
        item:
          `${SITE_URL}/category/` +
          encodeURIComponent(categorySlug),
      },
      {
        "@type": "ListItem",
        position: 3,
        name,
        item: canonical,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
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
  const { slug: rawSlug } = await params;

  const requestedSlug =
    safeDecode(rawSlug);

  if (!requestedSlug.trim()) {
    notFound();
  }

  /*
   * EXACT SLUG LOOKUP.
   *
   * Never redirect one tool to another tool.
   * Never fuzzy-match.
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
    categoryToSlug(category);

  const description =
    getDescription(tool);

  const overview =
    getOverview(tool);

  const features =
    uniqueStrings(
      getFeatures(tool)
    );

  const useCases =
    uniqueStrings(
      getUseCases(tool)
    );

  const limitations =
    uniqueStrings(
      getLimitations(tool)
    );

  const integrations =
    uniqueStrings(
      getIntegrations(tool)
    );

  const pricing =
    normalizePricing(
      tool.pricing_model ||
      tool.pricing
    );

  const score =
    getAiVaultScore(tool);

  /*
   * This is intentionally nullable.
   */
  const website =
    getSafeWebsiteUrl(tool);

  const logo =
    clean(tool.logo_url) ||
    clean(tool.logo) ||
    clean(tool.image_url) ||
    null;

  /* =======================================================
     VERIFIED STATUS
  ======================================================= */

  /*
   * Do not blindly display "Verified" for every tool.
   *
   * Only use an explicit verified field when available.
   */
  const rawVerified =
    (tool as Record<string, unknown>)
      .verified;

  const verified =
    rawVerified === true ||
    rawVerified === "true";

  /* =======================================================
     PLATFORM DATA
  ======================================================= */

  const operatingSystem =
    safeText(
      tool.operating_system
    ) ||
    safeText(tool.os);

  const deployment =
    safeText(tool.deployment);

  const license =
    safeText(tool.license);

  /* =======================================================
     DESCRIPTION FALLBACK
  ======================================================= */

  /*
   * Do not generate fake descriptions.
   */
  const factualDescription =
    description ||
    overview ||
    null;

  /* =======================================================
     PAGE
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
              rel="noopener noreferrer nofollow"
              className="shrink-0 rounded-xl bg-slate-950 px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-white transition hover:bg-blue-600 sm:px-5 sm:py-2.5 sm:text-[10px]"
            >
              Visit Official Website ↗
            </a>
          ) : (
            <span className="rounded-xl bg-slate-100 px-3 py-2 text-[9px] font-bold uppercase text-slate-400">
              Official Website Unavailable
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

          <span>/</span>

          <Link
            href={`/category/${encodeURIComponent(
              categorySlug
            )}`}
            className="hover:text-slate-700"
          >
            {category}
          </Link>

          <span>/</span>

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

                  {verified && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                      Verified
                    </span>
                  )}

                  {category && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                      {category}
                    </span>
                  )}

                </div>

                <h1 className="break-words text-3xl font-black tracking-tight sm:text-4xl">
                  {name}
                </h1>

              </div>

            </div>

            {factualDescription && (
              <p className="mt-6 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">
                {factualDescription}
              </p>
            )}

          </div>

          {/* SCORE / PRICING / CATEGORY */}

          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">

            <div className="rounded-2xl border border-slate-200 bg-white p-4">

              <div className="flex items-center justify-between gap-2">

                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  AI Vault Score
                </p>

                <span
                  title="The AI Vault Score measures the completeness and quality of available tool data. It is not an objective product-quality rating."
                  className="cursor-help text-xs text-slate-400"
                >
                  ⓘ
                </span>

              </div>

              <p className="mt-2 text-xl font-black">
                {score}
                <span className="text-xs font-medium text-slate-400">
                  /100
                </span>
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-400">
                Data quality indicator
              </p>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">

              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Pricing
              </p>

              <p className="mt-2 break-words text-sm font-bold">
                {pricing}
              </p>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">

              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Category
              </p>

              <p className="mt-2 break-words text-sm font-bold">
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
            {website
              ? `Visit ${name}`
              : `${name} website information`}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Check the official website for current product information, availability and pricing.
          </p>

          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-5 flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-blue-700"
            >
              Visit Official Website ↗
            </a>
          ) : (
            <div className="mt-5 rounded-xl bg-white px-5 py-3 text-center text-xs font-semibold text-slate-400">
              Official website information is currently unavailable.
            </div>
          )}

          <Link
            href="/"
            className="mt-3 flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700"
          >
            ← Back to Directory
          </Link>

        </section>

        {/* =================================================
            ABOUT
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
            KEY FEATURES
        ================================================= */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            Key Features
          </h2>

          {features.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">

              {features.map(
                (feature, index) => (
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
              Feature information is currently unavailable.
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

          {useCases.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">

              {useCases.map(
                (item, index) => (
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
              Use-case information is currently unavailable.
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
                operatingSystem,
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

                  <p className="mt-2 break-words text-sm font-bold text-slate-800">
                    {value || "Information currently unavailable"}
                  </p>

                </div>
              )
            )}

          </div>

        </section>

        {/* =================================================
            PRICING NOTE
        ================================================= */}

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5">

          <h2 className="text-xl font-black">
            Pricing
          </h2>

          <div className="mt-4 rounded-xl bg-slate-50 p-4">

            <p className="text-sm font-semibold text-slate-700">
              {pricing}
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Check the official website for current pricing.
            </p>

          </div>

        </section>

        {/* =================================================
            INTEGRATIONS
        ================================================= */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            Integrations
          </h2>

          {integrations.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">

              {integrations.map(
                (item, index) => (
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
              Integration information is currently unavailable.
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

          {limitations.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">

              {limitations.map(
                (item, index) => (
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
              Limitation information is currently unavailable.
            </p>
          )}

        </section>

        {/* =================================================
            INTERNAL DISCOVERY
        ================================================= */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            Continue Exploring
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

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
              Find the Right AI Tool →
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
              Explore AI Vault →
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

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Review the available information and check the official website for the latest product details.
          </p>

          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-950 transition hover:bg-slate-200"
            >
              Visit Official Website ↗
            </a>
          )}

        </section>

      </div>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="border-t border-slate-200">

        <div className="mx-auto max-w-7xl px-4 py-8 text-xs text-slate-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} AI Vault. All rights reserved.
        </div>

      </footer>

    </main>
  );
}
