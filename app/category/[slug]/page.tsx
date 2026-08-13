import type { Metadata } from "next";
import Link from "next/link";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    q?: string;
    search?: string;
    pricing?: string;
    page?: string;
  }>;
}

interface Tool {
  id: string | number;
  name: string;
  slug: string;
  category: string | null;
  pricing: string | null;
  description: string | null;
  image_url: string | null;
  logo_url: string | null;
  score: number | null;
}

interface ToolRow {
  id: string | number;
  name: string | null;
  slug: string | null;
  category: string | null;
  pricing: string | null;
  description: string | null;
  image_url: string | null;
  logo_url: string | null;
  score: number | null;
}

/* =========================================================
   SUPABASE
========================================================= */

function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[CATEGORY] Missing Supabase environment variables"
    );

    return null;
  }

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/* =========================================================
   HELPERS
========================================================= */

function decodeSlug(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function formatCategoryTitle(
  rawSlug: string
): string {
  const decoded = decodeSlug(rawSlug)
    .replace(/[-_]+/g, " ")
    .trim();

  if (!decoded) {
    return "AI Tools";
  }

  return (
    decoded.charAt(0).toUpperCase() +
    decoded.slice(1)
  );
}

function normaliseCategory(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

/* =========================================================
   CATEGORY ALIASES
========================================================= */

const CATEGORY_ALIASES: Record<
  string,
  string[]
> = {
  productivity: [
    "Productivity",
  ],

  marketing: [
    "Marketing",
    "Marketing & Sales",
    "Marketing and Sales",
  ],

  coding: [
    "Coding",
    "Developer",
    "Development",
  ],

  chatbot: [
    "Chatbot",
    "Chatbots",
  ],

  "video-gen": [
    "Video Gen",
    "Video",
    "Video Generation",
    "Video Editing",
  ],

  video: [
    "Video",
    "Video Gen",
    "Video Generation",
    "Video Editing",
  ],

  "image-gen": [
    "Image Gen",
    "Image",
    "Images",
    "Image Generation",
  ],

  image: [
    "Image",
    "Images",
    "Image Gen",
    "Image Generation",
  ],

  writing: [
    "Writing",
    "Copywriting",
    "Content Writing",
  ],

  design: [
    "Design",
    "Graphic Design",
  ],

  education: [
    "Education",
    "EdTech",
  ],

  business: [
    "Business",
  ],

  research: [
    "Research",
  ],

  audio: [
    "Audio",
    "Music",
  ],

  seo: [
    "SEO",
    "Search Engine Optimization",
  ],
};

function getCategoryAliases(
  rawSlug: string,
  categoryName: string
): string[] {
  const key = normaliseCategory(
    rawSlug
  ).replace(/\s+/g, "-");

  const aliases =
    CATEGORY_ALIASES[key];

  if (
    aliases &&
    aliases.length > 0
  ) {
    return aliases;
  }

  return Array.from(
    new Set([
      categoryName,
      rawSlug,
      rawSlug.replace(
        /[-_]+/g,
        " "
      ),
    ])
  );
}

/* =========================================================
   SAFE STRING
========================================================= */

function safeString(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

/* =========================================================
   TOOL CLEANER
========================================================= */

function cleanTool(
  row: ToolRow
): Tool | null {
  if (
    row.id === null ||
    row.id === undefined ||
    !safeString(row.name) ||
    !safeString(row.slug)
  ) {
    return null;
  }

  return {
    id: row.id,

    name: safeString(row.name),

    slug: safeString(row.slug),

    category:
      safeString(row.category) ||
      null,

    pricing:
      safeString(row.pricing) ||
      null,

    description:
      safeString(row.description) ||
      null,

    image_url:
      safeString(row.image_url) ||
      null,

    logo_url:
      safeString(row.logo_url) ||
      null,

    score:
      typeof row.score === "number"
        ? row.score
        : null,
  };
}

/* =========================================================
   REAL LOGO COMPONENT
   ---------------------------------------------------------
   Priority:
   1. logo_url
   2. image_url
   3. first letter
========================================================= */

function InlineToolLogo({
  tool,
}: {
  tool: Tool;
}) {
  const realLogo =
    safeString(tool.logo_url);

  const fallbackImage =
    safeString(tool.image_url);

  const firstLetter =
    tool.name
      .trim()
      .charAt(0)
      .toUpperCase() || "A";

  /*
   * Use real logo first.
   * If it fails, browser hides it and
   * the image_url fallback becomes visible.
   */

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-black text-white shadow-sm">

      {/* First-letter fallback */}
      <span className="relative z-0">
        {firstLetter}
      </span>

      {/* REAL LOGO */}
      {realLogo && (
        <img
          src={realLogo}
          alt={`${tool.name} logo`}
          className="absolute inset-0 z-10 h-full w-full bg-white object-contain p-1"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.style.display =
              "none";
          }}
        />
      )}

      {/* IMAGE FALLBACK */}
      {!realLogo &&
        fallbackImage && (
          <img
            src={fallbackImage}
            alt={`${tool.name} image`}
            className="absolute inset-0 z-10 h-full w-full bg-white object-contain p-1"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.style.display =
                "none";
            }}
          />
        )}

    </div>
  );
}

