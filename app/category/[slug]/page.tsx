import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ToolLogo from "@/components/ToolLogo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    q?: string;
    pricing?: string;
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

  [key: string]: unknown;
};

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

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function decodeSlug(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function makeSlug(value: string): string {
  return value
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
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getName(tool: ToolRecord): string {
  return clean(tool.name) || "AI Tool";
}

function getSlug(tool: ToolRecord): string {
  const existing = clean(tool.slug);

  if (existing) {
    return existing;
  }

  return makeSlug(getName(tool));
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
  const value = clean(tool.pricing_model) || clean(tool.pricing);

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

  return Math.max(0, Math.min(100, number));
}

function getLogoUrl(tool: ToolRecord): string | null {
  return (
    clean(tool.logo_url) ||
    clean(tool.logo) ||
    clean(tool.image_url) ||
    null
  );
}

function getWebsiteUrl(tool: ToolRecord): string | null {
  return (
    clean(tool.website_url) ||
    clean(tool.official_url) ||
    clean(tool.url) ||
    null
  );
}

function categoryMatches(
  toolCategory: string,
  categorySlug: string,
  categoryTitle: string
): boolean {
  const value = toolCategory
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ");

  const slug = categorySlug
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ");

  const title = categoryTitle
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ");

  return value === slug || value === title;
}

function pricingMatches(
  tool: ToolRecord,
  selectedPricing: string
): boolean {
  if (!selectedPricing || selectedPricing === "All Pricing") {
    return true;
  }

  const pricing = getPricing(tool).toLowerCase();
  const selected = selectedPricing.toLowerCase();

  if (selected === "free") {
    return pricing === "free";
  }

  if (selected === "freemium") {
    return pricing === "freemium";
  }

  if (selected === "paid") {
    return pricing === "paid";
  }

  return pricing.includes(selected);
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  /*
   * NEXT.JS 16:
   * params and searchParams are Promises.
   */
  const { slug } = await params;

  const resolvedSearchParams = searchParams
    ? await searchParams
    : {};

  const categorySlug = decodeSlug(slug);

  const categoryName = titleFromSlug(categorySlug);

  const queryText = clean(resolvedSearchParams.q);

  const selectedPricing =
    clean(resolvedSearchParams.pricing) || "All Pricing";

  let tools: ToolRecord[] = [];
  let databaseError: string | null = null;

  try {
    const supabase = getSupabase();

    /*
     * select("*") is intentional.
     *
     * It keeps all existing ai_tools fields available and avoids
     * breaking the page when your table contains additional columns.
     */
    const { data, error } = await supabase
      .from("ai_tools")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      databaseError = error.message;
    } else {
      tools = (data ?? []) as ToolRecord[];
    }
  } catch (error) {
    databaseError =
      error instanceof Error
        ? error.message
        : "Unable to connect to the AI Vault database.";
  }

  /*
   * Filter category in JavaScript.
   *
   * This is more tolerant than exact SQL matching and supports:
   * Productivity
   * productivity
   * PRODUCTIVITY
   * productivity-
   * etc.
   */
  if (!databaseError) {
    tools = tools.filter((tool) =>
      categoryMatches(
        clean(tool.category),
        categorySlug,
        categoryName
      )
    );
  }

  /*
   * Search + pricing filter
   */
  const filteredTools = tools.filter((tool) => {
    if (!pricingMatches(tool, selectedPricing)) {
      return false;
    }

    if (!queryText) {
      return true;
    }

    const search = queryText.toLowerCase();

    const searchableText = [
      getName(tool),
      getDescription(tool),
      clean(tool.category),
      getPricing(tool),
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);
  });

  const totalTools = tools.length;

  const pageTitle = `Best ${categoryName} AI Tools`;

  const pageDescription =
    `Explore verified software platforms, pricing models, features, reviews, and alternatives in the ${categoryName} domain.`;

  function categoryUrl(
    nextQuery = "",
    nextPricing = "All Pricing"
  ): string {
    const params = new URLSearchParams();

    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    }

    if (
      nextPricing &&
      nextPricing !== "All Pricing"
    ) {
      params.set("pricing", nextPricing);
    }

    const query = params.toString();

    return `/category/${encodeURIComponent(categorySlug)}${
      query ? `?${query}` : ""
    }`;
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      {/* =========================================================
          HEADER
      ========================================================= */}
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-slate-950"
          >
            AI Vault.
          </Link>

          <Link
            href="/categories"
            className="rounded-full bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-600 transition hover:bg-slate-100"
          >
            Browse All Categories
          </Link>
        </div>
      </header>

      {/* =========================================================
          CONTENT
      ========================================================= */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-400">
          <Link
            href="/"
            className="transition hover:text-slate-700"
          >
            Home
          </Link>

          <span>/</span>

          <span className="font-medium text-slate-700">
            {categoryName}
          </span>
        </nav>

        {/* =======================================================
            HERO
        ======================================================= */}
        <section className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {pageTitle}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
            {pageDescription}
          </p>

          {!databaseError && (
            <p className="mt-4 text-xs font-semibold text-blue-600">
              Showing{" "}
              {filteredTools.length.toLocaleString()}{" "}
              {filteredTools.length === 1
                ? "Verified Tool"
                : "Verified Tools"}
            </p>
          )}
        </section>

        {/* =======================================================
            SEARCH + PRICING FILTER
        ======================================================= */}
        <section className="mb-8 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
          <form
            action={`/category/${encodeURIComponent(categorySlug)}`}
            method="GET"
            className="grid gap-3 md:grid-cols-[1fr_190px_auto]"
          >
            <input
              type="search"
              name="q"
              defaultValue={queryText}
              placeholder={`Search ${categoryName} tools...`}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <select
              name="pricing"
              defaultValue={selectedPricing}
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All Pricing">
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
            </select>

            <button
              type="submit"
              className="h-12 rounded-xl bg-slate-950 px-7 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Search
            </button>
          </form>
        </section>

        {/* =======================================================
            DATABASE ERROR
        ======================================================= */}
        {databaseError ? (
          <section className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl">
              !
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Unable to load this category
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              The AI Vault database returned an error while
              loading this category.
            </p>

            {process.env.NODE_ENV !== "production" && (
              <p className="mx-auto mt-3 max-w-xl rounded-lg bg-red-50 p-3 text-left text-xs text-red-700">
                {databaseError}
              </p>
            )}

            <Link
              href={categoryUrl()}
              className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Try Again →
            </Link>
          </section>
        ) : filteredTools.length === 0 ? (
          /* =====================================================
             EMPTY STATE
          ===================================================== */
          <section className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-xl">
              🔎
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              No tools found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Try another search term or change the pricing
              filter.
            </p>

            <Link
              href={categoryUrl()}
              className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              View All Tools
            </Link>
          </section>
        ) : (
          /* =====================================================
             TOOL GRID
          ===================================================== */
          <section className="grid gap-5 md:grid-cols-2">
            {filteredTools.map((tool, index) => {
              const toolName = getName(tool);
              const toolSlug = getSlug(tool);
              const toolDescription =
                getDescription(tool);
              const toolPricing = getPricing(tool);
              const toolScore = getScore(tool);
              const logoUrl = getLogoUrl(tool);
              const websiteUrl = getWebsiteUrl(tool);

              const key =
                tool.id !== null &&
                tool.id !== undefined
                  ? String(tool.id)
                  : `${toolSlug}-${index}`;

              return (
                <Link
                  key={key}
                  href={`/tool/${encodeURIComponent(
                    toolSlug
                  )}`}
                  className="group block"
                >
                  <article className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-4">
                      <ToolLogo
                        src={logoUrl}
                        fallbackSrc={logoUrl}
                        websiteUrl={websiteUrl}
                        name={toolName}
                        size="md"
                      />

                      <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                        {toolPricing}
                      </span>
                    </div>

                    {/* Tool name */}
                    <h2 className="mt-4 line-clamp-1 text-lg font-extrabold tracking-tight text-slate-900 transition group-hover:text-blue-600">
                      {toolName}
                    </h2>

                    {/* Description */}
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                      {toolDescription}
                    </p>

                    {/* Bottom metadata */}
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-blue-600">
                        {clean(tool.category) ||
                          categoryName}
                      </span>

                      <span className="text-xs font-bold text-blue-600">
                        {toolScore}/100
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </section>
        )}

        {/* =======================================================
            FOOTER INFORMATION
        ======================================================= */}
        {!databaseError && totalTools > 0 && (
          <div className="mt-10 border-t border-slate-100 pt-6 text-center">
            <p className="text-xs text-slate-400">
              AI Vault has verified{" "}
              <span className="font-semibold text-slate-600">
                {totalTools.toLocaleString()}
              </span>{" "}
              tools in the{" "}
              <span className="font-semibold text-slate-600">
                {categoryName}
              </span>{" "}
              category.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
