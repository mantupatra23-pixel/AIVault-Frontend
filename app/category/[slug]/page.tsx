import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ToolLogo } from "@/components/ToolLogo";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
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
  image_url: string | null;
  logo_url: string | null;
  score: number | null;
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

function formatCategoryTitle(rawSlug: string): string {
  const decoded = decodeURIComponent(rawSlug || "")
    .replace(/[-_]+/g, " ")
    .trim();

  if (!decoded) return "AI Tools";

  return decoded.charAt(0).toUpperCase() + decoded.slice(1);
}

/*
|--------------------------------------------------------------------------
| CATEGORY ALIASES
|--------------------------------------------------------------------------
| Database category values may not exactly match the URL slug.
|
| Example:
| /category/marketing
|
| Database may contain:
| Marketing
| marketing
| Marketing & Sales
| Marketing and Sales
|
| All of these are supported.
|--------------------------------------------------------------------------
*/

const categoryAliases: Record<string, string[]> = {
  marketing: [
    "marketing",
    "marketing & sales",
    "marketing and sales",
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

  video: [
    "video",
    "video editing",
  ],

  productivity: [
    "productivity",
  ],

  business: [
    "business",
  ],

  education: [
    "education",
  ],

  coding: [
    "coding",
    "developer",
    "development",
  ],

  image: [
    "image",
    "images",
  ],

  audio: [
    "audio",
    "music",
  ],

  research: [
    "research",
  ],

  seo: [
    "seo",
    "search engine optimization",
  ],

  social: [
    "social",
    "social media",
  ],

  finance: [
    "finance",
    "financial",
  ],

  legal: [
    "legal",
  ],

  healthcare: [
    "healthcare",
    "health",
  ],

  customer: [
    "customer",
    "customer support",
  ],

  sales: [
    "sales",
  ],
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const resolvedParams = await params;

  const categoryName = formatCategoryTitle(resolvedParams.slug);

  return {
    title: `Best ${categoryName} AI Tools & Software Directory | AI Vault`,

    description:
      `Discover and compare top ${categoryName} software, AI tools, features, pricing, and alternatives on AI Vault.`,

    alternates: {
      canonical: `${SITE_URL}/category/${resolvedParams.slug}`,
    },

    openGraph: {
      title: `Best ${categoryName} AI Tools | AI Vault`,
      description:
        `Explore curated ${categoryName} software tools on AI Vault.`,
      url: `${SITE_URL}/category/${resolvedParams.slug}`,
      siteName: "AI Vault",
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  /*
  |--------------------------------------------------------------------------
  | URL PARAMETERS
  |--------------------------------------------------------------------------
  */

  const rawCategory = decodeURIComponent(
    resolvedParams.slug || ""
  ).trim();

  if (!rawCategory) {
    notFound();
  }

  const categoryName = formatCategoryTitle(rawCategory);

  const searchQuery =
    resolvedSearchParams.q?.trim() || "";

  const pricingFilter =
    resolvedSearchParams.pricing?.trim() || "";

  const requestedPage =
    parseInt(resolvedSearchParams.page || "1", 10);

  const page =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const pageSize = 24;

  /*
  |--------------------------------------------------------------------------
  | SUPABASE
  |--------------------------------------------------------------------------
  */

  const supabase = getSupabaseClient();

  if (!supabase) {
    notFound();
  }

  /*
  |--------------------------------------------------------------------------
  | CATEGORY FILTER
  |--------------------------------------------------------------------------
  */

  const normalizedSlug = rawCategory
    .toLowerCase()
    .replace(/\s+/g, "-");

  const aliases =
    categoryAliases[normalizedSlug] || [
      rawCategory,
      categoryName,
    ];

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  | Build a PostgREST OR filter:
  |
  | category.ilike.%marketing%,
  | category.ilike.%marketing & sales%,
  | category.ilike.%marketing and sales%
  |
  | This fixes the previous "0 Verified Tools" problem.
  |--------------------------------------------------------------------------
  */

  const categoryFilter = aliases
    .filter(Boolean)
    .map(
      (value) =>
        `category.ilike.%${value
          .replace(/,/g, "")
          .replace(/%/g, "")}%`
    )
    .join(",");

  /*
  |--------------------------------------------------------------------------
  | DATABASE QUERY
  |--------------------------------------------------------------------------
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
    .or(categoryFilter);

  /*
  |--------------------------------------------------------------------------
  | SEARCH FILTER
  |--------------------------------------------------------------------------
  */

  if (searchQuery) {
    const cleanSearch = searchQuery
      .replace(/,/g, "")
      .replace(/%/g, "");

    query = query.or(
      `name.ilike.%${cleanSearch}%,description.ilike.%${cleanSearch}%`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PRICING FILTER
  |--------------------------------------------------------------------------
  */

  if (pricingFilter) {
    const cleanPricing = pricingFilter
      .replace(/,/g, "")
      .replace(/%/g, "");

    query = query.ilike(
      "pricing",
      `%${cleanPricing}%`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const fromIndex = (page - 1) * pageSize;
  const toIndex = fromIndex + pageSize - 1;

  const {
    data,
    count,
    error,
  } = await query
    .order("name", {
      ascending: true,
    })
    .range(fromIndex, toIndex);

  /*
  |--------------------------------------------------------------------------
  | DATABASE ERROR
  |--------------------------------------------------------------------------
  */

  if (error) {
    console.error(
      "CATEGORY TOOLS QUERY ERROR:",
      error
    );
  }

  const tools: Tool[] = (data || []) as Tool[];

  const totalCount = count || 0;

  const totalPages =
    totalCount > 0
      ? Math.ceil(totalCount / pageSize)
      : 1;

  /*
  |--------------------------------------------------------------------------
  | BREADCRUMB SCHEMA
  |--------------------------------------------------------------------------
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
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema
          ),
        }}
      />

      <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans">

        {/* ============================================================
            HEADER
        ============================================================ */}

        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

            <Link
              href="/"
              className="flex items-center gap-2"
            >
              <span className="text-2xl font-black tracking-tight text-slate-950 font-serif">
                AI Vault
                <span className="text-blue-600">
                  .
                </span>
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

        {/* ============================================================
            MAIN
        ============================================================ */}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">

          {/* ============================================================
              BREADCRUMB
          ============================================================ */}

          <nav
            aria-label="Breadcrumb"
            className="text-xs font-semibold text-slate-400"
          >
            <ol className="flex items-center gap-2 flex-wrap">

              <li>
                <Link
                  href="/"
                  className="hover:text-blue-600"
                >
                  Home
                </Link>
              </li>

              <li>/</li>

              <li className="text-slate-900 font-bold">
                {categoryName}
              </li>

            </ol>
          </nav>

          {/* ============================================================
              HERO
          ============================================================ */}

          <div className="space-y-4">

            <h1 className="text-3xl sm:text-5xl font-black text-slate-950 font-serif">
              Best {categoryName} AI Tools
            </h1>

            <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
              Explore verified software platforms,
              pricing models, features, and alternatives
              in the {categoryName} domain.
            </p>

            <div className="text-xs font-bold text-blue-600">
              Showing {totalCount} Tools
            </div>

          </div>

          {/* ============================================================
              DIRECTORY GRID
          ============================================================ */}

          {tools.length > 0 ? (

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {tools.map((tool) => {

                const toolSlug =
                  typeof tool.slug === "string"
                    ? tool.slug.trim()
                    : "";

                if (!toolSlug) {
                  return null;
                }

                const toolUrl =
                  `/tool/${encodeURIComponent(
                    toolSlug
                  )}`;

                return (

                  <Link
                    key={tool.id}
                    href={toolUrl}
                    className="group bg-white border border-slate-100 hover:border-blue-200 rounded-3xl p-6 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between"
                  >

                    {/* ==================================================
                        TOP
                    ================================================== */}

                    <div className="space-y-4">

                      <div className="flex items-center justify-between">

                        <ToolLogo
                          tool={tool}
                          size="md"
                        />

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700">
                          {tool.pricing || "Freemium"}
                        </span>

                      </div>

                      {/* ==================================================
                          CONTENT
                      ================================================== */}

                      <div>

                        <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors font-serif">
                          {tool.name}
                        </h2>

                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {tool.description ||
                            `${tool.name} overview and details.`}
                        </p>

                      </div>

                    </div>

                    {/* ==================================================
                        FOOTER
                    ================================================== */}

                    <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-400">

                      <span>
                        {tool.category ||
                          categoryName}
                      </span>

                      <span className="text-blue-600 group-hover:translate-x-1 transition-transform font-bold">
                        Inspect →
                      </span>

                    </div>

                  </Link>

                );
              })}

            </div>

          ) : (

            /* ============================================================
               EMPTY STATE
            ============================================================ */

            <div className="p-12 text-center bg-white border border-slate-100 rounded-3xl space-y-3">

              <h2 className="text-lg font-bold text-slate-900">
                No tools found
              </h2>

              <p className="text-xs text-slate-500">
                No tools match the selected criteria
                in this category.
              </p>

              <Link
                href="/"
                className="inline-block text-xs font-bold text-blue-600 hover:underline pt-2"
              >
                Return to Directory →
              </Link>

            </div>

          )}

          {/* ============================================================
              PAGINATION
          ============================================================ */}

          {totalPages > 1 && (

            <div className="flex justify-center items-center gap-2 pt-6">

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((pageNumber) => {

                const queryParams =
                  new URLSearchParams();

                if (searchQuery) {
                  queryParams.set(
                    "q",
                    searchQuery
                  );
                }

                if (pricingFilter) {
                  queryParams.set(
                    "pricing",
                    pricingFilter
                  );
                }

                if (pageNumber > 1) {
                  queryParams.set(
                    "page",
                    String(pageNumber)
                  );
                }

                const queryString =
                  queryParams.toString();

                const href =
                  `/category/${encodeURIComponent(
                    rawCategory
                  )}${
                    queryString
                      ? `?${queryString}`
                      : ""
                  }`;

                return (

                  <Link
                    key={pageNumber}
                    href={href}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                      pageNumber === page
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-slate-100 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {pageNumber}
                  </Link>

                );
              })}

            </div>

          )}

        </main>

      </div>
    </>
  );
}
