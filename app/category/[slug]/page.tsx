import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ToolLogo } from "@/components/ToolLogo";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    q?: string;
    pricing?: string;
    page?: string;
  }>;
};

type Tool = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  pricing: string | null;
  description: string | null;
  image_url?: string | null;
  logo_url?: string | null;
  score?: number | null;
};

function getSupabaseClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Convert URL slug into human readable category.
 *
 * productivity -> Productivity
 * marketing -> Marketing
 * video-gen -> Video Gen
 * image-gen -> Image Gen
 */
function formatCategoryTitle(rawSlug: string): string {
  const decoded = decodeURIComponent(rawSlug || "")
    .replace(/[-_]+/g, " ")
    .trim();

  if (!decoded) {
    return "";
  }

  return decoded
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (word.toLowerCase() === "ai") return "AI";
      if (word.toLowerCase() === "seo") return "SEO";
      if (word.toLowerCase() === "api") return "API";

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Metadata for category pages.
 */
export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const resolvedParams = await params;

  const rawCategory = resolvedParams.slug;
  const categoryName = formatCategoryTitle(rawCategory);

  if (!categoryName) {
    return {
      title: "AI Tools Directory | AI Vault",
      description:
        "Discover and compare verified AI tools, software, pricing, features, and alternatives on AI Vault.",
    };
  }

  const canonicalUrl = `${SITE_URL}/category/${encodeURIComponent(
    rawCategory
  )}`;

  return {
    title: `Best ${categoryName} AI Tools & Software Directory | AI Vault`,
    description: `Discover and compare the best ${categoryName} AI tools, software platforms, pricing, features, and alternatives on AI Vault.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Best ${categoryName} AI Tools | AI Vault`,
      description: `Explore curated ${categoryName} software tools on AI Vault.`,
      url: canonicalUrl,
      siteName: "AI Vault",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Best ${categoryName} AI Tools | AI Vault`,
      description: `Explore curated ${categoryName} software tools on AI Vault.`,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const rawCategory = decodeURIComponent(resolvedParams.slug || "").trim();

  if (!rawCategory) {
    notFound();
  }

  const categoryName = formatCategoryTitle(rawCategory);

  if (!categoryName) {
    notFound();
  }

  const searchQuery = (resolvedSearchParams.q || "").trim();
  const pricingFilter = (resolvedSearchParams.pricing || "").trim();

  const parsedPage = Number.parseInt(
    resolvedSearchParams.page || "1",
    10
  );

  const page =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const pageSize = 24;

  const supabase = getSupabaseClient();

  /**
   * If Supabase is not configured, don't silently render
   * a fake empty category page.
   */
  if (!supabase) {
    console.error(
      "[CATEGORY_CRITICAL] Missing Supabase environment variables."
    );

    return (
      <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-950 font-serif">
                AI Vault<span className="text-blue-600">.</span>
              </span>
            </Link>

            <Link
              href="/"
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 rounded-full hover:bg-slate-200 transition"
            >
              Browse All Categories
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="p-10 text-center bg-white border border-red-100 rounded-3xl">
            <h1 className="text-xl font-bold text-slate-900">
              Category temporarily unavailable
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              The AI Vault database configuration is currently unavailable.
            </p>

            <Link
              href="/"
              className="inline-block mt-6 text-sm font-bold text-blue-600 hover:underline"
            >
              Return to Directory →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  /**
   * ============================================================
   * CATEGORY QUERY
   * ============================================================
   *
   * IMPORTANT:
   *
   * Database values are:
   *
   * Productivity
   * Marketing
   * Coding
   * Chatbot
   * Video Gen
   * Image Gen
   *
   * Therefore we use case-insensitive exact matching:
   *
   * .ilike("category", categoryName)
   *
   * Example:
   *
   * /category/productivity
   *       ↓
   * Productivity
   *       ↓
   * database category = Productivity
   *
   * This avoids the previous category-filter problem.
   */

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
    .ilike("category", categoryName);

  /**
   * Optional search.
   */
  if (searchQuery) {
    query = query.or(
      `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
    );
  }

  /**
   * Optional pricing filter.
   */
  if (pricingFilter) {
    query = query.ilike("pricing", `%${pricingFilter}%`);
  }

  /**
   * Pagination.
   */
  const fromIndex = (page - 1) * pageSize;
  const toIndex = fromIndex + pageSize - 1;

  const {
    data: tools,
    count,
    error,
  } = await query
    .order("score", {
      ascending: false,
      nullsFirst: false,
    })
    .order("name", {
      ascending: true,
    })
    .range(fromIndex, toIndex);

  /**
   * IMPORTANT:
   * Never turn a database error into a fake "No tools found".
   */
  if (error) {
    console.error("[CATEGORY_QUERY_ERROR]", {
      category: categoryName,
      slug: rawCategory,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    return (
      <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-950 font-serif">
                AI Vault<span className="text-blue-600">.</span>
              </span>
            </Link>

            <Link
              href="/"
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 rounded-full hover:bg-slate-200 transition"
            >
              Browse All Categories
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="p-10 text-center bg-white border border-red-100 rounded-3xl">
            <h1 className="text-xl font-bold text-slate-900">
              Unable to load this category
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              There was a temporary problem loading the AI tools.
            </p>

            <Link
              href={`/category/${encodeURIComponent(rawCategory)}`}
              className="inline-block mt-6 text-sm font-bold text-blue-600 hover:underline"
            >
              Try Again →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const safeTools: Tool[] = Array.isArray(tools) ? tools : [];

  const totalTools = count || 0;

  const totalPages =
    totalTools > 0 ? Math.ceil(totalTools / pageSize) : 1;

  /**
   * If someone manually opens page 999,
   * don't show a broken pagination state.
   */
  const currentPage =
    page > totalPages && totalTools > 0 ? totalPages : page;

  /**
   * Breadcrumb JSON-LD.
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
        item: `${SITE_URL}/category/${rawCategory}`,
      },
    ],
  };

  /**
   * CollectionPage structured data.
   */
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Best ${categoryName} AI Tools`,
    description: `Explore the best ${categoryName} AI tools and software on AI Vault.`,
    url: `${SITE_URL}/category/${rawCategory}`,
    isPartOf: {
      "@type": "WebSite",
      name: "AI Vault",
      url: SITE_URL,
    },
  };

  /**
   * Build pagination URL while preserving search/filter params.
   */
  function getPageUrl(targetPage: number) {
    const params = new URLSearchParams();

    if (searchQuery) {
      params.set("q", searchQuery);
    }

    if (pricingFilter) {
      params.set("pricing", pricingFilter);
    }

    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }

    const queryString = params.toString();

    return `/category/${encodeURIComponent(rawCategory)}${
      queryString ? `?${queryString}` : ""
    }`;
  }

  return (
    <>
      {/* ======================================================
          STRUCTURED DATA
      ====================================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />

      <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">

            <Link
              href="/"
              className="flex items-center gap-2 shrink-0"
            >
              <span className="text-2xl font-black tracking-tight text-slate-950 font-serif">
                AI Vault<span className="text-blue-600">.</span>
              </span>
            </Link>

            <Link
              href="/"
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 rounded-full hover:bg-slate-200 transition"
            >
              Browse All Categories
            </Link>

          </div>
        </header>

        {/* ====================================================
            MAIN
        ==================================================== */}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">

          {/* ==================================================
              BREADCRUMB
          ================================================== */}

          <nav
            aria-label="Breadcrumb"
            className="text-xs font-semibold text-slate-400 mb-8"
          >
            <ol className="flex items-center gap-2 flex-wrap">

              <li>
                <Link
                  href="/"
                  className="hover:text-blue-600 transition"
                >
                  Home
                </Link>
              </li>

              <li aria-hidden="true">/</li>

              <li className="text-slate-900 font-bold">
                {categoryName}
              </li>

            </ol>
          </nav>

          {/* ==================================================
              HERO
          ================================================== */}

          <div className="space-y-4">

            <h1 className="text-3xl sm:text-5xl font-black text-slate-950 font-serif tracking-tight">
              Best {categoryName} AI Tools
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              Explore verified software platforms, pricing models,
              features, and alternatives in the {categoryName} domain.
            </p>

            <div className="text-xs font-bold text-blue-600">
              Showing {totalTools} {totalTools === 1 ? "Tool" : "Tools"}
            </div>

          </div>

          {/* ==================================================
              FILTER BAR
          ================================================== */}

          <div className="mt-8 p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">

            <form
              method="GET"
              className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3"
            >

              <input
                type="search"
                name="q"
                defaultValue={searchQuery}
                placeholder={`Search ${categoryName} tools...`}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <select
                name="pricing"
                defaultValue={pricingFilter}
                className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-500"
              >
                <option value="">All Pricing</option>
                <option value="Free">Free</option>
                <option value="Freemium">Freemium</option>
                <option value="Paid">Paid</option>
                <option value="Free Trial">Free Trial</option>
              </select>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition"
              >
                Search
              </button>

            </form>

          </div>

          {/* ==================================================
              DIRECTORY
          ================================================== */}

          <section className="mt-10">

            {safeTools.length > 0 ? (

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {safeTools.map((tool) => (

                  <Link
                    key={tool.id || tool.slug}
                    href={`/tool/${encodeURIComponent(tool.slug)}`}
                    className="group bg-white border border-slate-100 hover:border-blue-200 rounded-3xl p-6 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between"
                  >

                    <div className="space-y-5">

                      {/* Tool top row */}

                      <div className="flex items-center justify-between gap-3">

                        <ToolLogo
                          tool={tool}
                          size="md"
                        />

                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700">
                          {tool.pricing || "Freemium"}
                        </span>

                      </div>

                      {/* Name / description */}

                      <div>

                        <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {tool.name}
                        </h2>

                        <p className="text-xs text-slate-500 line-clamp-3 mt-2 leading-relaxed">
                          {tool.description ||
                            `${tool.name} overview and details.`}
                        </p>

                      </div>

                    </div>

                    {/* Bottom row */}

                    <div className="pt-5 mt-5 border-t border-slate-50 flex items-center justify-between text-xs font-semibold">

                      <span className="text-slate-400">
                        {tool.category || categoryName}
                      </span>

                      <span className="text-blue-600 group-hover:translate-x-1 transition-transform">
                        Inspect →
                      </span>

                    </div>

                  </Link>

                ))}

              </div>

            ) : (

              /* =================================================
                 EMPTY STATE
                 ================================================= */

              <div className="p-12 text-center bg-white border border-slate-100 rounded-3xl">

                <h2 className="text-lg font-bold text-slate-900">
                  No tools found
                </h2>

                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                  No tools match the selected criteria in this
                  category.
                </p>

                <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">

                  <Link
                    href={`/category/${encodeURIComponent(rawCategory)}`}
                    className="inline-block text-xs font-bold text-blue-600 hover:underline"
                  >
                    Clear Filters
                  </Link>

                  <span className="text-slate-300">•</span>

                  <Link
                    href="/"
                    className="inline-block text-xs font-bold text-blue-600 hover:underline"
                  >
                    Return to Directory →
                  </Link>

                </div>

              </div>

            )}

          </section>

          {/* ==================================================
              PAGINATION
          ================================================== */}

          {totalPages > 1 && (

            <nav
              aria-label="Pagination"
              className="flex justify-center items-center gap-2 pt-10"
            >

              {/* Previous */}

              {currentPage > 1 ? (

                <Link
                  href={getPageUrl(currentPage - 1)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-100 bg-white text-slate-700 hover:bg-slate-50"
                >
                  ← Previous
                </Link>

              ) : (

                <span className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-100 bg-slate-50 text-slate-300">
                  ← Previous
                </span>

              )}

              {/* Page numbers */}

              <div className="flex items-center gap-2">

                {Array.from(
                  { length: Math.min(totalPages, 7) },
                  (_, index) => {

                    let pageNumber: number;

                    if (totalPages <= 7) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 4) {
                      pageNumber = index + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNumber = totalPages - 6 + index;
                    } else {
                      pageNumber = currentPage - 3 + index;
                    }

                    return (
                      <Link
                        key={pageNumber}
                        href={getPageUrl(pageNumber)}
                        aria-current={
                          pageNumber === currentPage
                            ? "page"
                            : undefined
                        }
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                          pageNumber === currentPage
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-slate-100 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {pageNumber}
                      </Link>
                    );
                  }
                )}

              </div>

              {/* Next */}

              {currentPage < totalPages ? (

                <Link
                  href={getPageUrl(currentPage + 1)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-100 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Next →
                </Link>

              ) : (

                <span className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-100 bg-slate-50 text-slate-300">
                  Next →
                </span>

              )}

            </nav>

          )}

          {/* ==================================================
              SEO FOOTER CONTENT
          ================================================== */}

          <section className="mt-16 pt-10 border-t border-slate-100">

            <h2 className="text-2xl font-bold text-slate-900 font-serif">
              {categoryName} AI Tools Directory
            </h2>

            <p className="mt-4 text-sm text-slate-600 max-w-3xl leading-7">
              AI Vault helps you discover and compare
              {` ${categoryName}`} AI tools and software.
              Explore tool features, pricing models, use cases,
              limitations, and alternatives to find the right
              software for your workflow.
            </p>

          </section>

        </main>

      </div>
    </>
  );
}
