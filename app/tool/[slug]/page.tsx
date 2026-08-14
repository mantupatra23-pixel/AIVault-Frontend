import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import ToolDetailTracker from "@/components/tool-detail-tracker";

import {
  getOfficialUrl,
  getToolCategory,
  getToolDeployment,
  getToolDescription,
  getToolFeatures,
  getToolFAQs,
  getToolGettingStarted,
  getToolIntegrations,
  getToolLicense,
  getToolLimitations,
  getToolLogo,
  getToolName,
  getToolOS,
  getToolPricing,
  getToolScore,
  getToolUseCases,
  getToolBySlug,
  type ToolRecord,
} from "@/lib/ai-vault";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

/* =========================================================
   METADATA
========================================================= */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const tool =
    await getToolBySlug(slug);

  if (!tool) {
    return {
      title: "Tool Not Found | AI Vault",
      description:
        "The requested AI tool could not be found.",
    };
  }

  const name =
    getToolName(tool);

  const description =
    getToolDescription(tool);

  return {
    title:
      `${name} — AI Tool Review | AI Vault`,
    description,
    alternates: {
      canonical:
        `/tool/${encodeURIComponent(
          tool.slug || slug
        )}`,
    },
    openGraph: {
      title:
        `${name} — AI Tool Review | AI Vault`,
      description,
      type: "website",
    },
  };
}

/* =========================================================
   SAFE EXTERNAL URL
========================================================= */

