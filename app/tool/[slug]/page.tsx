import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ToolLogo from "@/components/ToolLogo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ToolRecord = {
  id?: string | number | null;
  name?: string | null;
  slug?: string | null;

  category?: string | null;

  description?: string | null;
  short_description?: string | null;
  overview?: string | null;

  pricing?: string | null;
  pricing_model?: string | null;

  score?: number | string | null;
  ai_vault_score?: number | string | null;

  logo_url?: string | null;
  logo?: string | null;
  image_url?: string | null;

  website_url?: string | null;
  official_url?: string | null;
  url?: string | null;

  features?: unknown;
  key_features?: unknown;

  limitations?: unknown;
  cons?: unknown;

  use_cases?: unknown;

  how_to_start?: unknown;
  getting_started?: unknown;
  how_to_get_started?: unknown;

  faqs?: unknown;
  faq?: unknown;

  operating_system?: string | null;
  os?: string | null;

  deployment?: string | null;
  license?: string | null;

  integrations?: unknown;

  [key: string]: unknown;
};

/* =========================================================
   SUPABASE
========================================================= */

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(url, key);
}

/* =========================================================
   BASIC HELPERS
========================================================= */

function clean(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return "";
}

function decodeSlug(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function makeSlug(value: string): string {
  return clean(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

/* =========================================================
   TOOL DATA HELPERS
========================================================= */

function getName(tool: ToolRecord): string {
  return clean(tool.name) || "AI Tool";
}

function getSlug(tool: ToolRecord): string {
  return (
    clean(tool.slug) ||
    makeSlug(getName(tool))
  );
}

function getDescription(tool: ToolRecord): string {
  return (
    clean(tool.description) ||
    clean(tool.short_description) ||
    clean(tool.overview) ||
    "Explore this AI software platform, its features, pricing, use cases, and alternatives."
  );
}

function getPricing(tool: ToolRecord): string {
  const value =
    clean(tool.pricing_model) ||
    clean(tool.pricing);

  if (!value) {
    return "Unknown";
  }

  const lower = value.toLowerCase();

  if (lower.includes("freemium")) {
    return "Freemium";
  }

  if (
    lower === "free" ||
    lower.includes("free to use") ||
    lower.includes("free plan")
  ) {
    return "Free";
  }

  if (
    lower.includes("paid") ||
    lower.includes("subscription") ||
    lower.includes("pro plan")
  ) {
    return "Paid";
  }

  return value;
}

function getScore(tool: ToolRecord): number {
  const raw =
    tool.ai_vault_score !== null &&
    tool.ai_vault_score !== undefined
      ? tool.ai_vault_score
      : tool.score;

  const number = Number(raw);

  if (!Number.isFinite(number)) {
    return 90;
  }

  return Math.max(
    0,
    Math.min(100, number)
  );
}

function getLogoUrl(
  tool: ToolRecord
): string | null {
  return (
    clean(tool.logo_url) ||
    clean(tool.logo) ||
    clean(tool.image_url) ||
    null
  );
}

function getWebsiteUrl(
  tool: ToolRecord
): string | null {
  return (
    clean(tool.website_url) ||
    clean(tool.official_url) ||
    clean(tool.url) ||
    null
  );
}

/* =========================================================
   ARRAY / JSON HELPERS
========================================================= */

function parseArray(
  value: unknown
): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        if (
          item &&
          typeof item === "object"
        ) {
          const obj =
            item as Record<string, unknown>;

          return (
            clean(obj.title) ||
            clean(obj.name) ||
            clean(obj.question) ||
            clean(obj.answer) ||
            clean(obj.text)
          );
        }

        return "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const text = value.trim();

    if (!text) {
      return [];
    }

    try {
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed)) {
        return parseArray(parsed);
      }
    } catch {
      // Not JSON. Continue below.
    }

    return text
      .split(/\r?\n/)
      .map((item) =>
        item
          .replace(/^[-•*]\s*/, "")
          .replace(/^\d+[.)]\s*/, "")
          .trim()
      )
      .filter(Boolean);
  }

  return [];
}

function getFeatures(
  tool: ToolRecord
): string[] {
  const result =
    parseArray(tool.key_features);

  if (result.length) {
    return result;
  }

  const fallback =
    parseArray(tool.features);

  if (fallback.length) {
    return fallback;
  }

  return [
    "User-friendly interface",
    "Powerful workflow capabilities",
    "Practical features for everyday use",
  ];
}