/* =========================================================
   METADATA
========================================================= */

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const resolvedParams =
    await params;

  const resolvedSearchParams =
    await searchParams;

  const rawCategory =
    decodeSlug(
      resolvedParams.slug
    ).trim();

  const categoryName =
    formatCategoryTitle(
      rawCategory
    );

  const searchQuery =
    safeString(
      resolvedSearchParams.q
    ) ||
    safeString(
      resolvedSearchParams.search
    );

  const title = searchQuery
    ? `Best ${categoryName} AI Tools for "${searchQuery}" | AI Vault`
    : `Best ${categoryName} AI Tools | AI Vault`;

  const description =
    `Discover the best ${categoryName} AI tools, software platforms, pricing, features, alternatives, and reviews on AI Vault.`;

  const canonical =
    `${SITE_URL}/category/${encodeURIComponent(
      rawCategory
    )}`;

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
   CATEGORY PAGE
========================================================= */

export default async function CategoryPage({
  params,
  searchParams,
}: Props) {
  const resolvedParams =
    await params;

  const resolvedSearchParams =
    await searchParams;

  const rawCategory =
    decodeSlug(
      resolvedParams.slug
    ).trim();

  const categoryName =
    formatCategoryTitle(
      rawCategory
    );

  const searchQuery =
    safeString(
      resolvedSearchParams.q
    ) ||
    safeString(
      resolvedSearchParams.search
    );

  const pricingFilter =
    safeString(
      resolvedSearchParams.pricing
    );

  const parsedPage =
    Number.parseInt(
      safeString(
        resolvedSearchParams.page
      ) || "1",
      10
    );

  const page =
    Number.isFinite(parsedPage) &&
    parsedPage > 0
      ? parsedPage
      : 1;

  const pageSize = 24;

  /* =======================================================
     SUPABASE CLIENT
  ======================================================= */

  const supabase =
    getSupabaseClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white text-slate-950">

        <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">

            <Link
              href="/"
              className="text-xl font-black tracking-tight"
            >
              AI Vault.
            </Link>

            <Link
              href="/categories"
              className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wide"
            >
              Browse All Categories
            </Link>

          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">

          <div className="rounded-2xl border border-red-100 p-10 text-center shadow-sm">

            <h1 className="text-xl font-bold">
              Unable to load this category
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              The AI Vault database
              configuration is unavailable.
            </p>

            <Link
              href="/categories"
              className="mt-6 inline-block text-sm font-bold text-blue-600"
            >
              Return to Directory →
            </Link>

          </div>

        </main>

      </div>
    );
  }

  /* =======================================================
     CATEGORY ALIASES
  ======================================================= */

  const aliases =
    getCategoryAliases(
      rawCategory,
      categoryName
    );

  /*
   * IMPORTANT:
   * Do not compare formatted title only.
   *
   * Example:
   * URL = /category/Marketing
   *
   * Database can contain:
   * Marketing
   * Marketing & Sales
   * Marketing and Sales
   */

  const categoryConditions =
    aliases
      .map(
        (value) =>
          `category.ilike.%${value}%`
      )
      .join(",");

  /* =======================================================
     DATABASE QUERY
  ======================================================= */

  let query = supabase
    .from("ai_tools")
    .select(
      `
        id,
        name,
        slug,
        category,
        pricing,
        description,
        image_url,
        logo_url,
        score
      `,
      {
        count: "exact",
      }
    )
    .or(categoryConditions);

  /* =======================================================
     SEARCH FILTER
  ======================================================= */

  if (searchQuery) {
    query = query.or(
      `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
    );
  }

  /* =======================================================
     PRICING FILTER
  ======================================================= */

  if (pricingFilter) {
    query = query.ilike(
      "pricing",
      `%${pricingFilter}%`
    );
  }

  /* =======================================================
     PAGINATION
  ======================================================= */

  const fromIndex =
    (page - 1) *
    pageSize;

  const toIndex =
    fromIndex +
    pageSize -
    1;

  /* =======================================================
     EXECUTE QUERY
  ======================================================= */

  const result =
    await query
      .order("score", {
        ascending: false,
        nullsFirst: false,
      })
      .order("name", {
        ascending: true,
      })
      .range(
        fromIndex,
        toIndex
      );

  /* =======================================================
     DATABASE ERROR
  ======================================================= */

  if (result.error) {
    console.error(
      "================================================="
    );

    console.error(
      "[AI VAULT CATEGORY DATABASE ERROR]"
    );

    console.error(
      "Slug:",
      rawCategory
    );

    console.error(
      "Category:",
      categoryName
    );

    console.error(
      "Code:",
      result.error.code
    );

    console.error(
      "Message:",
      result.error.message
    );

    console.error(
      "Details:",
      result.error.details
    );

    console.error(
      "Hint:",
      result.error.hint
    );

    console.error(
      "================================================="
    );

    return (
      <div className="min-h-screen bg-white text-slate-950">

        <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">

          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">

            <Link
              href="/"
              className="text-xl font-black tracking-tight"
            >
              AI Vault.
            </Link>

            <Link
              href="/categories"
              className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wide"
            >
              Browse All Categories
            </Link>

          </div>

        </header>

        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">

          <div className="rounded-2xl border border-red-100 p-10 text-center shadow-sm">

            <h1 className="text-xl font-bold">
              Unable to load this category
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              The AI Vault database returned
              an error while loading this category.
            </p>

            <p className="mt-3 text-xs font-semibold text-red-500">
              Category: {categoryName}
            </p>

            <Link
              href={`/category/${encodeURIComponent(
                rawCategory
              )}`}
              className="mt-6 inline-block text-sm font-bold text-blue-600"
            >
              Try Again →
            </Link>

          </div>

        </main>

      </div>
    );
  }

  /* =======================================================
     SAFE DATA
  ======================================================= */

  const rawRows =
    Array.isArray(result.data)
      ? result.data
      : [];

  const tools: Tool[] =
    rawRows
      .map((row) => {
        const data =
          row as Partial<ToolRow>;

        if (
          data.id ===
            null ||
          data.id ===
            undefined ||
          !safeString(
            data.name
          ) ||
          !safeString(
            data.slug
          )
        ) {
          return null;
        }

        return {
          id: data.id,

          name: safeString(
            data.name
          ),

          slug: safeString(
            data.slug
          ),

          category:
            safeString(
              data.category
            ) || null,

          pricing:
            safeString(
              data.pricing
            ) || null,

          description:
            safeString(
              data.description
            ) || null,

          image_url:
            safeString(
              data.image_url
            ) || null,

          logo_url:
            safeString(
              data.logo_url
            ) || null,

          score:
            typeof data.score ===
            "number"
              ? data.score
              : null,
        } satisfies Tool;
      })
      .filter(
        (
          tool
        ): tool is Tool =>
          tool !== null
      );

  const count =
    typeof result.count ===
    "number"
      ? result.count
      : tools.length;

  const totalPages =
    count > 0
      ? Math.ceil(
          count / pageSize
        )
      : 1;

  /* =======================================================
     BREADCRUMB SEO SCHEMA
  ======================================================= */

  const breadcrumbSchema = {
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

        name: categoryName,

        item:
          `${SITE_URL}/category/${encodeURIComponent(
            rawCategory
          )}`,
      },
    ],
  };

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <>

      {/* ===================================================
          SEO JSON-LD
      =================================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              breadcrumbSchema
            ),
        }}
      />

      <div className="min-h-screen bg-white text-slate-950">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">

          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">

            <Link
              href="/"
              className="text-xl font-black tracking-tight"
            >
              AI Vault.
            </Link>

            <Link
              href="/categories"
              className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-700 transition hover:bg-slate-200"
            >
              Browse All Categories
            </Link>

          </div>

        </header>

        {/* =================================================
            MAIN
        ================================================= */}

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          {/* =================================================
              BREADCRUMB
          ================================================= */}

          <nav
            aria-label="Breadcrumb"
            className="mb-5 text-xs text-slate-500"
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

              <li className="font-semibold text-slate-900">
                {categoryName}
              </li>

            </ol>

          </nav>

          {/* =================================================
              HERO
          ================================================= */}

          <section className="space-y-4 py-4">

            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Best {categoryName} AI Tools
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Explore verified software platforms,
              pricing models, features, alternatives,
              and AI tools in the{" "}
              {categoryName} domain.
            </p>

            <div className="text-xs font-bold text-blue-600">
              Showing {count} Verified Tools
            </div>

          </section>

          {/* =================================================
              ACTIVE FILTERS
          ================================================= */}

          {(searchQuery ||
            pricingFilter) && (

            <div className="mb-5 flex flex-wrap gap-2">

              {searchQuery && (
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  Search: {searchQuery}
                </span>
              )}

              {pricingFilter && (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  Pricing: {pricingFilter}
                </span>
              )}

              <Link
                href={`/category/${encodeURIComponent(
                  rawCategory
                )}`}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 underline hover:text-slate-900"
              >
                Clear filters
              </Link>

            </div>
          )}

          {/* =================================================
              TOOL GRID
          ================================================= */}

          {tools.length > 0 ? (

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {tools.map(
                (tool) => (

                  <Link
                    key={String(
                      tool.id
                    )}
                    href={`/tool/${encodeURIComponent(
                      tool.slug
                    )}`}
                    className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
                  >

                    <div className="space-y-4">

                      {/* =================================================
                          LOGO + PRICING
                      ================================================= */}

                      <div className="flex items-center justify-between gap-4">

                        <InlineToolLogo
                          tool={tool}
                        />

                        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                          {tool.pricing ||
                            "Freemium"}
                        </span>

                      </div>

                      {/* =================================================
                          TOOL CONTENT
                      ================================================= */}

                      <div>

                        <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600">
                          {tool.name}
                        </h2>

                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500">
                          {tool.description ||
                            `Explore ${tool.name}, an AI tool available in the ${categoryName} category.`}
                        </p>

                      </div>

                      {/* =================================================
                          CARD FOOTER
                      ================================================= */}

                      <div className="flex items-center justify-between border-t border-slate-100 pt-4">

                        <span className="text-xs text-slate-500">
                          {tool.category ||
                            categoryName}
                        </span>

                        <span className="text-xs font-semibold text-blue-600">
                          Inspect →
                        </span>

                      </div>

                    </div>

                  </Link>

                )
              )}

            </div>

          ) : (

            /* =================================================
               EMPTY STATE
            ================================================= */

            <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">

              <h2 className="text-lg font-bold text-slate-900">
                No tools found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
                No tools match the selected
                criteria in this category.
              </p>

              <Link
                href="/categories"
                className="mt-5 inline-block text-sm font-bold text-blue-600"
              >
                Return to Directory →
              </Link>

            </div>

          )}

          {/* =================================================
              PAGINATION
          ================================================= */}

          {totalPages > 1 && (

            <nav
              aria-label="Category pagination"
              className="mt-8 flex flex-wrap justify-center gap-2"
            >

              {Array.from(
                {
                  length:
                    totalPages,
                },
                (_, index) =>
                  index + 1
              ).map(
                (pageNumber) => {

                  const params =
                    new URLSearchParams();

                  if (searchQuery) {
                    params.set(
                      "q",
                      searchQuery
                    );
                  }

                  if (pricingFilter) {
                    params.set(
                      "pricing",
                      pricingFilter
                    );
                  }

                  if (
                    pageNumber >
                    1
                  ) {
                    params.set(
                      "page",
                      String(
                        pageNumber
                      )
                    );
                  }

                  const queryString =
                    params.toString();

                  const href =
                    `/category/${encodeURIComponent(
                      rawCategory
                    )}` +
                    (queryString
                      ? `?${queryString}`
                      : "");

                  const active =
                    pageNumber ===
                    page;

                  return (
                    <Link
                      key={
                        pageNumber
                      }
                      href={href}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                        active
                          ? "bg-blue-600 text-white"
                          : "border border-slate-100 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                      aria-current={
                        active
                          ? "page"
                          : undefined
                      }
                    >
                      {pageNumber}
                    </Link>
                  );
                }
              )}

            </nav>

          )}

        </main>

      </div>

    </>
  );
}
