import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ToolLogo } from "@/components/ToolLogo";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  if (!url || !key) {
    console.error("[CATEGORY] Supabase environment variables missing");
    return null;
  }

  return createClient(url, key);
}

function formatCategoryTitle(slug: string) {
  const decoded = decodeURIComponent(slug)
    .replace(/[-_]+/g, " ")
    .trim();

  if (!decoded) return "";

  return decoded
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();

      if (lower === "ai") return "AI";
      if (lower === "seo") return "SEO";
      if (lower === "api") return "API";

      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;

  const categoryName = formatCategoryTitle(slug);

  return {
    title: `Best ${categoryName} AI Tools & Software Directory | AI Vault`,
    description: `Discover and compare the best ${categoryName} AI tools, software, pricing, features and alternatives on AI Vault.`,
    alternates: {
      canonical: `${SITE_URL}/category/${encodeURIComponent(slug)}`,
    },
    openGraph: {
      title: `Best ${categoryName} AI Tools | AI Vault`,
      description: `Explore curated ${categoryName} AI software tools on AI Vault.`,
      url: `${SITE_URL}/category/${encodeURIComponent(slug)}`,
      siteName: "AI Vault",
      type: "website",
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const filters = await searchParams;

  const rawCategory = decodeURIComponent(slug || "").trim();

  if (!rawCategory) {
    notFound();
  }

  const categoryName = formatCategoryTitle(rawCategory);

  if (!categoryName) {
    notFound();
  }

  const searchQuery = (filters.q || "").trim();
  const pricingFilter = (filters.pricing || "").trim();

  const requestedPage = Number.parseInt(filters.page || "1", 10);

  const page =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const pageSize = 24;

  const supabase = getSupabaseClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-[#FDFDFD]">
        <header className="border-b border-slate-100 bg-white">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
            <Link
              href="/"
              className="font-serif text-2xl font-black text-slate-950"
            >
              AI Vault<span className="text-blue-600">.</span>
            </Link>

            <Link
              href="/"
              className="rounded-full bg-slate-100 px-5 py-2.5 text-xs font-bold uppercase"
            >
              Browse All Categories
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-20">
          <div className="rounded-3xl border border-red-100 bg-white p-12 text-center">
            <h1 className="text-xl font-bold">
              Database configuration unavailable
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              Supabase environment variables are missing.
            </p>
          </div>
        </main>
      </div>
    );
  }

  /*
   * ==========================================================
   * MAIN CATEGORY QUERY
   * ==========================================================
   *
   * Database values:
   *
   * Productivity
   * Marketing
   * Coding
   * Chatbot
   * Video Gen
   * Image Gen
   *
   * URL:
   *
   * /category/productivity
   *
   * becomes:
   *
   * Productivity
   *
   * We use eq() because the database value is already normalized.
   */

  let query = supabase
    .from("ai_tools")
    .select(
      "id,name,slug,category,pricing,description,image_url,logo_url,score",
      {
        count: "exact",
      }
    )
    .eq("category", categoryName);

  /*
   * Search filter
   */

  if (searchQuery) {
    const safeSearch = searchQuery
      .replace(/[%_]/g, "")
      .trim();

    if (safeSearch) {
      query = query.or(
        `name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`
      );
    }
  }

  /*
   * Pricing filter
   */

  if (pricingFilter) {
    const safePricing = pricingFilter
      .replace(/[%_]/g, "")
      .trim();

    if (safePricing) {
      query = query.ilike("pricing", `%${safePricing}%`);
    }
  }

  /*
   * Pagination
   */

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const result = await query
    .order("name", {
      ascending: true,
    })
    .range(from, to);

  const tools = (result.data || []) as Tool[];
  const count = result.count || 0;
  const error = result.error;

  /*
   * NEVER hide the real Supabase error.
   */

  if (error) {
    console.error("======================================");
    console.error("[CATEGORY_QUERY_ERROR]");
    console.error("Slug:", rawCategory);
    console.error("Category:", categoryName);
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("Details:", error.details);
    console.error("Hint:", error.hint);
    console.error("======================================");

    return (
      <div className="min-h-screen bg-[#FDFDFD] text-slate-900">
        <header className="border-b border-slate-100 bg-white">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
            <Link
              href="/"
              className="font-serif text-2xl font-black"
            >
              AI Vault<span className="text-blue-600">.</span>
            </Link>

            <Link
              href="/"
              className="rounded-full bg-slate-100 px-5 py-2.5 text-xs font-bold uppercase"
            >
              Browse All Categories
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-20">
          <div className="rounded-3xl border border-red-100 bg-white p-12 text-center">

            <h1 className="text-xl font-bold text-slate-900">
              Unable to load this category
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
              The AI Vault database returned an error while loading
              this category.
            </p>

            <p className="mt-4 text-xs font-semibold text-red-500">
              Category: {categoryName}
            </p>

            <Link
              href={`/category/${encodeURIComponent(rawCategory)}`}
              className="mt-6 inline-block text-xs font-bold text-blue-600 hover:underline"
            >
              Try Again →
            </Link>

          </div>
        </main>
      </div>
    );
  }

  const totalPages = Math.max(
    1,
    Math.ceil(count / pageSize)
  );

  function pageUrl(targetPage: number) {
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

  /*
   * ==========================================================
   * STRUCTURED DATA
   * ==========================================================
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

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Best ${categoryName} AI Tools`,
    description: `Explore the best ${categoryName} AI tools and software on AI Vault.`,
    url: `${SITE_URL}/category/${rawCategory}`,
  };

  return (
    <>
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

      <div className="min-h-screen bg-[#FDFDFD] text-slate-900">

        {/* HEADER */}

        <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

            <Link
              href="/"
              className="font-serif text-2xl font-black tracking-tight"
            >
              AI Vault<span className="text-blue-600">.</span>
            </Link>

            <Link
              href="/"
              className="rounded-full bg-slate-100 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-200"
            >
              Browse All Categories
            </Link>

          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">

          {/* BREADCRUMB */}

          <nav
            aria-label="Breadcrumb"
            className="mb-8 text-xs font-semibold text-slate-400"
          >
            <ol className="flex items-center gap-2">

              <li>
                <Link
                  href="/"
                  className="hover:text-blue-600"
                >
                  Home
                </Link>
              </li>

              <li>/</li>

              <li className="font-bold text-slate-900">
                {categoryName}
              </li>

            </ol>
          </nav>

          {/* HERO */}

          <section>

            <h1 className="font-serif text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Best {categoryName} AI Tools
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Explore verified software platforms, pricing models,
              features, and alternatives in the {categoryName} domain.
            </p>

            <div className="mt-4 text-xs font-bold text-blue-600">
              Showing {count} {count === 1 ? "Tool" : "Tools"}
            </div>

          </section>

          {/* FILTER */}

          <form
            method="GET"
            className="mt-8 grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto]"
          >

            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder={`Search ${categoryName} tools...`}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <select
              name="pricing"
              defaultValue={pricingFilter}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            >
              <option value="">All Pricing</option>
              <option value="Free">Free</option>
              <option value="Freemium">Freemium</option>
              <option value="Paid">Paid</option>
              <option value="Free Trial">Free Trial</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Search
            </button>

          </form>

          {/* TOOLS */}

          <section className="mt-10">

            {tools.length > 0 ? (

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

                {tools.map((tool) => (

                  <Link
                    key={tool.id}
                    href={`/tool/${encodeURIComponent(tool.slug)}`}
                    className="group flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                  >

                    <div>

                      <div className="flex items-center justify-between gap-3">

                        <ToolLogo
                          tool={tool}
                          size="md"
                        />

                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-blue-700">
                          {tool.pricing || "Freemium"}
                        </span>

                      </div>

                      <h2 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-blue-600">
                        {tool.name}
                      </h2>

                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500">
                        {tool.description ||
                          `${tool.name} overview and details.`}
                      </p>

                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-50 pt-5 text-xs font-semibold">

                      <span className="text-slate-400">
                        {tool.category || categoryName}
                      </span>

                      <span className="text-blue-600 transition-transform group-hover:translate-x-1">
                        Inspect →
                      </span>

                    </div>

                  </Link>

                ))}

              </div>

            ) : (

              <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center">

                <h2 className="text-lg font-bold text-slate-900">
                  No tools found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  No tools match the selected criteria in this category.
                </p>

                <Link
                  href={`/category/${encodeURIComponent(rawCategory)}`}
                  className="mt-6 inline-block text-xs font-bold text-blue-600 hover:underline"
                >
                  Clear Filters →
                </Link>

              </div>

            )}

          </section>

          {/* PAGINATION */}

          {totalPages > 1 && (

            <nav
              aria-label="Pagination"
              className="mt-10 flex flex-wrap items-center justify-center gap-2"
            >

              {page > 1 && (
                <Link
                  href={pageUrl(page - 1)}
                  className="rounded-xl border border-slate-100 bg-white px-4 py-2 text-xs font-bold hover:bg-slate-50"
                >
                  ← Previous
                </Link>
              )}

              {Array.from(
                { length: Math.min(totalPages, 7) },
                (_, index) => {

                  let number = index + 1;

                  if (totalPages > 7 && page > 4) {
                    number = page - 3 + index;
                  }

                  if (number > totalPages) {
                    return null;
                  }

                  return (
                    <Link
                      key={number}
                      href={pageUrl(number)}
                      className={`rounded-xl px-4 py-2 text-xs font-bold ${
                        number === page
                          ? "bg-blue-600 text-white"
                          : "border border-slate-100 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {number}
                    </Link>
                  );
                }
              )}

              {page < totalPages && (
                <Link
                  href={pageUrl(page + 1)}
                  className="rounded-xl border border-slate-100 bg-white px-4 py-2 text-xs font-bold hover:bg-slate-50"
                >
                  Next →
                </Link>
              )}

            </nav>

          )}

          {/* SEO CONTENT */}

          <section className="mt-16 border-t border-slate-100 pt-10">

            <h2 className="font-serif text-2xl font-bold text-slate-900">
              {categoryName} AI Tools Directory
            </h2>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              AI Vault helps you discover and compare the best
              {` ${categoryName}`} AI tools and software. Explore
              features, pricing models, use cases, limitations,
              and alternatives to find the right software for your
              workflow.
            </p>

          </section>

        </main>
      </div>
    </>
  );
}