function getLimitations(
  tool: ToolRecord
): string[] {
  const result =
    parseArray(tool.limitations);

  if (result.length) {
    return result;
  }

  const fallback =
    parseArray(tool.cons);

  if (fallback.length) {
    return fallback;
  }

  return [
    "Some advanced capabilities may require a paid plan",
    "Feature availability may vary by plan and platform",
    "Internet connectivity may be required for cloud-based functionality",
  ];
}

function getUseCases(
  tool: ToolRecord
): string[] {
  const result =
    parseArray(tool.use_cases);

  if (result.length) {
    return result;
  }

  return [
    "Productivity Enhancement",
    "Workflow Optimization",
    "Task Automation",
  ];
}

function getGettingStarted(
  tool: ToolRecord
): string[] {
  const result =
    parseArray(tool.how_to_get_started);

  if (result.length) {
    return result;
  }

  const second =
    parseArray(tool.how_to_start);

  if (second.length) {
    return second;
  }

  const third =
    parseArray(tool.getting_started);

  if (third.length) {
    return third;
  }

  const name = getName(tool);

  return [
    `Visit the official ${name} portal`,
    "Create or authenticate your user account if required",
    "Configure the available workspace, preferences, or integrations",
    "Start using the platform and evaluate it against your workflow requirements",
  ];
}

/* =========================================================
   FAQ
========================================================= */

type FAQItem = {
  question: string;
  answer: string;
};

function getFAQs(
  tool: ToolRecord
): FAQItem[] {
  const raw =
    tool.faqs ?? tool.faq;

  if (Array.isArray(raw)) {
    const parsed = raw
      .map((item) => {
        if (
          !item ||
          typeof item !== "object"
        ) {
          return null;
        }

        const obj =
          item as Record<string, unknown>;

        const question =
          clean(obj.question) ||
          clean(obj.q);

        const answer =
          clean(obj.answer) ||
          clean(obj.a);

        if (!question || !answer) {
          return null;
        }

        return {
          question,
          answer,
        };
      })
      .filter(
        Boolean
      ) as FAQItem[];

    if (parsed.length) {
      return parsed;
    }
  }

  const name = getName(tool);
  const pricing = getPricing(tool);

  return [
    {
      question: `What is ${name} used for?`,
      answer: `${name} is a software solution designed to help users improve productivity, simplify workflows, and complete relevant tasks more efficiently.`,
    },
    {
      question: `Is ${name} free to use?`,
      answer: `${name} is currently listed as ${pricing} in the AI Vault directory. Check the official portal for current limits and terms.`,
    },
    {
      question: `Who should use ${name}?`,
      answer: `${name} is designed for individuals, creators, professionals, and teams looking for a practical solution that can improve efficiency and simplify everyday workflows.`,
    },
    {
      question: `Does ${name} require software installation?`,
      answer: `${name} availability depends on its current platform. Users should check the official portal for supported web, desktop, mobile, API, or other deployment options.`,
    },
    {
      question: `Where can I access ${name}?`,
      answer: `You can access ${name} through its official website or portal using the Visit Official Portal button on this page.`,
    },
  ];
}

/* =========================================================
   OVERVIEW
========================================================= */

function getOverview(
  tool: ToolRecord
): string {
  return (
    clean(tool.overview) ||
    clean(tool.description) ||
    clean(tool.short_description) ||
    `Explore ${getName(
      tool
    )}, including its features, pricing, use cases, limitations, and official access information.`
  );
}

/* =========================================================
   SPECIFICATION HELPERS
========================================================= */

function getOperatingSystem(
  tool: ToolRecord
): string {
  return (
    clean(tool.operating_system) ||
    clean(tool.os) ||
    "Web / Cloud"
  );
}

function getDeployment(
  tool: ToolRecord
): string {
  return (
    clean(tool.deployment) ||
    "Hosted SaaS"
  );
}

function getLicense(
  tool: ToolRecord
): string {
  return (
    clean(tool.license) ||
    "Proprietary"
  );
}

function getIntegrations(
  tool: ToolRecord
): string[] {
  const result =
    parseArray(tool.integrations);

  if (result.length) {
    return result;
  }

  return [
    "Web APIs",
    "Cloud Services",
  ];
}

/* =========================================================
   PAGE
========================================================= */