function isExternalUrl(
  value: string | null
): value is string {
  return (
    !!value &&
    /^https?:\/\//i.test(value)
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function ToolPage({
  params,
}: PageProps) {
  /*
   * IMPORTANT:
   *
   * params.slug is the ONLY routing identifier.
   *
   * We do not search by:
   * - name
   * - title
   * - description
   * - display_name
   */

  const { slug } =
    await params;

  const decodedSlug =
    decodeURIComponent(slug).trim();

  if (!decodedSlug) {
    notFound();
  }

  /*
   * EXACT canonical database lookup.
   */

  let tool: ToolRecord | null =
    null;

  try {
    tool =
      await getToolBySlug(
        decodedSlug
      );
  } catch (error) {
    console.error(
      "[AI VAULT] Tool lookup error:",
      error
    );

    throw error;
  }

  /*
   * Genuine missing route.
   *
   * Never return another tool.
   */

  if (!tool) {
    notFound();
  }

  /* =======================================================
     CANONICAL DATA
  ======================================================= */

  const name =
    getToolName(tool);

  const category =
    getToolCategory(tool);

  const description =
    getToolDescription(tool);

  const pricing =
    getToolPricing(tool);

  const score =
    getToolScore(tool);

  const logo =
    getToolLogo(tool);

  const officialUrl =
    getOfficialUrl(tool);

  const features =
    getToolFeatures(tool);

  const limitations =
    getToolLimitations(tool);

  const useCases =
    getToolUseCases(tool);

  const gettingStarted =
    getToolGettingStarted(tool);

  const integrations =
    getToolIntegrations(tool);

  const faqs =
    getToolFAQs(tool);

  const operatingSystem =
    getToolOS(tool);

  const deployment =
    getToolDeployment(tool);

  const license =
    getToolLicense(tool);

  /*
   * Canonical slug from DB.
   *
   * Do not generate it from name.
   */

  const canonicalSlug =
    tool.slug || decodedSlug;

  const canonicalPath =
    `/tool/${encodeURIComponent(
      canonicalSlug
    )}`;

  /* =======================================================
     JSON-LD
  ======================================================= */

  const jsonLd = {
    "@context":
      "https://schema.org",
    "@type": "SoftwareApplication",

    name,

    description,

    applicationCategory:
      category,

    url:
      canonicalPath,

    ...(officialUrl
      ? {
          sameAs: [
            officialUrl,
          ],
        }
      : {}),

    offers: {
      "@type": "Offer",
      price:
        pricing === "Free"
          ? "0"
          : undefined,
      priceCurrency: "USD",
    },

    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue:
        String(score),
      bestRating: "100",
      worstRating: "0",
      ratingCount: "1",
    },
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white text-slate-950">

      {/* =================================================
          TRACKER
      ================================================= */}

      <ToolDetailTracker
        slug={canonicalSlug}
        name={name}
        category={category}
      />

      {/* =================================================
          JSON-LD
      ================================================= */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              jsonLd
            ),
        }}
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
          </Link>

          {isExternalUrl(
            officialUrl
          ) ? (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-xl bg-slate-950 px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-white transition hover:bg-blue-600 sm:px-5 sm:py-2.5 sm:text-[10px]"
            >
              Visit Official Portal ↗
            </a>
          ) : (
            <span className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:px-5 sm:py-2.5 sm:text-[10px]">
              Official Portal Unavailable
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

        <nav className="mb-7 flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">

          <Link
            href="/"
            className="transition hover:text-slate-700"
          >
            Home
          </Link>

          <span>/</span>

          <Link
            href="/categories"
            className="transition hover:text-slate-700"
          >
            AI Tools
          </Link>

          <span>/</span>

          <Link
            href={`/category/${encodeURIComponent(
              category
                .toLowerCase()
                .replace(
                  /\s+/g,
                  "-"
                )
            )}`}
            className="font-medium text-slate-700"
          >
            {category}
          </Link>

          <span>/</span>

          <span className="max-w-[220px] truncate text-slate-500">
            {name}
          </span>

        </nav>

        {/* =================================================
            HERO
        ================================================= */}

        <section className="grid gap-7 lg:grid-cols-[1fr_320px]">

          <div>

            <div className="flex items-start gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-black text-white">

                {logo ? (
                  <img
                    src={logo}
                    alt={`${name} logo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  name
                    .slice(0, 2)
                    .toUpperCase()
                )}

              </div>

              <div className="min-w-0">

                <div className="mb-2 flex flex-wrap gap-2">

                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-blue-700">
                    Verified AI Tool
                  </span>

                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    {category}
                  </span>

                </div>

                <h1 className="break-words text-2xl font-black tracking-tight sm:text-4xl">
                  {name}
                </h1>

              </div>

            </div>

            <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-500">
              {description}
            </p>

          </div>

        </section>

        {/* =================================================
            STATS
        ================================================= */}

        <section className="mt-7 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              AI Vault Score
            </p>

            <p className="mt-1 text-base font-black">
              {score}
              <span className="text-xs font-medium text-slate-400">
                /100
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              Pricing
            </p>

            <p className="mt-1 text-sm font-bold">
              {pricing}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              Category
            </p>

            <p className="mt-1 truncate text-sm font-bold">
              {category}
            </p>
          </div>

        </section>

        {/* =================================================
            OFFICIAL ACCESS
        ================================================= */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">

          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            Official Access
          </p>

          <h2 className="mt-2 text-base font-bold">
            Try {name}
          </h2>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Visit the official platform for the latest features, plans and availability.
          </p>

          {isExternalUrl(
            officialUrl
          ) && (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-xs font-black uppercase tracking-wide text-white transition hover:bg-blue-700"
            >
              Visit Official Portal ↗
            </a>
          )}

          <Link
            href="/"
            className="mt-2 flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            ← Back to Directory
          </Link>

        </section>

        {/* =================================================
            ABOUT
        ================================================= */}

        <section className="mt-10">

          <h2 className="text-xl font-black sm:text-2xl">
            About {name}
          </h2>

          <p className="mt-4 max-w-5xl text-sm leading-7 text-slate-500">
            {description}
          </p>

        </section>

        {/* =================================================
            FEATURES
        ================================================= */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            Key Features
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">

            {features.map(
              (feature, index) => (
                <div
                  key={`${feature}-${index}`}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                >

                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-600">
                    ✓
                  </span>

                  <span className="text-xs font-medium leading-5 text-slate-700">
                    {feature}
                  </span>

                </div>
              )
            )}

          </div>

        </section>

        {/* =================================================
            USE CASES
        ================================================= */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            Use Cases
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">

            {useCases.map(
              (useCase, index) => (
                <span
                  key={`${useCase}-${index}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"
                >
                  {useCase}
                </span>
              )
            )}

          </div>

        </section>

        {/* =================================================
            PLATFORM
        ================================================= */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            Platform Details
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">

            <InfoBox
              label="Operating System"
              value={operatingSystem}
            />

            <InfoBox
              label="Deployment"
              value={deployment}
            />

            <InfoBox
              label="License"
              value={license}
            />

            <InfoBox
              label="Pricing"
              value={pricing}
            />

          </div>

        </section>

        {/* =================================================
            INTEGRATIONS
        ================================================= */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            Integrations
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">

            {integrations.map(
              (integration, index) => (
                <span
                  key={`${integration}-${index}`}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600"
                >
                  {integration}
                </span>
              )
            )}

          </div>

        </section>

        {/* =================================================
            GETTING STARTED
        ================================================= */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            How to Get Started
          </h2>

          <div className="mt-4 space-y-2">

            {gettingStarted.map(
              (step, index) => (
                <div
                  key={`${step}-${index}`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                >

                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                    {index + 1}
                  </span>

                  <span className="text-xs font-medium text-slate-700">
                    {step}
                  </span>

                </div>
              )
            )}

          </div>

        </section>

        {/* =================================================
            LIMITATIONS
        ================================================= */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            Limitations
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">

            {limitations.map(
              (item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="rounded-2xl border border-amber-100 bg-amber-50 p-4"
                >
                  <p className="text-xs leading-5 text-slate-600">
                    <span className="mr-2 font-black text-amber-600">
                      !
                    </span>
                    {item}
                  </p>
                </div>
              )
            )}

          </div>

        </section>

        {/* =================================================
            FAQ
        ================================================= */}

        <section className="mt-10">

          <h2 className="text-xl font-black">
            Frequently Asked Questions
          </h2>

          <div className="mt-4 space-y-2">

            {faqs.map(
              (faq, index) => (
                <details
                  key={`${faq.question}-${index}`}
                  className="group rounded-2xl border border-slate-200 bg-white"
                >

                  <summary className="cursor-pointer list-none px-4 py-4 text-xs font-bold text-slate-800">
                    {faq.question}
                  </summary>

                  <div className="border-t border-slate-100 px-4 py-4 text-xs leading-6 text-slate-500">
                    {faq.answer}
                  </div>

                </details>
              )
            )}

          </div>

        </section>

        {/* =================================================
            CTA
        ================================================= */}

        <section className="mt-12 rounded-3xl bg-slate-950 px-5 py-10 text-center text-white sm:px-10">

          <h2 className="text-2xl font-black">
            Ready to explore {name}?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-slate-300">
            Visit the official platform to see its latest features, pricing, plans and availability.
          </p>

          {isExternalUrl(
            officialUrl
          ) && (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-950 transition hover:bg-blue-50"
            >
              Visit Official Portal ↗
            </a>
          )}

        </section>

      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="mt-14 border-t border-slate-200">

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

            <div>

              <h2 className="text-base font-black">
                AI Vault.
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Discover, compare and explore AI software.
              </p>

            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-500">

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

            </div>

          </div>

          <p className="mt-6 text-[10px] text-slate-400">
            © {new Date().getFullYear()} AI Vault. All rights reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}

/* =========================================================
   INFO BOX
========================================================= */

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">

      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-bold text-slate-800">
        {value}
      </p>

    </div>
  );
}
