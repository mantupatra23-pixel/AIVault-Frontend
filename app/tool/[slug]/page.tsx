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

function nullableString(
  value: unknown
): string | null {
  const valueString =
    safeString(value);

  return valueString
    ? valueString
    : null;
}

function uniqueStrings(
  values: unknown
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const result: string[] = [];

  for (const item of values) {
    const value =
      safeString(item);

    if (!value) {
      continue;
    }

    if (
      !result.some(
        (existing) =>
          existing.toLowerCase() ===
          value.toLowerCase()
      )
    ) {
      result.push(value);
    }
  }

  return result;
}

function categoryToSlug(
  category: string
): string {
  return category
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      "");
}

function getSafeWebsite(
  tool: ToolRecord
): string | null {
  const website =
    getWebsiteUrl(tool);

  return nullableString(
    website
  );
}

function getSafeScore(
  tool: ToolRecord
): number | null {
  const value =
    getAiVaultScore(tool);

  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(value)
    )
  );
}

function getToolField(
  tool: ToolRecord,
  key: string
): unknown {
  return (
    tool as unknown as Record<
      string,
      unknown
    >
  )[key];
}

function getVerifiedStatus(
  tool: ToolRecord
): boolean {
  const record =
    tool as unknown as Record<
      string,
      unknown
    >;

  const value =
    record.verified ??
    record.is_verified ??
    record.verified_status;

  return (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1" ||
    value === "verified"
  );
}

function getPlatformValues(
  tool: ToolRecord
): string[] {
  const record =
    tool as unknown as Record<
      string,
      unknown
    >;

  const candidates = [
    record.platforms,
    record.platform,
    record.supported_platforms,
  ];

  for (
    const candidate of candidates
  ) {
    if (
      Array.isArray(candidate)
    ) {
      const values =
        uniqueStrings(candidate);

      if (values.length) {
        return values;
      }
    }

    if (
      typeof candidate ===
      "string"
    ) {
      const values =
        candidate
          .split(",")
          .map(
            (item) =>
              item.trim()
          )
          .filter(Boolean);

      if (values.length) {
        return uniqueStrings(
          values
        );
      }
    }
  }

  return [];
}

/* =========================================================
   METADATA
========================================================= */

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } =
    await params;

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
        "The requested tool could not be found in AI Vault.",

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
      siteName:
        "AI Vault",
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
  const name =
    getToolName(tool);

  const description =
    getDescription(tool);

  const category =
    getToolCategory(tool);

  const canonical =
    toolUrl(tool);

  const website =
    getSafeWebsite(tool);

  const jsonLd: Record<
    string,
    unknown
  > = {
    "@context":
      "https://schema.org",

    "@type":
      "SoftwareApplication",

    name,

    url:
      canonical,
  };

  if (description) {
    jsonLd.description =
      description;
  }

  if (category) {
    jsonLd.applicationCategory =
      category;
  }

  /*
   * Only expose sameAs when an
   * actual website exists.
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

  const canonical =
    toolUrl(tool);

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

        item:
          SITE_URL,
      },

      {
        "@type":
          "ListItem",

        position: 2,

        name:
          category,

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

        item:
          canonical,
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
   TOOL PAGE
========================================================= */

