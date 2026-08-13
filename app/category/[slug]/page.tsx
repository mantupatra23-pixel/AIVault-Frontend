import type { Metadata } from "next";
import Link from "next/link";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import ToolLogo from "@/components/ToolLogo";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string }>;
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

/* -------------------------------------------------------------------------- */
/* Supabase                                                                    */
/* -------------------------------------------------------------------------- */

function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[CATEGORY_SUPABASE_ENV_MISSING]");
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function decodeSlug(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function formatCategoryTitle(rawSlug: string): string {
  const decoded = decodeSlug(rawSlug)
    .replace(/[-_]+/g, " ")
    .trim();

  if (!decoded) {
    return "AI Tools";
  }

  return decoded.charAt(0).toUpperCase() + decoded.slice(1);
}

function normaliseCategory(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

/*
 * Database currently contains categories such as:
 *
 * Productivity
 * Marketing
 * Coding
 * Chatbot
 * Video Gen
 * Image Gen
 *
 * Keep aliases here so URLs remain flexible without changing database data.
 */
const CATEGORY_ALIASES: Record<string, string[]> = {
  productivity: ["Productivity"],

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

function getCategoryAliases(rawSlug: string, categoryName: string): string[] {
  const key = normaliseCategory(rawSlug).replace(/\s+/g, "-");

  const aliases = CATEGORY_ALIASES[key];

  if (aliases && aliases.length > 0) {
    return aliases;
  }

  return Array.from(
    new Set([
      categoryName,
      rawSlug,
      rawSlug.replace(/[-_]+/g, " "),
    ])
  );
}

function cleanTool(row: ToolRow): Tool | null {
  if (!row.id || !row.name || !row.slug) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    pricing: row.pricing,
    description: row.description,
    image_url: row.image_url,
    logo_url: row.logo_url,
    score:
      typeof row.score === "number"
        ? row.score
        : row.score === null
          ? null
          : Number(row.score) || null,
  };
}

/* -------------------------------------------------------------------------- */
/* Metadata                                                                    */
/* -------------------------------------------------------------------------- */

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const rawCategory = decodeSlug(resolvedParams.slug);
  const categoryName = formatCategoryTitle(rawCategory);

  const searchQuery =
    resolvedSearchParams.q?.trim() ||
    resolvedSearchParams.search?.trim() ||
    "";

  const title = searchQuery
    ? `Best ${categoryName} AI Tools for "${searchQuery}" | AI Vault`
    : `Best ${categoryName} AI Tools | AI Vault`;

  const description = `Discover the best ${categoryName} AI tools, software platforms, pricing, features, alternatives, and reviews on AI Vault.`;

  const canonical = `${SITE_URL}/category/${encodeURIComponent(
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

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default async function CategoryPage({
  params,
  searchParams,
}: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const rawCategory = decodeSlug(resolvedParams.slug).trim();
  const categoryName = formatCategoryTitle(rawCategory);

  const searchQuery =
    resolvedSearchParams.q?.trim() ||
    resolvedSearchParams.search?.trim() ||
    "";

  const pricingFilter = resolvedSearchParams.pricing?.trim() || "";

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

  /* ------------------------------------------------------------------------ */
  /* Supabase unavailable                                                     */
  /* ------------------------------------------------------------------------ */

  if (!supabase) {
    return (
      <main className="min-h-screen bg-white text-slate-950">
        <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <Link
              href="/"
              className="text-xl font-black tracking-tight text-slate-950"
            >
              AI Vault.
            </Link>

            <Link
              href="/categories"
              className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-700"
            >
              Browse All Categories
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">
              Unable to load this category
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              The AI Vault database configuration is currently unavailable.
            </p>

            <Link
              href="/categories"
              className="mt-6 inline-block text-sm font-bold text-blue-600"
            >
              Return to Directory →
            </Link>
          </div>
        </main>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Category aliases                                                         */
  /* ------------------------------------------------------------------------ */

  const aliases = getCategoryAliases(rawCategory, categoryName);

  /*
   * IMPORTANT:
   * We use ilike OR instead of relying on:
   *
   * category = categoryName
   *
   * because URL title and database category may not have identical casing
   * or formatting.
   */

  const categoryFilter = aliases
    .filter(Boolean)
    .map((value) => {
      const escaped = value
        .replace(/\\/g, "\\\\")
        .replace(/,/g, "\\,")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_");

      return `category.ilike.%${escaped}%`;
    })
    .join(",");

  /* ------------------------------------------------------------------------ */
  /* Query                                                                    */
  /* ------------------------------------------------------------------------ */

  let query = supabase
    .from("ai_tools")
    .select(
      "id, name, slug, category, pricing, description, image_url, logo_url, score",
      {
        count: "exact",
      }
    )
    .or(categoryFilter);

  if (searchQuery) {
    const escapedSearch = searchQuery
      .replace(/\\/g, "\\\\")
      .replace(/,/g, "\\,")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_");

    query = query.or(
      `name.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%`
    );
  }

  if (pricingFilter) {
    const escapedPricing = pricingFilter
      .replace(/\\/g, "\\\\")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_");

    query = query.ilike(
      "pricing",
      `%${escapedPricing}%`
    );
  }

  const fromIndex = (page - 1) * pageSize;
  const toIndex = fromIndex + pageSize - 1;

  const result = await query
    .order("score", {
      ascending: false,
      nullsFirst: false,
    })
    .order("name", {
      ascending: true,
    })
    .range(fromIndex, toIndex);

  /* ------------------------------------------------------------------------ */
  /* Database error                                                           */
  /* ------------------------------------------------------------------------ */

  if (result.error) {
    console.error("[CATEGORY_DATABASE_ERROR]", {
      slug: rawCategory,
      category: categoryName,
      code: result.error.code,
      message: result.error.message,
      details: result.error.details,
      hint: result.error.hint,
    });

    return (
      <main className="min-h-screen bg-white text-slate-950">
        <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <Link
              href="/"
              className="text-xl font-black tracking-tight text-slate-950"
            >
              AI Vault.
            </Link>

            <Link
              href="/categories"
              className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-700"
            >
              Browse All Categories
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">
              Unable to load this category
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              The AI Vault database returned an error while loading this
              category.
            </p>

            <p className="mt-3 text-xs font-semibold text-red-500">
              Category: {categoryName}
            </p>

            <Link
              href={`/category/${encodeURIComponent(rawCategory)}`}
              className="mt-6 inline-block text-sm font-bold text-blue-600"
            >
              Try Again →
            </Link>
          </div>
        </main>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Safe data conversion                                                     */
  /* ------------------------------------------------------------------------ */

  /*
   * IMPORTANT BUILD FIX:
   *
   * Do NOT do:
   *
   * (result.data ?? []) as Tool[]
   *
   * We validate every row and convert it explicitly.
   *
   * This avoids the TypeScript conversion error that was breaking Vercel.
   */

  const rawRows: ToolRow[] = Array.isArray(result.data)
    ? result.data
        .filter(
          (row): row is ToolRow =>
            !!row &&
            typeof row === "object" &&
            "id" in row &&
            "name" in row &&
            "slug" in row
        )
        .map((row) => ({
          id: row.id,
          name: typeof row.name === "string" ? row.name : null,
          slug: typeof row.slug === "string" ? row.slug : null,
          category:
            typeof row.category === "string"
              ? row.category
              : null,
          pricing:
            typeof row.pricing === "string"
              ? row.pricing
              : null,
          description:
            typeof row.description === "string"
              ? row.description
              : null,
          image_url:
            typeof row.image_url === "string"
              ? row.image_url
              : null,
          logo_url:
            typeof row.logo_url === "string"
              ? row.logo_url
              : null,
          score:
            typeof row.score === "number"
              ? row.score
              : null,
        }))
    : [];

  const tools: Tool[] = rawRows
    .map(cleanTool)
    .filter((tool): tool is Tool => tool !== null);

  const count =
    typeof result.count === "number"
      ? result.count
      : tools.length;

  const totalPages =
    count > 0
      ? Math.ceil(count / pageSize)
      : 1;

  /* ------------------------------------------------------------------------ */
  /* Breadcrumb Schema                                                        */
  /* ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------ */
  /* Page                                                                      */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <div className="min-h-screen bg-[#FFFFFF] text-slate-950">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ---------------------------------------------------------------- */}

        <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <Link
              href="/"
              className="text-xl font-black tracking-tight text-slate-950"
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

        {/* ---------------------------------------------------------------- */}
        {/* Main                                                              */}
        {/* ---------------------------------------------------------------- */}

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

          {/* Hero */}

          <section className="space-y-4 py-4">
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Best {categoryName} AI Tools
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Explore verified software platforms, pricing models,
              features, alternatives, and AI tools in the{" "}
              {categoryName} domain.
            </p>

            <div className="text-xs font-bold text-blue-600">
              Showing {count} Verified Tools
            </div>
          </section>

          {/* Search/filter state */}

          {(searchQuery || pricingFilter) && (
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
                href={`/category/${encodeURIComponent(rawCategory)}`}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 underline hover:text-slate-900"
              >
                Clear filters
              </Link>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Directory Grid                                                    */}
          {/* ---------------------------------------------------------------- */}

          {tools.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <Link
                  key={String(tool.id)}
                  href={`/tool/${encodeURIComponent(tool.slug)}`}
                  className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Top row */}

                    <div className="flex items-center justify-between gap-4">
                      <ToolLogo
                        tool={tool}
                        size="md"
                      />

                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                        {tool.pricing || "Freemium"}
                      </span>
                    </div>

                    {/* Name / description */}

                    <div>
                      <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600">
                        {tool.name}
                      </h2>

                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500">
                        {tool.description ||
                          `Explore ${tool.name}, an AI tool available in the ${categoryName} category.`}
                      </p>
                    </div>

                    {/* Footer */}

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs text-slate-500">
                        {tool.category || categoryName}
                      </span>

                      <span className="text-xs font-semibold text-blue-600 transition group-hover:translate-x-0.5">
                        Inspect →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* ---------------------------------------------------------------- */
            /* Empty state                                                       */
            /* ---------------------------------------------------------------- */

            <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                No tools found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
                No tools match the selected criteria in this category.
              </p>

              <Link
                href="/categories"
                className="mt-5 inline-block text-sm font-bold text-blue-600"
              >
                Return to Directory →
              </Link>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Pagination                                                         */}
          {/* ---------------------------------------------------------------- */}

          {totalPages > 1 && (
            <nav
              aria-label="Category pagination"
              className="mt-8 flex flex-wrap justify-center gap-2"
            >
              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((pageNumber) => {
                const params = new URLSearchParams();

                if (searchQuery) {
                  params.set("q", searchQuery);
                }

                if (pricingFilter) {
                  params.set("pricing", pricingFilter);
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

                const active =
                  pageNumber === page;

                return (
                  <Link
                    key={pageNumber}
                    href={href}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                      active
                        ? "bg-blue-600 text-white"
                        : "border border-slate-100 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                    aria-current={
                      active ? "page" : undefined
                    }
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