export default async function ToolPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const requestedSlug =
    decodeSlug(slug);

  let tool: ToolRecord | null = null;
  let databaseError: string | null = null;

  /* =======================================================
     DATABASE LOAD
  ======================================================= */

  try {
    const supabase = getSupabase();

    /*
     * First try exact slug.
     */
    const exactResult =
      await supabase
        .from("ai_tools")
        .select("*")
        .eq("slug", requestedSlug)
        .maybeSingle();

    if (
      !exactResult.error &&
      exactResult.data
    ) {
      tool =
        exactResult.data as ToolRecord;
    } else {
      /*
       * Fallback: load all tools and compare normalized
       * slugs. This keeps old database rows working.
       */
      const allResult =
        await supabase
          .from("ai_tools")
          .select("*")
          .order("name", {
            ascending: true,
          });

      if (allResult.error) {
        databaseError =
          allResult.error.message;
      } else {
        const rows =
          (allResult.data ||
            []) as ToolRecord[];

        const normalizedRequested =
          makeSlug(requestedSlug);

        tool =
          rows.find((row) => {
            const rowSlug =
              makeSlug(
                clean(row.slug) ||
                  getName(row)
              );

            return (
              rowSlug ===
              normalizedRequested
            );
          }) || null;
      }
    }
  } catch (error) {
    databaseError =
      error instanceof Error
        ? error.message
        : "Unable to connect to the AI Vault database.";
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (databaseError) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">

        <header className="border-b border-slate-100 bg-white">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

            <Link
              href="/"
              className="shrink-0 text-base font-bold text-slate-950 sm:text-xl"
            >
              AI Vault.
            </Link>

            <Link
              href="/"
              className="shrink-0 rounded-full bg-slate-950 px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-white sm:px-4 sm:text-[10px]"
            >
              Visit Official Portal ↗
            </Link>

          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">

          <section className="rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm sm:p-10">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl font-bold text-red-600">
              !
            </div>

            <h1 className="mt-5 text-xl font-bold">
              Unable to load this tool
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              The AI Vault database returned an error while loading this tool.
            </p>

            {process.env.NODE_ENV !==
              "production" && (
              <pre className="mt-5 overflow-x-auto rounded-xl bg-red-50 p-4 text-left text-xs text-red-700">
                {databaseError}
              </pre>
            )}

            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
            >
              Back to AI Vault
            </Link>

          </section>

        </div>

      </main>
    );
  }

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (!tool) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">

        <header className="border-b border-slate-100 bg-white">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

            <Link
              href="/"
              className="shrink-0 text-base font-bold sm:text-xl"
            >
              AI Vault.
            </Link>

            <Link
              href="/"
              className="shrink-0 rounded-full bg-slate-950 px-3 py-2 text-[9px] font-bold uppercase text-white sm:px-4 sm:text-[10px]"
            >
              Visit Official Portal ↗
            </Link>

          </div>
        </header>

        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
            ?
          </div>

          <h1 className="mt-6 text-2xl font-black sm:text-3xl">
            Tool Not Found
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            We couldn't find the requested AI tool in the AI Vault directory.
          </p>

          <Link
            href="/categories"
            className="mt-7 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Browse AI Tools
          </Link>

        </div>

      </main>
    );
  }

  /* =======================================================
     DATA
  ======================================================= */

  const name =
    getName(tool);

  const category =
    clean(tool.category) ||
    "AI Tools";

  const pricing =
    getPricing(tool);

  const score =
    getScore(tool);

  const logoUrl =
    getLogoUrl(tool);

  const websiteUrl =
    getWebsiteUrl(tool);

  const overview =
    getOverview(tool);

  const features =
    getFeatures(tool);

  const limitations =
    getLimitations(tool);

  const useCases =
    getUseCases(tool);

  const gettingStarted =
    getGettingStarted(tool);

  const faqs =
    getFAQs(tool);

  const integrations =
    getIntegrations(tool);

  const toolSlug =
    getSlug(tool);

  const categorySlug =
    makeSlug(category);

  /* =======================================================
     EXTERNAL WEBSITE
  ======================================================= */

  function isExternalUrl(
    value: string
  ): boolean {
    return /^https?:\/\//i.test(value);
  }

  const officialLink =
    websiteUrl &&
    isExternalUrl(websiteUrl)
      ? websiteUrl
      : null;

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white text-slate-950">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">

        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

          <Link
            href="/"
            className="shrink-0 text-base font-bold tracking-tight text-slate-950 sm:text-xl"
          >
            AI Vault
          </Link>

          {officialLink ? (
            <a
              href={officialLink}
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

      {/* ===================================================
          MAIN CONTAINER
      =================================================== */}

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
              categorySlug
            )}`}
            className="font-medium text-slate-700"
          >
            {category}
          </Link>

          <span>/</span>

          <span className="min-w-0 break-words font-medium text-slate-700">
            {name}
          </span>

        </nav>

        {/* =================================================
            HERO CARD
        ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-8 lg:p-10">

          {/* Hero content */}

          <div className="flex min-w-0 flex-col gap-7 md:flex-row md:items-center md:justify-between">

            {/* LEFT */}

            <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-center">

              {/* LOGO */}

              <div className="shrink-0">

                <ToolLogo
                  src={logoUrl}
                  fallbackSrc={logoUrl}
                  websiteUrl={websiteUrl}
                  name={name}
                  size="lg"
                />

              </div>

              {/* TITLE */}

              <div className="min-w-0 flex-1">

                <div className="mb-3 flex flex-wrap gap-2">

                  <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-600">
                    {category}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
                      pricing === "Free"
                        ? "bg-emerald-50 text-emerald-700"
                        : pricing === "Paid"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    {pricing}
                  </span>

                </div>

                <h1 className="max-w-full break-words text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  {name}
                </h1>

                {/* SCORE */}

                <div className="mt-5">

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    AI Vault Score
                  </p>

                  <div className="mt-1 flex items-baseline gap-1">

                    <span className="text-3xl font-black text-slate-950 sm:text-4xl">
                      {score}
                    </span>

                    <span className="text-sm font-bold text-slate-400">
                      /10
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* HERO BUTTON */}

          {officialLink && (
            <div className="mt-7 w-full">

              <a
                href={officialLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-center text-xs font-extrabold uppercase tracking-wide text-white transition hover:bg-blue-600 sm:min-h-14 sm:text-sm"
              >
                Visit Official Portal ↗
              </a>

            </div>
          )}

        </section>

        {/* =================================================
            OVERVIEW
        ================================================= */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-9">

          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Overview
          </h2>

          <div className="mt-5 max-w-none">

            <p className="whitespace-pre-line break-words text-sm leading-7 text-slate-500 sm:text-[15px] sm:leading-8">
              {overview}
            </p>

          </div>

          {/* TAGS */}

          <div className="mt-6 flex max-w-full flex-wrap gap-2">

            <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-600">
              AI
            </span>

            <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-600">
              {category}
            </span>

            <span className="max-w-full break-all rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-600">
              {name}
            </span>

          </div>

        </section>

        {/* =================================================
            WHO SHOULD USE
        ================================================= */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-9">

          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Who Should Use {name}?
          </h2>

          <p className="mt-4 break-words text-sm leading-7 text-slate-500 sm:text-[15px] sm:leading-8">
            {name} is designed for individuals, creators, professionals, and teams looking for a practical {category.toLowerCase()} solution that can improve efficiency and simplify everyday workflows.
          </p>

        </section>

        {/* =================================================
            PRICING
        ================================================= */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-9">

          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Pricing
          </h2>

          <p className="mt-4 break-words text-sm leading-7 text-slate-500 sm:text-[15px] sm:leading-8">
            {name} currently appears in the AI Vault directory with a{" "}
            <strong className="font-bold text-slate-700">
              {pricing}
            </strong>{" "}
            pricing model. Users should check the official portal for the latest pricing, feature limits, and usage terms.
          </p>

        </section>

        {/* =================================================
            FEATURES + LIMITATIONS
        ================================================= */}

        <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-2">

          {/* FEATURES */}

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            <h2 className="text-xl font-extrabold text-slate-900">
              Key Features
            </h2>

            <ul className="mt-5 space-y-4">

              {features.map(
                (feature, index) => (
                  <li
                    key={`feature-${index}`}
                    className="flex min-w-0 gap-3 text-sm leading-6 text-slate-500"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />

                    <span className="min-w-0 break-words">
                      {feature}
                    </span>
                  </li>
                )
              )}

            </ul>

          </section>

          {/* LIMITATIONS */}

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

            <h2 className="text-xl font-extrabold text-slate-900">
              Limitations
            </h2>

            <ul className="mt-5 space-y-4">

              {limitations.map(
                (limitation, index) => (
                  <li
                    key={`limitation-${index}`}
                    className="flex min-w-0 gap-3 text-sm leading-6 text-slate-500"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />

                    <span className="min-w-0 break-words">
                      {limitation}
                    </span>
                  </li>
                )
              )}

            </ul>

          </section>

        </div>

        {/* =================================================
            USE CASES
        ================================================= */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-9">

          <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
            Use Cases
          </h2>

          <div className="mt-5 flex max-w-full flex-wrap gap-2">

            {useCases.map(
              (useCase, index) => (
                <span
                  key={`use-case-${index}`}
                  className="max-w-full break-words rounded-full bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-600"
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

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-9">

          <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
            How To Get Started
          </h2>

          <ol className="mt-5 space-y-4">

            {gettingStarted.map(
              (step, index) => (
                <li
                  key={`step-${index}`}
                  className="flex min-w-0 items-start gap-3"
                >

                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-50 text-[10px] font-bold text-slate-600">
                    {index + 1}
                  </span>

                  <span className="min-w-0 break-words pt-0.5 text-sm leading-6 text-slate-500">
                    {step}
                  </span>

                </li>
              )
            )}

          </ol>

        </section>

        {/* =================================================
            FAQ
        ================================================= */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-9">

          <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
            Frequently Asked Questions
          </h2>

          <div className="mt-5 divide-y divide-slate-100">

            {faqs.map(
              (faq, index) => (
                <div
                  key={`faq-${index}`}
                  className="py-5 first:pt-0 last:pb-0"
                >

                  <h3 className="break-words text-sm font-bold text-slate-800">
                    {faq.question}
                  </h3>

                  <p className="mt-2 break-words text-sm leading-7 text-slate-500">
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

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-9">

          <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
            Tool Specifications
          </h2>

          <div className="mt-5 divide-y divide-slate-100">

            {/* CATEGORY */}

            <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">

              <span className="text-sm text-slate-500">
                Category
              </span>

              <span className="break-words text-sm font-bold text-slate-800 sm:text-right">
                {category}
              </span>

            </div>

            {/* PRICING */}

            <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">

              <span className="text-sm text-slate-500">
                Pricing Model
              </span>

              <span className="break-words text-sm font-bold text-slate-800 sm:text-right">
                {pricing}
              </span>

            </div>

            {/* OS */}

            <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">

              <span className="text-sm text-slate-500">
                Operating System
              </span>

              <span className="break-words text-sm font-bold text-slate-800 sm:text-right">
                {getOperatingSystem(tool)}
              </span>

            </div>

            {/* DEPLOYMENT */}

            <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">

              <span className="text-sm text-slate-500">
                Deployment
              </span>

              <span className="break-words text-sm font-bold text-slate-800 sm:text-right">
                {getDeployment(tool)}
              </span>

            </div>

            {/* LICENSE */}

            <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">

              <span className="text-sm text-slate-500">
                License
              </span>

              <span className="break-words text-sm font-bold text-slate-800 sm:text-right">
                {getLicense(tool)}
              </span>

            </div>

            {/* INTEGRATIONS */}

            <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-start sm:justify-between">

              <span className="shrink-0 text-sm text-slate-500">
                Integrations
              </span>

              <div className="flex max-w-full flex-wrap justify-start gap-2 sm:justify-end">

                {integrations.map(
                  (integration, index) => (
                    <span
                      key={`integration-${index}`}
                      className="max-w-full break-words rounded-lg bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-600"
                    >
                      {integration}
                    </span>
                  )
                )}

              </div>

            </div>

          </div>

          {/* FINAL CTA */}

          {officialLink && (
            <a
              href={officialLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-center text-xs font-extrabold uppercase tracking-wide text-white transition hover:bg-blue-600 sm:min-h-14 sm:text-sm"
            >
              Visit Official Portal ↗
            </a>
          )}

        </section>

        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <div className="mt-6">

          <Link
            href={`/category/${encodeURIComponent(
              categorySlug
            )}`}
            className="inline-flex max-w-full items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            ← Back to AI Directory
          </Link>

        </div>

      </div>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="mt-12 border-t border-slate-100 bg-white">

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-7 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} AI Vault. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 sm:gap-5">

            <Link
              href="/about"
              className="hover:text-slate-700"
            >
              About
            </Link>

            <Link
              href="/contact"
              className="hover:text-slate-700"
            >
              Contact
            </Link>

            <Link
              href="/privacy"
              className="hover:text-slate-700"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="hover:text-slate-700"
            >
              Terms
            </Link>

          </div>

        </div>

      </footer>

    </main>
  );
}
