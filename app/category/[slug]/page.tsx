import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

import ToolLogo from "@/components/ToolLogo";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    q?: string;
    search?: string;
    pricing?: string;
    page?: string;
  }>;
};

type ToolRecord = {
  id: string | number;
  name: string;
  slug: string;
  category?: string | null;
  pricing?: string | null;
  description?: string | null;
  image_url?: string | null;
  logo_url?: string | null;
  score?: number | string | null;
};

function getSupabaseClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function formatCategoryTitle(slug: string): string {
  const decoded = decodeURIComponent(slug || "")
    .replace(/[-_]+/g, " ")
    .trim();

  if (!decoded) return "AI Tools";

  return decoded
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 3) {
        return word.toUpperCase();
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function normalizeSlug(value: string): string {
  return decodeURIComponent(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function getCategoryAliases(rawCategory: string, categoryName: string) {
  const key = rawCategory.trim().toLowerCase();

  const categoryAliases: Record<string, string[]> = {
    productivity: [
      "productivity",
      "productivity tools",
      "productivity software",
    ],

    marketing: [
      "marketing",
      "marketing & sales",
      "marketing and sales",
    ],

    coding: [
      "coding",
      "developer",
      "development",
      "developer tools",
    ],

    chatbot: [
      "chatbot",
      "chatbots",
      "chat",
      "conversational ai",
    ],

    "video-gen": [
      "video gen",
      "video",
      "video generation",
      "video editing",
    ],

    video: [
      "video",
      "video gen",
      "video generation",
      "video editing",
    ],

    "image-gen": [
      "image gen",
      "image",
      "images",
      "image generation",
    ],

    image: [
      "image",
      "images",
      "image gen",
      "image generation",
    ],

    writing: [
      "writing",
      "copywriting",
      "content writing",
    ],

    design: [
      "design",
      "graphic design",
    ],

    business: [
      "business",
    ],

    education: [
      "education",
      "learning",
    ],

    research: [
      "research",
    ],

    seo: [
      "seo",
      "search engine optimization",
    ],

    audio: [
      "audio",
      "music",
    ],
  };

  return (
    categoryAliases[key] || [
      rawCategory,
      categoryName,
    ]
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;

  const rawCategory = decodeURIComponent(resolvedParams.slug || "");
  const categoryName = formatCategoryTitle(rawCategory);

  const canonicalUrl = `${SITE_URL}/category/${encodeURIComponent(
    rawCategory
  )}`;

  return {
    title: `Best ${categoryName} AI Tools | AI Vault`,
    description: `Discover and compare the best ${categoryName} AI tools, software, pricing models, features, reviews and alternatives on AI Vault.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Best ${categoryName} AI Tools | AI Vault`,
      description: `Explore verified ${categoryName} AI tools, software, pricing and alternatives.`,
      url: canonicalUrl,
      siteName: "AI Vault",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Best ${categoryName} AI Tools | AI Vault`,
      description: `Explore the best ${categoryName} AI tools on AI Vault.`,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const rawCategory = decodeURIComponent(resolvedParams.slug || "");
  const categoryName = formatCategoryTitle(rawCategory);

  const searchQuery = (
    resolvedSearchParams.q ||
    resolvedSearchParams.search ||
    ""
  ).trim();

  const pricingFilter = (
    resolvedSearchParams.pricing || ""
  ).trim();

  const parsedPage = Number.parseInt(
    resolvedSearchParams.page || "1",
    10
  );

  const page =
    Number.isFinite(parsedPage) && parsedPage > 0
      ? parsedPage
      : 1;

  const pageSize = 24;

  const supabase = getSupabaseClient();

  /*
   * ============================================================
   * DATABASE
   * ============================================================
   */

  if (!supabase) {
    return (
      <CategoryError
        categoryName={categoryName}
        message="The AI Vault database configuration is missing."
      />
    );
  }

  const aliases = getCategoryAliases(
    rawCategory,
    categoryName
  );

  /*
   * IMPORTANT:
   * We use category aliases instead of assuming that the URL title
   * exactly matches the database value.
   *
   * Example:
   * /category/Productivity
   *
   * can match:
   * Productivity
   * productivity
   * Productivity Tools
   */

  const categoryFilter = aliases
    .filter(Boolean)
    .map(
      (value) =>
        `category.ilike.%${value.replace(/[%_,]/g, "")}%`
    )
    .join(",");

  /*
   * ============================================================
   * QUERY
   * ============================================================
   */

  let query = supabase
    .from("ai_tools")
    .select(
      "id,name,slug,category,pricing,description,image_url,logo_url,score",
      {
        count: "exact",
      }
    );

  if (categoryFilter) {
    query = query.or(categoryFilter);
  } else {
    query = query.ilike("category", `%${categoryName}%`);
  }

  if (searchQuery) {
    const safeSearch = searchQuery.replace(/[%_,]/g, "");

    query = query.or(
      `name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`
    );
  }

  if (pricingFilter) {
    const safePricing = pricingFilter.replace(/[%_,]/g, "");

    query = query.ilike(
      "pricing",
      `%${safePricing}%`
    );
  }

  const fromIndex = (page - 1) * pageSize;
  const toIndex = fromIndex + pageSize - 1;

  const result = await query
    .range(fromIndex, toIndex)
    .order("score", {
      ascending: false,
      nullsFirst: false,
    })
    .order("name", {
      ascending: true,
    });

  const tools = (result.data || []) as ToolRecord[];
  const count = result.count || 0;
  const error = result.error;

  /*
   * ============================================================
   * DATABASE ERROR
   * ============================================================
   *
   * NEVER throw the Supabase error from this page.
   * Otherwise a category request becomes a generic Vercel 500.
   */

  if (error) {
    console.error("[CATEGORY_DATABASE_ERROR]", {
      category: categoryName,
      slug: rawCategory,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    return (
      <CategoryError
        categoryName={categoryName}
        message="The AI Vault database returned an error while loading this category."
      />
    );
  }

  const totalPages = Math.max(
    1,
    Math.ceil(count / pageSize)
  );

  /*
   * ============================================================
   * BREADCRUMB SEO
   * ============================================================
   */

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
        name: categoryName,
        item: `${SITE_URL}/category/${encodeURIComponent(
          rawCategory
        )}`,
      },
    ],
  };

  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <div className="min-h-screen bg-white text-slate-950">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-slate-950"
            >
              AI Vault
            </Link>

            <Link
              href="/categories"
              className="rounded-full bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-700 transition hover:bg-slate-100"
            >
              Browse All Categories
            </Link>

          </div>
        </header>

        {/* =====================================================
            MAIN
        ====================================================== */}

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Breadcrumb */}

          <nav
            aria-label="Breadcrumb"
            className="mb-6 text-xs"
          >
            <ol className="flex flex-wrap items-center gap-2 text-slate-400">
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
          ================================================== */}

          <section className="space-y-4 py-2">

            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Best {categoryName} AI Tools
            </h1>

            <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Explore verified software platforms, pricing models,
              features, reviews, and alternatives in the{" "}
              {categoryName} domain.
            </p>

            <div className="text-xs font-bold text-blue-600">
              Showing {count} Verified Tools
            </div>

          </section>

          {/* =================================================
              FILTERS
          ================================================== */}

          <section className="mt-8 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">

            <form
              method="GET"
              className="grid gap-3 sm:grid-cols-[1fr_200px_auto]"
            >

              <input
                type="search"
                name="q"
                defaultValue={searchQuery}
                placeholder={`Search ${categoryName} tools...`}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <select
                name="pricing"
                defaultValue={pricingFilter}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  All Pricing
                </option>
                <option value="Free">
                  Free
                </option>
                <option value="Freemium">
                  Freemium
                </option>
                <option value="Paid">
                  Paid
                </option>
                <option value="Free Trial">
                  Free Trial
                </option>
              </select>

              <button
                type="submit"
                className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Search
              </button>

            </form>

          </section>

          {/* =================================================
              DIRECTORY
          ================================================== */}

          <section className="mt-8">

            {tools.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

                {tools.map((tool) => {

                  const toolSlug =
                    typeof tool.slug === "string"
                      ? tool.slug.trim()
                      : "";

                  const toolName =
                    tool.name?.trim() ||
                    "AI Tool";

                  const toolDescription =
                    tool.description?.trim() ||
                    "Explore this AI tool and discover its features, pricing, integrations, and alternatives.";

                  const score =
                    tool.score === null ||
                    tool.score === undefined ||
                    tool.score === ""
                      ? null
                      : Number(tool.score);

                  const validScore =
                    score !== null &&
                    Number.isFinite(score)
                      ? score
                      : null;

                  const logoUrl =
                    typeof tool.logo_url === "string" &&
                    tool.logo_url.trim()
                      ? tool.logo_url.trim()
                      : null;

                  const imageUrl =
                    typeof tool.image_url === "string" &&
                    tool.image_url.trim()
                      ? tool.image_url.trim()
                      : null;

                  return (
                    <Link
                      key={String(tool.id || toolSlug || toolName)}
                      href={
                        toolSlug
                          ? `/tool/${encodeURIComponent(toolSlug)}`
                          : "#"
                      }
                      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                    >

                      <div className="flex items-start justify-between gap-4">

                        {/* REAL LOGO
                            No onError here.
                            ToolLogo handles it internally.
                        */}

                        <ToolLogo
                          src={logoUrl}
                          fallbackSrc={imageUrl}
                          name={toolName}
                          size="md"
                        />

                        <div className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
                          {tool.pricing || "Free"}
                        </div>

                      </div>

                      <div className="mt-5">

                        <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600">
                          {toolName}
                        </h2>

                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                          {toolDescription}
                        </p>

                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                        <span className="text-xs font-medium text-slate-500">
                          {tool.category || categoryName}
                        </span>

                        {validScore !== null ? (
                          <span className="text-xs font-bold text-blue-600">
                            {validScore}
                            <span className="font-normal text-slate-400">
                              /10
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-blue-600">
                            Inspect →
                          </span>
                        )}

                      </div>

                    </Link>
                  );
                })}

              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">

                <h2 className="text-lg font-bold text-slate-900">
                  No tools found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  No AI tools match the selected criteria in
                  this category.
                </p>

                <Link
                  href={`/category/${encodeURIComponent(
                    rawCategory
                  )}`}
                  className="mt-5 inline-block text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                  Clear Filters →
                </Link>

              </div>
            )}

          </section>

          {/* =================================================
              PAGINATION
          ================================================== */}

          {totalPages > 1 && (
            <nav
              aria-label="Category pagination"
              className="mt-10 flex flex-wrap justify-center gap-2"
            >

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((pageNumber) => {

                const isCurrent =
                  pageNumber === page;

                const params = new URLSearchParams();

                if (searchQuery) {
                  params.set("q", searchQuery);
                }

                if (pricingFilter) {
                  params.set(
                    "pricing",
                    pricingFilter
                  );
                }

                if (pageNumber > 1) {
                  params.set(
                    "page",
                    String(pageNumber)
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

                return (
                  <Link
                    key={pageNumber}
                    href={href}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                      isCurrent
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {pageNumber}
                  </Link>
                );
              })}

            </nav>
          )}

        </main>
      </div>
    </>
  );
}

/*
 * ============================================================
 * ERROR UI
 * ============================================================
 */

function CategoryError({
  categoryName,
  message,
}: {
  categoryName: string;
  message: string;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-950">

      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          <Link
            href="/"
            className="text-xl font-bold"
          >
            AI Vault
          </Link>

          <Link
            href="/categories"
            className="rounded-full bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wide"
          >
            Browse All Categories
          </Link>

        </div>
      </header>

      <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4">

        <div className="w-full rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">

          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            !
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Unable to load this category
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
            {message}
          </p>

          <p className="mt-3 text-xs font-semibold text-red-600">
            Category: {categoryName}
          </p>

          <Link
            href="/categories"
            className="mt-6 inline-block rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Browse Categories →
          </Link>

        </div>

      </main>
    </div>
  );
}
