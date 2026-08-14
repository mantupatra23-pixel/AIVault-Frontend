import Link from "next/link";
import {
  createClient,
} from "@supabase/supabase-js";

import ToolLogo from "@/components/ToolLogo";
import ToolDetailTracker from "@/components/tool-detail-tracker";
import OfficialPortalLink from "@/components/official-portal-link";

import type {
  Metadata,
} from "next";

export const dynamic =
  "force-dynamic";

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

  ai_vault_score?:
    | number
    | string
    | null;

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
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(
    url,
    key
  );
}

/* =========================================================
   HELPERS
========================================================= */

function clean(
  value: unknown
): string {
  if (
    typeof value === "string"
  ) {
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

function decodeSlug(
  value: string
): string {
  try {
    return decodeURIComponent(
      value
    );
  } catch {
    return value;
  }
}

function makeSlug(
  value: string
): string {
  return clean(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      "");
}

function getName(
  tool: ToolRecord
): string {
  return (
    clean(tool.name) ||
    "AI Tool"
  );
}

function getSlug(
  tool: ToolRecord
): string {
  return (
    clean(tool.slug) ||
    makeSlug(
      getName(tool)
    )
  );
}

function getDescription(
  tool: ToolRecord
): string {
  return (
    clean(tool.description) ||
    clean(
      tool.short_description
    ) ||
    clean(tool.overview) ||
    "Explore this AI software platform, its features, pricing, use cases, and alternatives."
  );
}

function getPricing(
  tool: ToolRecord
): string {
  const value =
    clean(
      tool.pricing_model
    ) ||
    clean(tool.pricing);

  if (!value) {
    return "Unknown";
  }

  const lower =
    value.toLowerCase();

  if (
    lower.includes(
      "freemium"
    )
  ) {
    return "Freemium";
  }

  if (
    lower === "free" ||
    lower.includes(
      "free to use"
    ) ||
    lower.includes(
      "free plan"
    )
  ) {
    return "Free";
  }

  if (
    lower.includes(
      "paid"
    ) ||
    lower.includes(
      "subscription"
    ) ||
    lower.includes(
      "pro plan"
    )
  ) {
    return "Paid";
  }

  return value;
}

function getScore(
  tool: ToolRecord
): number {
  const raw =
    tool.ai_vault_score !==
      null &&
    tool.ai_vault_score !==
      undefined
      ? tool.ai_vault_score
      : tool.score;

  const number =
    Number(raw);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return 90;
  }

  return Math.max(
    0,
    Math.min(
      100,
      number
    )
  );
}

function getLogoUrl(
  tool: ToolRecord
): string | null {
  return (
    clean(
      tool.logo_url
    ) ||
    clean(tool.logo) ||
    clean(
      tool.image_url
    ) ||
    null
  );
}

function getWebsiteUrl(
  tool: ToolRecord
): string | null {
  return (
    clean(
      tool.website_url
    ) ||
    clean(
      tool.official_url
    ) ||
    clean(tool.url) ||
    null
  );
}

/* =========================================================
   ARRAY PARSER
========================================================= */

function parseArray(
  value: unknown
): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (
          typeof item ===
          "string"
        ) {
          return item.trim();
        }

        if (
          item &&
          typeof item ===
            "object"
        ) {
          const obj =
            item as Record<
              string,
              unknown
            >;

          return (
            clean(
              obj.title
            ) ||
            clean(
              obj.name
            ) ||
            clean(
              obj.text
            ) ||
            clean(
              obj.value
            )
          );
        }

        return "";
      })
      .filter(Boolean);
  }

  if (
    typeof value ===
    "string"
  ) {
    const text =
      value.trim();

    if (!text) {
      return [];
    }

    try {
      const parsed =
        JSON.parse(text);

      if (
        Array.isArray(
          parsed
        )
      ) {
        return parseArray(
          parsed
        );
      }
    } catch {
      // plain text
    }

    return text
      .split(/\r?\n/)
      .map((item) =>
        item
          .replace(
            /^[-•*]\s*/,
            ""
          )
          .replace(
            /^\d+[.)]\s*/,
            ""
          )
          .trim()
      )
      .filter(Boolean);
  }

  return [];
}

/* =========================================================
   CONTENT
========================================================= */

function getFeatures(
  tool: ToolRecord
): string[] {
  const features =
    parseArray(
      tool.key_features
    );

  if (
    features.length
  ) {
    return features;
  }

  const fallback =
    parseArray(
      tool.features
    );

  if (
    fallback.length
  ) {
    return fallback;
  }

  return [
    "Powerful AI-assisted workflows",
    "User-friendly interface",
    "Fast and practical productivity tools",
    "Flexible workflow capabilities",
  ];
}

