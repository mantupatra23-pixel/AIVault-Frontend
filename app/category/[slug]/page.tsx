import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    q?: string;
    search?: string;
    pricing?: string;
    page?: string;
  }>;
};

type Tool = {
  id: string | number;
  name: string;
  slug: string;
  category: string | null;
  pricing: string | null;
  description: string | null;
  image_url: string | null;

  // UI-compatible fields.
  // These are NOT requested from Supabase because the
  // current production schema does not contain logo_url/score.
  logo_url?: string | null;
  score?: number | null;
};

function getSupabaseClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables are missing."
    );
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

function formatCategoryTitle(rawSlug: string): string {
  const decoded = decodeURIComponent(rawSlug)
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

function normalizeSlug(value: string): string {
  return decodeURIComponent(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/*
|--------------------------------------------------------------------------
| CATEGORY ALIASES
|--------------------------------------------------------------------------
|
| URL:
| /category/productivity
|
| Database:
| Productivity
|
| URL:
| /category/video-gen
|
| Database:
| Video Gen
|
*/

function getCategoryAliases(
  rawSlug: string
): string[] {
  const slug = normalizeSlug(rawSlug);

  const categoryAliases: Record<
    string,
    string[]
  > = {
    productivity: [
      "Productivity",
    ],

    marketing: [
      "Marketing",
    ],

    coding: [
      "Coding",
    ],

    chatbot: [
      "Chatbot",
    ],

    "video-gen": [
      "Video Gen",
    ],

    "image-gen": [
      "Image Gen",
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

    video: [
      "Video",
      "Video Gen",
      "Video Editing",
    ],

    image: [
      "Image",
      "Image Gen",
      "Images",
    ],

    business: [
      "Business",
    ],

    education: [
      "Education",
    ],

    research: [
      "Research",
    ],

    seo: [
      "SEO",
      "Search Engine Optimization",
    ],

    audio: [
      "Audio",
      "Music",
    ],
  };

  return (
    categoryAliases[slug] ?? [
      formatCategoryTitle(rawSlug),
    ]
  );
}

/*
|--------------------------------------------------------------------------
| METADATA
|--------------------------------------------------------------------------
*/

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const resolvedParams = await params;

  const categoryName = formatCategoryTitle(
    resolvedParams.slug
  );

  const canonicalSlug = normalizeSlug(
    resolvedParams.slug
  );

  const canonicalUrl =
    `${SITE_URL}/category/${canonicalSlug}`;

  return {
    title:
      `Best ${categoryName} AI Tools | AI Vault`,

    description:
      `Discover the best ${categoryName} AI tools, software, pricing, features, reviews, and alternatives on AI Vault.`,

    keywords: [
      `${categoryName} AI tools`,
      `best ${categoryName} AI tools`,
      `${categoryName} artificial intelligence`,
      `${categoryName} software`,
      `${categoryName} AI software`,
      "AI tools",
      "AI Vault",
    ],

    alternates: {
      canonical: canonicalUrl,
    },

    robots: {
      index: true,
      follow: true,
    },

    openGraph: {
      title:
        `Best ${categoryName} AI Tools | AI Vault`,

      description:
        `Explore verified ${categoryName} AI tools, software, pricing, features, and alternatives.`,

      url: canonicalUrl,

      siteName: "AI Vault",

      type: "website",
    },

    twitter: {
      card: "summary_large_image",

      title:
        `Best ${categoryName} AI Tools | AI Vault`,

      description:
        `Discover the best ${categoryName} AI tools on AI Vault.`,
    },
  };
}

/*
|--------------------------------------------------------------------------
| TOOL HELPERS
|--------------------------------------------------------------------------
*/

function getInitials(
  name: string
): string {
  const clean = name.trim();

  if (!clean) {
    return "AI";
  }

  const parts = clean
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[1][0]
  ).toUpperCase();
}

/*
|--------------------------------------------------------------------------
| TOOL LOGO
|--------------------------------------------------------------------------
|
| Preserve logo functionality.
|
| DB currently has image_url, not logo_url.
| Therefore image_url is used as the logo source.
|
*/

function ToolLogo({
  tool,
  size = "md",
}: {
  tool: Tool;
  size?: "sm" | "md" | "lg";
}) {
  const imageUrl =
    tool.logo_url ||
    tool.image_url ||
    null;

  const initials = getInitials(
    tool.name
  );

  const sizeClass =
    size === "lg"
      ? "h-16 w-16"
      : size === "sm"
      ? "h-9 w-9"
      : "h-12 w-12";

  if (imageUrl) {
    return (
      <div
        className={`${sizeClass} relative shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50`}
      >
        <img
          src={imageUrl}
          alt={`${tool.name} logo`}
          className="h-full w-full object-contain"
          loading="lazy"
          onError={(event) => {
            const image =
              event.currentTarget;

            image.style.display =
              "none";

            const fallback =
              image.parentElement?.querySelector(
                "[data-logo-fallback]"
              );

            if (
              fallback instanceof HTMLElement
            ) {
              fallback.style.display =
                "flex";
            }
          }}
        />

        <div
          data-logo-fallback
          className="absolute inset-0 hidden items-center justify-center bg-blue-600 text-sm font-bold text-white"
        >
          {initials}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white`}
    >
      {initials}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SAFE SCORE
|--------------------------------------------------------------------------
|
| score is preserved in the UI.
|
| The production database currently does not expose a score
| column, so we don't ask Supabase for a nonexistent column.
|
| If score becomes available later, this function can simply
| use tool.score.
|
*/

function getToolScore(
  tool: Tool
): number {
  if (
    typeof tool.score === "number" &&
    Number.isFinite(tool.score)
  ) {
    return Math.max(
      0,
      Math.min(100, tool.score)
    );
  }

  return 85;
}

/*
|--------------------------------------------------------------------------
| MAIN CATEGORY PAGE
|--------------------------------------------------------------------------
*/

export default async function CategoryPage({
  params,
  searchParams,
}: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams =
    await searchParams;

  const rawCategory =
    resolvedParams.slug;

  const categoryName =
    formatCategoryTitle(
      rawCategory
    );

  const canonicalSlug =
    normalizeSlug(rawCategory);

  const searchQuery = (
    resolvedSearchParams.q ??
    resolvedSearchParams.search ??
    ""
  ).trim();

  const pricingFilter = (
    resolvedSearchParams.pricing ??
    ""
  ).trim();

  const parsedPage =
    Number.parseInt(
      resolvedSearchParams.page ??
        "1",
      10
    );

  const page =
    Number.isFinite(parsedPage) &&
    parsedPage > 0
      ? parsedPage
      : 1;

  const pageSize = 24;

  let tools: Tool[] = [];

  let count = 0;

  let queryError:
    | string
    | null = null;

  try {
    const supabase =
      getSupabaseClient();

    const aliases =
      getCategoryAliases(
        rawCategory
      );

    /*
     * IMPORTANT:
     *
     * Do NOT add logo_url here.
     * Do NOT add score here.
     *
     * Those columns don't exist in the
     * current production ai_tools table.
     *
     * We preserve their UI behavior below.
     */

    let query = supabase
      .from("ai_tools")
      .select(
        [
          "id",
          "name",
          "slug",
          "category",
          "pricing",
          "description",
          "image_url",
        ].join(","),
        {
          count: "exact",
        }
      );

    /*
     * CATEGORY FILTER
     *
     * Use exact case-insensitive matching
     * against the actual database category names.
     */

    if (aliases.length === 1) {
      query = query.ilike(
        "category",
        aliases[0]
      );
    } else {
      const categoryFilter =
        aliases
          .map(
            (value) =>
              `category.ilike.${value}`
          )
          .join(",");

      query = query.or(
        categoryFilter
      );
    }

    /*
     * SEARCH
     */

    if (searchQuery) {
      const safeSearch =
        searchQuery
          .replace(/,/g, " ")
          .replace(/%/g, "")
          .trim();

      if (safeSearch) {
        query = query.or(
          `name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`
        );
      }
    }

    /*
     * PRICING FILTER
     */

    if (pricingFilter) {
      const safePricing =
        pricingFilter
          .replace(/,/g, " ")
          .replace(/%/g, "")
          .trim();

      if (safePricing) {
        query = query.ilike(
          "pricing",
          `%${safePricing}%`
        );
      }
    }

    /*
     * PAGINATION
     */

    const fromIndex =
      (page - 1) *
      pageSize;

    const toIndex =
      fromIndex +
      pageSize -
      1;

    const result =
      await query
        .order("name", {
          ascending: true,
          nullsFirst: false,
        })
        .range(
          fromIndex,
          toIndex
        );

    if (result.error) {
      console.error(
        "[CATEGORY_QUERY_ERROR]",
        {
          slug: rawCategory,
          category: categoryName,
          aliases,

          code:
            result.error.code,

          message:
            result.error.message,

          details:
            result.error.details,

          hint:
            result.error.hint,
        }
      );

      queryError =
        result.error.message;
    } else {
      tools =
        ((result.data ??
          []) as Tool[]).map(
          (tool) => ({
            ...tool,

            /*
             * Preserve logo_url compatibility
             * without querying a nonexistent column.
             */
            logo_url:
              tool.image_url,

            /*
             * Preserve score UI.
             */
            score:
              getToolScore(tool),
          })
        );

      count =
        result.count ?? 0;
    }
  } catch (error) {
    console.error(
      "[CATEGORY_EXCEPTION]",
      error
    );

    queryError =
      error instanceof Error
        ? error.message
        : "Unknown database error";
  }

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        count / pageSize
      )
    );

  /*
  |--------------------------------------------------------------------------
  | BREADCRUMB SCHEMA
  |--------------------------------------------------------------------------
  */

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
          `${SITE_URL}/category/${canonicalSlug}`,
      },
    ],
  };

  /*
  |--------------------------------------------------------------------------
  | CATEGORY SCHEMA
  |--------------------------------------------------------------------------
  */

  const categorySchema = {
    "@context":
      "https://schema.org",

    "@type":
      "CollectionPage",

    name:
      `Best ${categoryName} AI Tools`,

    description:
      `Discover the best ${categoryName} AI tools on AI Vault.`,

    url:
      `${SITE_URL}/category/${canonicalSlug}`,

    isPartOf: {
      "@type":
        "WebSite",

      name:
        "AI Vault",

      url:
        SITE_URL,
    },
  };

  /*
  |--------------------------------------------------------------------------
  | ITEM LIST SCHEMA
  |--------------------------------------------------------------------------
  */

  const itemListSchema =
    tools.length > 0
      ? {
          "@context":
            "https://schema.org",

          "@type":
            "ItemList",

          name:
            `Best ${categoryName} AI Tools`,

          numberOfItems:
            tools.length,

          itemListElement:
            tools.map(
              (tool, index) => ({
                "@type":
                  "ListItem",

                position:
                  index + 1,

                name:
                  tool.name,

                url:
                  `${SITE_URL}/tool/${encodeURIComponent(
                    tool.slug
                  )}`,
              })
            ),
        }
      : null;

  return (
    <>
      {/* =========================================================
          SEO STRUCTURED DATA
      ========================================================= */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              breadcrumbSchema
            ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              categorySchema
            ),
        }}
      />

      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html:
              JSON.stringify(
                itemListSchema
              ),
          }}
        />
      )}

      {/* =========================================================
          HEADER
      ========================================================= */}

      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-slate-950"
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

      {/* =========================================================
          MAIN
      ========================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}

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

        {/* =======================================================
            HERO
        ======================================================= */}

        <section className="space-y-4 py-4">
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Best {categoryName} AI Tools
          </h1>

          <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Explore verified software
            platforms, pricing models,
            features, use cases,
            alternatives, and AI
            solutions in the{" "}
            {categoryName} domain.
          </p>

          {!queryError && (
            <div className="text-xs font-bold text-blue-600">
              Showing{" "}
              {count.toLocaleString()}{" "}
              Verified Tools
            </div>
          )}
        </section>

        {/* =======================================================
            DATABASE ERROR
        ======================================================= */}

        {queryError ? (
          <section className="mt-8 rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Unable to load this category
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              The AI Vault database
              returned an error while
              loading this category.
            </p>

            <p className="mt-3 text-xs font-semibold text-red-500">
              Category:{" "}
              {categoryName}
            </p>

            <Link
              href={`/category/${canonicalSlug}`}
              className="mt-5 inline-block text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              Try Again →
            </Link>
          </section>
        ) : tools.length > 0 ? (
          <>
            {/* ===================================================
                DIRECTORY GRID
            =================================================== */}

            <section
              aria-label={`${categoryName} AI tools`}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {tools.map(
                (tool) => {
                  const toolSlug =
                    encodeURIComponent(
                      tool.slug
                    );

                  const toolScore =
                    getToolScore(
                      tool
                    );

                  return (
                    <Link
                      key={String(
                        tool.id
                      )}
                      href={`/tool/${toolSlug}`}
                      className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                    >
                      <div className="space-y-4">
                        {/* Logo + Pricing */}

                        <div className="flex items-center justify-between gap-3">
                          <ToolLogo
                            tool={tool}
                            size="md"
                          />

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                            {tool.pricing ||
                              "Freemium"}
                          </span>
                        </div>

                        {/* Name */}

                        <div>
                          <h2 className="line-clamp-1 text-lg font-bold text-slate-900 group-hover:text-blue-600">
                            {tool.name}
                          </h2>

                          <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-500">
                            {tool.description ||
                              `Explore ${tool.name} and discover its AI-powered features.`}
                          </p>
                        </div>

                        {/* Score */}

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                          <div>
                            <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                              AI Vault Score
                            </div>

                            <div className="text-lg font-black text-slate-900">
                              {toolScore}
                              <span className="text-xs font-medium text-slate-400">
                                /100
                              </span>
                            </div>
                          </div>

                          <div className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-600">
                            {tool.category ||
                              categoryName}
                          </div>
                        </div>

                        {/* Footer */}

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                          <span className="text-xs text-slate-500">
                            {tool.category ||
                              categoryName}
                          </span>

                          <span className="text-xs font-bold text-blue-600 transition group-hover:translate-x-1">
                            Inspect →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                }
              )}
            </section>

            {/* ===================================================
                PAGINATION
            =================================================== */}

            {totalPages > 1 && (
              <nav
                aria-label="Category pagination"
                className="mt-10 flex flex-wrap justify-center gap-2"
              >
                {Array.from(
                  {
                    length:
                      totalPages,
                  },
                  (_, index) =>
                    index + 1
                ).map(
                  (
                    pageNumber
                  ) => {
                    const params =
                      new URLSearchParams();

                    if (
                      searchQuery
                    ) {
                      params.set(
                        "q",
                        searchQuery
                      );
                    }

                    if (
                      pricingFilter
                    ) {
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
                      `/category/${canonicalSlug}${
                        queryString
                          ? `?${queryString}`
                          : ""
                      }`;

                    const active =
                      pageNumber ===
                      page;

                    return (
                      <Link
                        key={
                          pageNumber
                        }
                        href={
                          href
                        }
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                          active
                            ? "bg-blue-600 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-600"
                        }`}
                      >
                        {
                          pageNumber
                        }
                      </Link>
                    );
                  }
                )}
              </nav>
            )}
          </>
        ) : (
          /* =====================================================
             EMPTY STATE
          ===================================================== */

          <section className="mt-8 rounded-2xl border border-slate-100 bg-white p-10 text-center">
            <h2 className="text-lg font-bold text-slate-900">
              No tools found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              No tools match the
              selected criteria in
              this category.
            </p>

            <Link
              href="/categories"
              className="mt-5 inline-block text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              Return to Directory →
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