export default async function ToolPage({
  params,
}: Props) {
  const { slug: rawSlug } =
    await params;

  const requestedSlug =
    safeDecode(rawSlug);

  /*
   * Empty slug = 404.
   */
  if (
    !requestedSlug.trim()
  ) {
    notFound();
  }

  /*
   * EXACT DATABASE LOOKUP.
   *
   * Never fuzzy-match.
   * Never redirect to another tool.
   * Never substitute a similar tool.
   */
  const tool =
    await getToolBySlug(
      requestedSlug
    );

  if (!tool) {
    notFound();
  }

  /* =======================================================
     CORE DATA
  ======================================================= */

  const name =
    getToolName(tool);

  const category =
    getToolCategory(tool);

  const categorySlug =
    categoryToSlug(
      category
    );

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

  const integrations =
    uniqueStrings(
      getIntegrations(tool)
    );

  const limitations =
    uniqueStrings(
      getLimitations(tool)
    );

  const pricing =
    normalizePricing(
      tool.pricing_model ||
        tool.pricing
    );

  const score =
    getSafeScore(tool);

  const website =
    getSafeWebsite(tool);

  const verified =
    getVerifiedStatus(tool);

  const platforms =
    getPlatformValues(tool);

  /* =======================================================
     LOGO
  ======================================================= */

  const logo =
    clean(tool.logo_url) ||
    clean(tool.logo) ||
    clean(tool.image_url) ||
    null;

  /* =======================================================
     PLATFORM / DEPLOYMENT / LICENSE
  ======================================================= */

  const operatingSystem =
    nullableString(
      tool.operating_system
    ) ||
    nullableString(
      tool.os
    );

  const deployment =
    nullableString(
      tool.deployment
    );

  const license =
    nullableString(
      tool.license
    );

  /* =======================================================
     OPTIONAL VERIFIED AUDIENCE DATA
  ======================================================= */

  const audience =
    uniqueStrings(
      getToolField(
        tool,
        "audience"
      )
    );

  /* =======================================================
     OPTIONAL DATA
     These fields are only displayed when
     they already exist in the database.
  ======================================================= */

  const apiAvailable =
    getToolField(
      tool,
      "api_available"
    );

  const hasApiInformation =
    apiAvailable === true ||
    apiAvailable === false;

  /* =======================================================
     OPTIONAL ALTERNATIVES
     We do NOT fabricate alternatives.
     If the existing backend already provides
     related/alternative data, this page can display it.
  ======================================================= */

  const relatedToolsRaw =
    getToolField(
      tool,
      "related_tools"
    );

  const alternativesRaw =
    getToolField(
      tool,
      "alternatives"
    );

  const relatedTools =
    Array.isArray(
      relatedToolsRaw
    )
      ? relatedToolsRaw
      : [];

  const alternatives =
    Array.isArray(
      alternativesRaw
    )
      ? alternativesRaw
      : [];

  /* =======================================================
     DESCRIPTION
  ======================================================= */

  const factualSummary =
    description ||
    overview ||
    null;

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white text-slate-950">

      {/* =================================================
          STRUCTURED DATA
      ================================================= */}

      <ToolJsonLd
        tool={tool}
      />

      <BreadcrumbJsonLd
        tool={tool}
      />

      {/* =================================================
          HEADER
      ================================================= */}

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
              Visit Official Website ↗
            </a>
          ) : (
            <span className="rounded-xl bg-slate-100 px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-slate-400">
              Official Website Unavailable
            </span>
          )}

        </div>

      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

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

          <div className="min-w-0">

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

            {factualSummary && (
              <p className="mt-6 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">
                {factualSummary}
              </p>
            )}

          </div>

          {/* =================================================
              QUICK FACTS
          ================================================= */}

          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">

            {/* SCORE */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4">

              <div className="flex items-center justify-between gap-2">

                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  AI Vault Score
                </p>

                <span
                  title="Measures the completeness and quality of available tool data. It is not an objective product-quality rating."
                  className="cursor-help text-xs text-slate-400"
                  aria-label="AI Vault Score information"
                >
                  ⓘ
                </span>

              </div>

              {score !== null ? (
                <>
                  <p className="mt-2 text-xl font-black">
                    {score}
                    <span className="text-xs font-medium text-slate-400">
                      /100
                    </span>
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-slate-400">
                    Data quality indicator
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm font-bold text-slate-400">
                  Unavailable
                </p>
              )}

            </div>

            {/* PRICING */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4">

              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Pricing
              </p>

              <p className="mt-2 break-words text-sm font-bold">
                {pricing}
              </p>

            </div>

            {/* CATEGORY */}

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
              rel="noopener noreferrer"
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
            WHO IS IT FOR?
        ================================================= */}

        {audience.length > 0 && (
          <section className="mt-10">

            <h2 className="text-xl font-black">
              Who Is It For?
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
              Use-case information is currently unavailable.
            </p>
          )}

        </section>

        {/* =================================================
            PLATFORM
        ================================================= */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            Platform Details
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">

            <div className="rounded-2xl border border-slate-200 bg-white p-5">

              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Operating System
              </p>

              <p className="mt-2 break-words text-sm font-bold">
                {operatingSystem ||
                  "Information currently unavailable"}
              </p>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">

              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Deployment
              </p>

              <p className="mt-2 break-words text-sm font-bold">
                {deployment ||
                  "Information currently unavailable"}
              </p>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">

              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                License
              </p>

              <p className="mt-2 break-words text-sm font-bold">
                {license ||
                  "Information currently unavailable"}
              </p>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">

              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Pricing Model
              </p>

              <p className="mt-2 break-words text-sm font-bold">
                {pricing}
              </p>

            </div>

          </div>

          {platforms.length > 0 && (
            <div className="mt-5">

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Supported Platforms
              </p>

              <div className="mt-3 flex flex-wrap gap-2">

                {platforms.map(
                  (
                    platform,
                    index
                  ) => (
                    <span
                      key={`${platform}-${index}`}
                      className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600"
                    >
                      {platform}
                    </span>
                  )
                )}

              </div>

            </div>
          )}

        </section>

        {/* =================================================
            PRICING
        ================================================= */}

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">

          <h2 className="text-xl font-black">
            Pricing
          </h2>

          <div className="mt-4 rounded-xl bg-slate-50 p-4">

            <p className="text-sm font-bold text-slate-800">
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
              Integration information is currently unavailable.
            </p>
          )}

        </section>

        {/* =================================================
            API INFORMATION
        ================================================= */}

        {hasApiInformation && (
          <section className="mt-10">

            <h2 className="text-xl font-black">
              API
            </h2>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">

              <p className="text-sm text-slate-600">
                {apiAvailable === true
                  ? "API availability is recorded in the available tool data."
                  : "The available tool data indicates that an API is not listed."}
              </p>

            </div>

          </section>
        )}

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
              Limitation information is currently unavailable.
            </p>
          )}

        </section>

        {/* =================================================
            ALTERNATIVES
            Only render if existing data is available.
            No fabricated alternatives.
        ================================================= */}

        {alternatives.length > 0 && (
          <section className="mt-12">

            <div className="mb-5">

              <h2 className="text-xl font-black">
                Alternatives
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Alternatives available from the existing tool data.
              </p>

            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

              {alternatives
                .slice(0, 5)
                .map(
                  (
                    alternative,
                    index
                  ) => {

                    const item =
                      alternative as Record<
                        string,
                        unknown
                      >;

                    const altSlug =
                      safeString(
                        item.slug
                      );

                    const altName =
                      safeString(
                        item.name
                      );

                    if (
                      !altSlug ||
                      !altName ||
                      altSlug ===
                        requestedSlug
                    ) {
                      return null;
                    }

                    return (
                      <Link
                        key={`${altSlug}-${index}`}
                        href={`/tool/${encodeURIComponent(
                          altSlug
                        )}`}
                        className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:text-blue-600"
                      >

                        <p className="text-sm font-black">
                          {altName}
                        </p>

                        {safeString(
                          item.category
                        ) && (
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            {safeString(
                              item.category
                            )}
                          </p>
                        )}

                        {safeString(
                          item.description
                        ) && (
                          <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500">
                            {safeString(
                              item.description
                            )}
                          </p>
                        )}

                        <span className="mt-4 inline-block text-xs font-bold">
                          View alternative →
                        </span>

                      </Link>
                    );
                  }
                )}

            </div>

          </section>
        )}

        {/* =================================================
            RELATED TOOLS
        ================================================= */}

        {relatedTools.length > 0 && (
          <section className="mt-12">

            <div className="mb-5">

              <h2 className="text-xl font-black">
                Similar Tools
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Related tools from the available AI Vault data.
              </p>

            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

              {relatedTools
                .slice(0, 5)
                .map(
                  (
                    related,
                    index
                  ) => {

                    const item =
                      related as Record<
                        string,
                        unknown
                      >;

                    const relatedSlug =
                      safeString(
                        item.slug
                      );

                    const relatedName =
                      safeString(
                        item.name
                      );

                    if (
                      !relatedSlug ||
                      !relatedName ||
                      relatedSlug ===
                        requestedSlug
                    ) {
                      return null;
                    }

                    return (
                      <Link
                        key={`${relatedSlug}-${index}`}
                        href={`/tool/${encodeURIComponent(
                          relatedSlug
                        )}`}
                        className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
                      >

                        <p className="text-sm font-black text-slate-900">
                          {relatedName}
                        </p>

                        {safeString(
                          item.category
                        ) && (
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            {safeString(
                              item.category
                            )}
                          </p>
                        )}

                        {safeString(
                          item.description
                        ) && (
                          <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500">
                            {safeString(
                              item.description
                            )}
                          </p>
                        )}

                        <span className="mt-4 inline-block text-xs font-bold text-blue-600">
                          View Tool →
                        </span>

                      </Link>
                    );
                  }
                )}

            </div>

          </section>
        )}

        {/* =================================================
            INTERNAL DISCOVERY
        ================================================= */}

        <section className="mt-12">

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
            SAVE / REVIEW / COMPARE
        ================================================= */}

        <section className="mt-10 grid gap-3 sm:grid-cols-3">

          <Link
            href="/compare"
            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:text-blue-600"
          >
            <p className="text-sm font-black">
              Compare
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Compare available tools side by side.
            </p>
          </Link>

          <Link
            href="/saved"
            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:text-blue-600"
          >
            <p className="text-sm font-black">
              Saved Tools
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Manage your saved AI tools.
            </p>
          </Link>

          <Link
            href="/ai-finder"
            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:text-blue-600"
          >
            <p className="text-sm font-black">
              AI Finder
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Find tools based on your requirements.
            </p>
          </Link>

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
              rel="noopener noreferrer"
              className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 text-xs font-bold uppercase tracking-wide text-slate-950 transition hover:bg-slate-200"
            >
              Visit Official Website ↗
            </a>
          )}

        </section>

      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="border-t border-slate-200">

        <div className="mx-auto max-w-7xl px-4 py-8 text-xs text-slate-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} AI Vault. All rights reserved.
        </div>

      </footer>

    </main>
  );
}