function getLimitations(
  tool: ToolRecord
): string[] {
  const limitations =
    parseArray(
      tool.limitations
    );

  if (
    limitations.length
  ) {
    return limitations;
  }

  const cons =
    parseArray(
      tool.cons
    );

  if (cons.length) {
    return cons;
  }

  return [
    "Some advanced capabilities may require a paid plan",
    "Feature availability may vary by plan",
    "Cloud-based features may require an internet connection",
  ];
}

function getUseCases(
  tool: ToolRecord
): string[] {
  const result =
    parseArray(
      tool.use_cases
    );

  if (result.length) {
    return result;
  }

  return [
    "Productivity",
    "Workflow automation",
    "Content creation",
    "Business operations",
  ];
}

function getGettingStarted(
  tool: ToolRecord
): string[] {
  const first =
    parseArray(
      tool.how_to_get_started
    );

  if (first.length) {
    return first;
  }

  const second =
    parseArray(
      tool.how_to_start
    );

  if (second.length) {
    return second;
  }

  const third =
    parseArray(
      tool.getting_started
    );

  if (third.length) {
    return third;
  }

  const name =
    getName(tool);

  return [
    `Visit the official ${name} portal`,
    "Create or sign in to your account if required",
    "Configure your workspace and preferences",
    "Start using the platform for your workflow",
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
    tool.faqs ??
    tool.faq;

  if (
    Array.isArray(raw)
  ) {
    const parsed =
      raw
        .map((item) => {
          if (
            !item ||
            typeof item !==
              "object"
          ) {
            return null;
          }

          const obj =
            item as Record<
              string,
              unknown
            >;

          const question =
            clean(
              obj.question
            ) ||
            clean(obj.q);

          const answer =
            clean(
              obj.answer
            ) ||
            clean(obj.a);

          if (
            !question ||
            !answer
          ) {
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

    if (
      parsed.length
    ) {
      return parsed;
    }
  }

  const name =
    getName(tool);

  const pricing =
    getPricing(tool);

  return [
    {
      question: `What is ${name} used for?`,
      answer: `${name} is an AI software platform designed to help users improve productivity and simplify relevant workflows.`,
    },
    {
      question: `Is ${name} free?`,
      answer: `${name} is currently listed as ${pricing} in the AI Vault directory. Check the official portal for current pricing and limits.`,
    },
    {
      question: `Who can use ${name}?`,
      answer: `${name} can be useful for individuals, creators, professionals, developers, and teams depending on its supported features.`,
    },
    {
      question: `How do I get started with ${name}?`,
      answer: `Use the Visit Official Portal button on this page and follow the platform's current onboarding process.`,
    },
    {
      question: `Where can I access ${name}?`,
      answer: `The official access link is provided through the Visit Official Portal button.`,
    },
  ];
}

function getOperatingSystem(
  tool: ToolRecord
): string {
  return (
    clean(
      tool.operating_system
    ) ||
    clean(tool.os) ||
    "Web / Cloud"
  );
}

function getDeployment(
  tool: ToolRecord
): string {
  return (
    clean(
      tool.deployment
    ) ||
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
    parseArray(
      tool.integrations
    );

  if (result.length) {
    return result;
  }

  return [
    "Web",
    "Cloud services",
    "API integrations",
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

  const requestedSlug =
    decodeSlug(slug);

  try {
    const supabase =
      getSupabase();

    const result =
      await supabase
        .from("ai_tools")
        .select(
          "name,slug,description,short_description,category,logo_url,image_url"
        )
        .eq(
          "slug",
          requestedSlug
        )
        .maybeSingle();

    const tool =
      result.data as
        | ToolRecord
        | null;

    if (!tool) {
      return {
        title:
          "AI Tool | AI Vault",
        description:
          "Discover verified AI software on AI Vault.",
      };
    }

    const name =
      getName(tool);

    const description =
      getDescription(tool);

    return {
      title:
        `${name} — Features, Pricing & Review | AI Vault`,
      description,
      alternates: {
        canonical:
          `/tool/${makeSlug(
            getSlug(tool)
          )}`,
      },
      openGraph: {
        title:
          `${name} | AI Vault`,
        description,
        type: "website",
        images:
          getLogoUrl(
            tool
          )
            ? [
                {
                  url:
                    getLogoUrl(
                      tool
                    ) as string,
                },
              ]
            : undefined,
      },
      twitter: {
        card:
          "summary_large_image",
        title:
          `${name} | AI Vault`,
        description,
      },
    };
  } catch {
    return {
      title:
        "AI Vault — AI Tools Directory",
      description:
        "Discover verified AI tools and software.",
    };
  }
}

/* =========================================================
   PAGE
========================================================= */

export default async function ToolPage({
  params,
}: PageProps) {
  const { slug } =
    await params;

  const requestedSlug =
    decodeSlug(slug);

  let tool:
    | ToolRecord
    | null = null;

  let databaseError:
    | string
    | null = null;

  /* =======================================================
     LOAD TOOL
  ======================================================= */

  try {
    const supabase =
      getSupabase();

    const exact =
      await supabase
        .from("ai_tools")
        .select("*")
        .eq(
          "slug",
          requestedSlug
        )
        .maybeSingle();

    if (
      !exact.error &&
      exact.data
    ) {
      tool =
        exact.data as ToolRecord;
    } else {
      const all =
        await supabase
          .from("ai_tools")
          .select("*")
          .order(
            "name",
            {
              ascending:
                true,
            }
          );

      if (all.error) {
        databaseError =
          all.error.message;
      } else {
        const rows =
          (all.data ||
            []) as ToolRecord[];

        const target =
          makeSlug(
            requestedSlug
          );

        tool =
          rows.find(
            (row) =>
              makeSlug(
                clean(
                  row.slug
                ) ||
                  getName(
                    row
                  )
              ) === target
          ) || null;
      }
    }
  } catch (error) {
    databaseError =
      error instanceof Error
        ? error.message
        : "Unable to connect to AI Vault database.";
  }

  /* =======================================================
     DATABASE ERROR
  ======================================================= */

  if (databaseError) {
    return (
      <main className="min-h-screen bg-white text-slate-950">

        <header className="border-b border-slate-100">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
            <Link
              href="/"
              className="text-xl font-black"
            >
              AI Vault
              <span className="text-blue-600">
                .
              </span>
            </Link>
          </div>
        </header>

        <section className="mx-auto max-w-2xl px-4 py-20 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-2xl font-black text-red-600">
            !
          </div>

          <h1 className="mt-6 text-2xl font-black">
            Unable to load this tool
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            The AI Vault database could not
            return this tool.
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Back to AI Vault
          </Link>

        </section>
      </main>
    );
  }

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (!tool) {
    return (
      <main className="min-h-screen bg-white text-slate-950">

        <header className="border-b border-slate-100">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">

            <Link
              href="/"
              className="text-xl font-black"
            >
              AI Vault
              <span className="text-blue-600">
                .
              </span>
            </Link>

            <Link
              href="/"
              className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white"
            >
              Browse AI Tools
            </Link>

          </div>
        </header>

        <section className="mx-auto max-w-2xl px-4 py-20 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
            🔎
          </div>

          <h1 className="mt-6 text-3xl font-black">
            Tool Not Found
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            This AI tool could not be found in the AI Vault directory.
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Back to Directory
          </Link>

        </section>
      </main>
    );
  }

  /* =======================================================
     TOOL DATA
  ======================================================= */

  const name =
    getName(tool);

  const toolSlug =
    getSlug(tool);

  const category =
    clean(tool.category) ||
    "AI Tools";

  const description =
    getDescription(tool);

  const pricing =
    getPricing(tool);

  const score =
    getScore(tool);

  const logoUrl =
    getLogoUrl(tool);

  const websiteUrl =
    getWebsiteUrl(tool);

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

  const operatingSystem =
    getOperatingSystem(tool);

  const deployment =
    getDeployment(tool);

  const license =
    getLicense(tool);

  const officialLink =
    websiteUrl &&
    /^https?:\/\//i.test(
      websiteUrl
    )
      ? websiteUrl
      : null;

  /* =======================================================
     STRUCTURED DATA
  ======================================================= */

  const schema = {
    "@context":
      "https://schema.org",
    "@type":
      "SoftwareApplication",

    name,

    description,

    applicationCategory:
      "BusinessApplication",

    operatingSystem,

    url:
      officialLink ||
      `/tool/${toolSlug}`,

    offers: {
      "@type":
        "Offer",
      price:
        pricing === "Free"
          ? "0"
          : undefined,
      priceCurrency:
        "USD",
    },

    aggregateRating: {
      "@type":
        "AggregateRating",
      ratingValue:
        Math.max(
          1,
          Math.min(
            5,
            score / 20
          )
        ).toFixed(1),
      bestRating:
        "5",
      worstRating:
        "1",
      ratingCount:
        "1",
    },
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white text-slate-950">

      {/* =================================================
          TRACK DETAIL IMPRESSION
      ================================================= */}

      <ToolDetailTracker
        slug={toolSlug}
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
              schema
            ),
        }}
      />

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

          <Link
            href="/"
            className="shrink-0 text-lg font-black tracking-tight sm:text-xl"
          >
            AI Vault
            <span className="text-blue-600">
              .
            </span>
          </Link>

          {officialLink ? (
            <OfficialPortalLink
              href={
                officialLink
              }
              slug={
                toolSlug
              }
              name={name}
              category={
                category
              }
              className="shrink-0 rounded-xl bg-slate-950 px-3 py-2 text-[9px] font-black uppercase tracking-wide text-white transition hover:bg-blue-600 sm:px-5 sm:py-2.5 sm:text-[10px]"
            >
              VISIT OFFICIAL PORTAL ↗
            </OfficialPortalLink>
          ) : (
            <span className="rounded-xl bg-slate-100 px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-slate-400">
              Official Portal Unavailable
            </span>
          )}

        </div>

      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">

        {/* BREADCRUMB */}

        <nav className="mb-7 flex flex-wrap items-center gap-2 text-xs text-slate-400">

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

          <span className="font-medium text-slate-700">
            {name}
          </span>

        </nav>

        {/* =================================================
            HERO
        ================================================= */}

        <section className="grid gap-7 lg:grid-cols-[1fr_320px]">

          <div className="min-w-0">

            <div className="flex items-start gap-4 sm:gap-5">

              <div className="shrink-0">
                <ToolLogo
                  src={logoUrl}
                  fallbackSrc={
                    clean(
                      tool.logo
                    ) ||
                    null
                  }
                  name={name}
                  size="lg"
                />
              </div>

              <div className="min-w-0">

                <div className="mb-2 flex flex-wrap items-center gap-2">

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                    Verified AI Tool
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    {category}
                  </span>

                </div>

                <h1 className="break-words text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  {name}
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                  {description}
                </p>

              </div>

            </div>

            {/* SCORE / PRICING */}

            <div className="mt-7 flex flex-wrap gap-3">

              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">

                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  AI Vault Score
                </div>

                <div className="mt-1 text-2xl font-black text-slate-950">
                  {score}
                  <span className="text-sm text-slate-400">
                    /100
                  </span>
                </div>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">

                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pricing
                </div>

                <div className="mt-1 text-lg font-black text-slate-950">
                  {pricing}
                </div>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">

                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Category
                </div>

                <div className="mt-1 text-lg font-black text-slate-950">
                  {category}
                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              ACTION CARD
          ================================================= */}

          <aside className="h-fit rounded-3xl border border-slate-200 bg-slate-50 p-5">

            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Official Access
            </div>

            <h2 className="mt-2 text-xl font-black">
              Try {name}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Visit the official platform for the latest features, plans and availability.
            </p>

            {officialLink ? (
              <OfficialPortalLink
                href={
                  officialLink
                }
                slug={
                  toolSlug
                }
                name={
                  name
                }
                category={
                  category
                }
                className="mt-5 flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-700"
              >
                VISIT OFFICIAL PORTAL ↗
              </OfficialPortalLink>
            ) : (
              <div className="mt-5 rounded-2xl bg-slate-200 px-5 py-4 text-center text-xs font-bold text-slate-500">
                Official URL not available
              </div>
            )}

            <Link
              href="/"
              className="mt-3 flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
            >
              ← Back to Directory
            </Link>

          </aside>

        </section>

        {/* =================================================
            OVERVIEW
        ================================================= */}

        <section className="mt-12">

          <div className="max-w-4xl">

            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              About {name}
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              {description}
            </p>

          </div>

        </section>

        {/* =================================================
            FEATURES
        ================================================= */}

        <section className="mt-12">

          <h2 className="text-2xl font-black tracking-tight">
            Key Features
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {features.map(
              (
                feature,
                index
              ) => (
                <div
                  key={`${feature}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex gap-3">

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-600">
                      ✓
                    </div>

                    <p className="text-sm font-semibold leading-6 text-slate-700">
                      {feature}
                    </p>

                  </div>
                </div>
              )
            )}

          </div>

        </section>

        {/* =================================================
            USE CASES
        ================================================= */}

        <section className="mt-12">

          <h2 className="text-2xl font-black tracking-tight">
            Use Cases
          </h2>

          <div className="mt-5 flex flex-wrap gap-3">

            {useCases.map(
              (
                useCase,
                index
              ) => (
                <span
                  key={`${useCase}-${index}`}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
                >
                  {useCase}
                </span>
              )
            )}

          </div>

        </section>

        {/* =================================================
            TECHNICAL DETAILS
        ================================================= */}

        <section className="mt-12">

          <h2 className="text-2xl font-black tracking-tight">
            Platform Details
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Operating System
              </div>
              <div className="mt-2 text-sm font-bold">
                {operatingSystem}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Deployment
              </div>
              <div className="mt-2 text-sm font-bold">
                {deployment}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                License
              </div>
              <div className="mt-2 text-sm font-bold">
                {license}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pricing
              </div>
              <div className="mt-2 text-sm font-bold">
                {pricing}
              </div>
            </div>

          </div>

        </section>

        {/* =================================================
            INTEGRATIONS
        ================================================= */}

        <section className="mt-12">

          <h2 className="text-2xl font-black tracking-tight">
            Integrations
          </h2>

          <div className="mt-5 flex flex-wrap gap-3">

            {integrations.map(
              (
                integration,
                index
              ) => (
                <span
                  key={`${integration}-${index}`}
                  className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
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

        <section className="mt-12">

          <h2 className="text-2xl font-black tracking-tight">
            How to Get Started
          </h2>

          <div className="mt-5 space-y-3">

            {gettingStarted.map(
              (
                step,
                index
              ) => (
                <div
                  key={`${step}-${index}`}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5"
                >

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                    {index + 1}
                  </div>

                  <p className="pt-1 text-sm font-medium leading-6 text-slate-700">
                    {step}
                  </p>

                </div>
              )
            )}

          </div>

        </section>

        {/* =================================================
            LIMITATIONS
        ================================================= */}

        <section className="mt-12">

          <h2 className="text-2xl font-black tracking-tight">
            Limitations
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            {limitations.map(
              (
                limitation,
                index
              ) => (
                <div
                  key={`${limitation}-${index}`}
                  className="rounded-2xl border border-amber-100 bg-amber-50 p-5"
                >

                  <div className="flex gap-3">

                    <span className="text-lg">
                      !
                    </span>

                    <p className="text-sm leading-6 text-amber-900">
                      {limitation}
                    </p>

                  </div>

                </div>
              )
            )}

          </div>

        </section>

        {/* =================================================
            FAQ
        ================================================= */}

        <section className="mt-12">

          <h2 className="text-2xl font-black tracking-tight">
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
                  className="group rounded-2xl border border-slate-200 bg-white p-5"
                >

                  <summary className="cursor-pointer list-none pr-6 text-sm font-bold text-slate-900">
                    {faq.question}
                  </summary>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {faq.answer}
                  </p>

                </details>
              )
            )}

          </div>

        </section>

        {/* =================================================
            FINAL CTA
        ================================================= */}

        <section className="mt-14 overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-center text-white sm:px-10">

          <h2 className="text-2xl font-black sm:text-3xl">
            Ready to explore {name}?
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Visit the official platform to see its latest features, pricing, plans and availability.
          </p>

          {officialLink && (
            <OfficialPortalLink
              href={
                officialLink
              }
              slug={
                toolSlug
              }
              name={
                name
              }
              category={
                category
              }
              className="mt-6 inline-flex rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-slate-950 transition hover:bg-blue-600 hover:text-white"
            >
              VISIT OFFICIAL PORTAL ↗
            </OfficialPortalLink>
          )}

        </section>

      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="mt-16 border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">

            <div>
              <div className="text-xl font-black">
                AI Vault
                <span className="text-blue-600">
                  .
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Discover, compare and explore verified AI software.
              </p>
            </div>

            <div className="flex flex-wrap gap-5 text-xs font-semibold text-slate-500">

              <Link
                href="/privacy"
                className="hover:text-blue-600"
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                className="hover:text-blue-600"
              >
                Terms
              </Link>

              <Link
                href="/about"
                className="hover:text-blue-600"
              >
                About
              </Link>

              <Link
                href="/contact"
                className="hover:text-blue-600"
              >
                Contact
              </Link>

            </div>

          </div>

          <p className="mt-7 text-xs text-slate-400">
            © {new Date().getFullYear()} AI Vault. All rights reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}
