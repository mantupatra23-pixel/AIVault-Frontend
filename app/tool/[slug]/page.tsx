import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ToolLogo from "@/components/ToolLogo";

const SITE_URL = "https://aivault.pp.ua";
const SITE_NAME = "AI Vault";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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
  name: string;
  slug: string;
  description: string;
  category: string;
  pricing: string;
  websiteUrl: string;
  score: number;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

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

function normalizeWebsite(value: unknown): string {
  const raw = clean(value);

  if (!raw) {
    return "";
  }

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://")
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

  return `${text.slice(0, 157)}...`;
}

function titleCase(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function pricingLabel(value: unknown): string {
  const pricing = clean(value).toLowerCase();

  if (!pricing) return "Freemium";

  if (
    pricing.includes("free") &&
    pricing.includes("paid")
  ) {
    return "Freemium";
  }

  if (pricing.includes("freemium")) {
    return "Freemium";
  }

  if (pricing.includes("paid")) {
    return "Paid";
  }

  if (
    pricing.includes("contact") ||
    pricing.includes("custom")
  ) {
    return "Custom";
  }

  if (pricing.includes("free")) {
    return "Free";
  }

  return titleCase(clean(value));
}

function getScore(
  name: string,
  description: string,
  category: string
): number {
  let score = 82;

  if (name.length > 3) score += 1;
  if (description.length > 120) score += 1;
  if (description.length > 300) score += 1;
  if (category) score += 1;

  return Math.min(95, Math.max(80, score));
}

async function getTool(
  requestedSlug: string
): Promise<ToolPageData | null> {
  const supabase = getSupabase();

  if (!supabase) {
    return null;
  }

  const normalizedSlug = clean(requestedSlug);

  const fields =
    "id,name,slug,description,category,pricing,website_url,website";

  let data: ToolRecord | null = null;

  const exact = await supabase
    .from("ai_tools")
    .select(fields)
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (!exact.error && exact.data) {
    data = exact.data as ToolRecord;
  }

  if (!data) {
    const fallback = await supabase
      .from("ai_tools")
      .select(fields)
      .ilike("slug", normalizedSlug)
      .limit(1)
      .maybeSingle();

    if (!fallback.error && fallback.data) {
      data = fallback.data as ToolRecord;
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

  const description = clean(data.description);

  const finalSlug =
    slugify(data.slug) ||
    slugify(name) ||
    slugify(normalizedSlug);

  const websiteUrl = normalizeWebsite(
    data.website_url || data.website
  );

  const pricing = pricingLabel(data.pricing);

  return {
    name,
    slug: finalSlug,
    description:
      description ||
      `Explore ${name}, an AI software solution in the ${category} category. Discover its features, pricing, use cases, and capabilities on AI Vault.`,
    category,
    pricing,
    websiteUrl,
    score: getScore(
      name,
      description,
      category
    ),
  };
}

/* =========================================================
   METADATA
========================================================= */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const tool = await getTool(slug);

  if (!tool) {
    return {
      title: "AI Tool | AI Vault",
      description:
        "Discover AI software and tools on AI Vault.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${tool.name} — ${tool.category} AI Tool`;

  const description =
    shortDescription(tool.description);

  const canonical =
    `${SITE_URL}/tool/${tool.slug}`;

  return {
    title,
    description,

    metadataBase: new URL(SITE_URL),

    keywords: [
      tool.name,
      `${tool.name} AI`,
      `${tool.name} alternatives`,
      `${tool.name} pricing`,
      `${tool.name} review`,
      `${tool.name} features`,
      `${tool.category} AI tools`,
      "AI tools",
      "AI software",
      "AI SaaS",
      "AI Vault",
    ],

    alternates: {
      canonical,
    },

    robots: {
      index: true,
      follow: true,

      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: canonical,
      title,
      description,
      locale: "en_US",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/* =========================================================
   HELPERS
========================================================= */

function getFeatures(
  tool: ToolPageData
): string[] {
  const category =
    tool.category.toLowerCase();

  if (category.includes("coding")) {
    return [
      `Streamlined coding workflow for ${tool.name}.`,
      "Developer-focused productivity features.",
      "Supports faster development and workflow optimization.",
    ];
  }

  if (category.includes("image")) {
    return [
      "AI-powered image creation and visual workflows.",
      "Fast creative generation and experimentation.",
      "Useful for designers, creators, and marketing teams.",
    ];
  }

  if (category.includes("video")) {
    return [
      "AI-assisted video creation and editing workflows.",
      "Faster content production for creators and teams.",
      "Useful for marketing, social media, and creative projects.",
    ];
  }

  if (category.includes("writing")) {
    return [
      "AI-assisted writing and content workflows.",
      "Helps accelerate drafting and content production.",
      "Useful for creators, marketers, and professional teams.",
    ];
  }

  if (category.includes("marketing")) {
    return [
      "Marketing workflow automation and optimization.",
      "Helps teams improve content and campaign productivity.",
      "Useful for marketers, agencies, and businesses.",
    ];
  }

  return [
    `AI-powered workflows focused on ${tool.category.toLowerCase()}.`,
    "Designed to simplify repetitive tasks and improve productivity.",
    "Useful for individuals, creators, professionals, and teams.",
  ];
}

function getLimitations(
  tool: ToolPageData
): string[] {
  return [
    "Some advanced features may require time to learn.",
    "Feature availability can vary by pricing plan.",
    "Third-party integrations and capabilities may change over time.",
  ];
}

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
    ];
  }

  if (category.includes("image")) {
    return [
      "Visual Content Creation",
      "Design Workflow",
      "Marketing Content",
    ];
  }

  if (category.includes("video")) {
    return [
      "Video Creation",
      "Social Media Content",
      "Marketing Production",
    ];
  }

  if (category.includes("writing")) {
    return [
      "Content Creation",
      "Copywriting",
      "Productivity Enhancement",
    ];
  }

  if (category.includes("marketing")) {
    return [
      "Marketing Automation",
      "Campaign Optimization",
      "Growth Workflows",
    ];
  }

  return [
    `${tool.category} Workflows`,
    "Workflow Optimization",
    "Productivity Enhancement",
  ];
}

function getSteps(
  tool: ToolPageData
): string[] {
  return [
    `Visit the official platform portal for ${tool.name}.`,
    "Create or authenticate your user account.",
    "Configure the available workspace or project settings.",
    "Start your workflow and evaluate the generated results.",
  ];
}

function getFaqs(
  tool: ToolPageData
) {
  return [
    {
      question: `What is ${tool.name} used for?`,
      answer:
        `${tool.name} is an AI software platform in the ${tool.category.toLowerCase()} category. It is designed to help users improve workflows and productivity.`,
    },
    {
      question: `Is ${tool.name} free to use?`,
      answer:
        `${tool.name} currently appears to use a ${tool.pricing.toLowerCase()} pricing model. Check the official portal for the latest plans and pricing.`,
    },
    {
      question: `Does ${tool.name} require software installation?`,
      answer:
        `${tool.name} can generally be accessed through its official platform. Availability of desktop, mobile, API, or browser features may depend on the provider.`,
    },
    {
      question: `Who should use ${tool.name}?`,
      answer:
        `${tool.name} is suitable for users, creators, developers, professionals, or teams looking for solutions related to ${tool.category.toLowerCase()}.`,
    },
    {
      question: `Where can I access ${tool.name}?`,
      answer: tool.websiteUrl
        ? `You can access ${tool.name} through its official platform portal.`
        : `Search for the official ${tool.name} website before using the service.`,
    },
  ];
}

/* =========================================================
   PAGE
========================================================= */

export default async function ToolPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const tool = await getTool(slug);

  if (!tool) {
    notFound();
  }

  const canonical =
    `${SITE_URL}/tool/${tool.slug}`;

  const features =
    getFeatures(tool);

  const limitations =
    getLimitations(tool);

  const useCases =
    getUseCases(tool);

  const steps =
    getSteps(tool);

  const faqs =
    getFaqs(tool);

  /* =====================================================
     STRUCTURED DATA
  ===================================================== */

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",

    name: tool.name,

    description:
      tool.description,

    applicationCategory:
      tool.category,

    operatingSystem:
      "Web",

    url: canonical,

    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },

    offers: {
      "@type": "Offer",
      category: tool.pricing,
      url: tool.websiteUrl || canonical,
    },
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
        name: tool.category,
        item: `${SITE_URL}/?cat=${encodeURIComponent(
          tool.category
        )}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: tool.name,
        item: canonical,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",

    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,

      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-slate-900">

      {/* =================================================
          JSON-LD
      ================================================= */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            softwareSchema
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
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
              href={tool.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-slate-950 px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-blue-600"
            >
              Visit Official Portal ↗
            </a>
          ) : (
            <Link
              href="/"
              className="rounded-xl bg-slate-950 px-5 py-3 text-xs font-bold uppercase tracking-wide text-white"
            >
              Explore AI Tools
            </Link>
          )}

        </div>
      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500"
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

            <ToolLogo
              tool={tool}
              size="lg"
            />

            <div className="min-w-0 flex-1">

              <div className="mb-3 flex flex-wrap items-center gap-2">

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {tool.category}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {tool.pricing}
                </span>

              </div>

              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {tool.name}
              </h1>

              <div className="mt-5">

                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  AI VAULT SCORE
                </div>

                <div className="text-2xl font-black text-slate-950">
                  {tool.score}
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

          <p className="mt-5 text-sm leading-7 text-slate-600">
            {tool.description}
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            {tool.name} is listed in the{" "}
            <strong className="font-semibold text-slate-900">
              {tool.category}
            </strong>{" "}
            category on AI Vault. Explore its capabilities,
            pricing model, use cases, limitations, and
            specifications to determine whether it fits your
            workflow and requirements.
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

          <p className="mt-4 text-sm leading-7 text-slate-600">
            {tool.name} is designed for users, creators,
            professionals, developers, and teams looking for
            efficient solutions related to{" "}
            <strong className="text-slate-900">
              {tool.category.toLowerCase()}
            </strong>
            .
          </p>

        </section>

        {/* =================================================
            PRICING
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold">
            Pricing
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            {tool.name} operates under a{" "}
            <strong className="font-semibold text-slate-900">
              {tool.pricing}
            </strong>{" "}
            pricing model. Check the official portal for
            current plans, pricing, limits, and availability.
          </p>

        </section>

        {/* =================================================
            FEATURES + LIMITATIONS
        ================================================= */}

        <div className="mt-6 grid gap-6 md:grid-cols-2">

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            <h2 className="text-xl font-bold">
              Key Features
            </h2>

            <div className="mt-5 space-y-5">

              {features.map(
                (feature, index) => (
                  <div key={index}>
                    <p className="text-sm leading-6 text-slate-600">
                      <strong className="font-bold text-slate-900">
                        {feature.split(".")[0]}.
                      </strong>{" "}
                      {feature
                        .split(".")
                        .slice(1)
                        .join(".")
                        .trim()}
                    </p>
                  </div>
                )
              )}

            </div>

          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            <h2 className="text-xl font-bold">
              Limitations
            </h2>

            <div className="mt-5 space-y-5">

              {limitations.map(
                (limitation, index) => (
                  <div key={index}>
                    <p className="text-sm leading-6 text-slate-600">
                      <strong className="font-bold text-slate-900">
                        {limitation.split(".")[0]}.
                      </strong>{" "}
                      {limitation
                        .split(".")
                        .slice(1)
                        .join(".")
                        .trim()}
                    </p>
                  </div>
                )
              )}

            </div>

          </section>

        </div>

        {/* =================================================
            USE CASES
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold">
            Use Cases
          </h2>

          <div className="mt-5 flex flex-wrap gap-3">

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

          <ol className="mt-5 space-y-4">

            {steps.map(
              (step, index) => (
                <li
                  key={index}
                  className="flex gap-3 text-sm leading-6 text-slate-600"
                >
                  <span className="font-semibold text-slate-900">
                    {index + 1}.
                  </span>

                  <span>
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

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold">
            Frequently Asked Questions
          </h2>

          <div className="mt-5 divide-y divide-slate-200">

            {faqs.map(
              (faq) => (
                <div
                  key={faq.question}
                  className="py-5"
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
            SPECIFICATIONS
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold">
            Tool Specifications
          </h2>

          <div className="mt-5 divide-y divide-slate-200">

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

            <div className="flex items-center justify-between gap-6 py-4 text-sm">
              <span className="text-slate-500">
                Integrations
              </span>

              <div className="flex flex-wrap justify-end gap-2">

                <span className="rounded-md bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-600">
                  Web APIs
                </span>

                <span className="rounded-md bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-600">
                  Cloud Services
                </span>

              </div>

            </div>

          </div>

          {/* =================================================
              CTA
          ================================================= */}

          {tool.websiteUrl ? (
            <a
              href={tool.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-4 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-blue-600"
            >
              Visit Official Portal ↗
            </a>
          ) : (
            <Link
              href="/"
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-4 text-xs font-bold uppercase tracking-wide text-white"
            >
              Explore AI Vault
            </Link>
          )}

        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="py-12 text-center">

          <Link
            href="/"
            className="text-lg font-black text-slate-950"
          >
            AI Vault
          </Link>

          <p className="mt-2 text-xs text-slate-500">
            Discover, compare, and explore AI software.
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-5 text-xs text-slate-500">

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

          <p className="mt-5 text-xs text-slate-400">
            © {new Date().getFullYear()} AI Vault. All rights reserved.
          </p>

        </footer>

      </div>
    </main>
  );
}
