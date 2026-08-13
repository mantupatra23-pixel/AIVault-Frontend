import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ToolLogo from "@/components/ToolLogo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: {
    slug: string;
  };
  searchParams?: {
    q?: string;
    pricing?: string;
  };
};

type ToolRecord = {
  id?: string | number;
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
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(url, key);
}

function normalizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
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

function getToolSlug(tool: ToolRecord): string {
  const existingSlug = normalizeText(tool.slug);

  if (existingSlug) {
    return existingSlug;
  }

  return makeSlug(normalizeText(tool.name) || "tool");
}

function getToolName(tool: ToolRecord): string {
  return normalizeText(tool.name) || "AI Tool";
}

function getDescription(tool: ToolRecord): string {
  const description =
    normalizeText(tool.description) ||
    normalizeText(tool.short_description) ||
    normalizeText(tool.overview);

  if (!description) {
    return "Explore this AI software platform and discover its features, pricing, and use cases.";
  }

  return description;
}

function getPricing(tool: ToolRecord): string {
  const value =
    normalizeText(tool.pricing_model) ||
    normalizeText(tool.pricing) ||
    "";

  if (!value) {
    return "Unknown";
  }

  const lower = value.toLowerCase();

  if (lower.includes("freemium")) {
    return "Freemium";
  }

  if (lower.includes("free")) {
    return "Free";
  }

  if (lower.includes("paid") || lower.includes("subscription")) {
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

  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    return 90;
  }

  return Math.max(0, Math.min(100, parsed));
}

function getLogoUrl(tool: ToolRecord): string | null {
  return (
    normalizeText(tool.logo_url) ||
    normalizeText(tool.logo) ||
    normalizeText(tool.image_url) ||
    null
  );
}

function getWebsiteUrl(tool: ToolRecord): string | null {
  return (
    normalizeText(tool.website_url) ||
    normalizeText(tool.official_url) ||
    normalizeText(tool.url) ||
    null
  );
}

function pricingMatches(tool: ToolRecord, selectedPricing: string): boolean {
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
  const supabase = getSupabase();

  const categorySlug = decodeSlug(params.slug);
  const categoryName =
    categorySlug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) || "AI Tools";

  const queryText = normalizeText(searchParams?.q);
  const selectedPricing =
    normalizeText(searchParams?.pricing) || "All Pricing";

  let tools: ToolRecord[] = [];
  let databaseError: string | null = null;

  try {
    /*
     * IMPORTANT:
     * Do not select individual columns here.
     * select("*") keeps compatibility with your current ai_tools table
     * and preserves all existing fields.
     */
    const { data, error } = await supabase
      .from("ai_tools")
      .select("*")
      .ilike("category", categoryName)
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
        : "Unable to load AI tools.";
  }

  /*
   * If exact category matching returns nothing, try the original slug.
   * This protects category pages where database capitalization differs.
   */
  if (!databaseError && tools.length === 0) {
    try {
      const { data, error } = await supabase
        .from("ai_tools")
        .select("*")
        .ilike("category", categorySlug)
        .order("name", { ascending: true });

      if (!error && data) {
        tools = data as ToolRecord[];
      }
    } catch {
      // Keep the first successful/empty result.
    }
  }

  const filteredTools = tools.filter((tool) => {
    const matchesPricing = pricingMatches(tool, selectedPricing);

    if (!matchesPricing) {
      return false;
    }

    if (!queryText) {
      return true;
    }

    const search = queryText.toLowerCase();

    const searchableText = [
      getToolName(tool),
      getDescription(tool),
      normalizeText(tool.category),
      getPricing(tool),
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);
  });

  const totalTools = tools.length;

  const pageTitle = `Best ${categoryName} AI Tools`;

  const description = `Explore verified software platforms, pricing models, features, reviews, and alternatives in the ${categoryName} domain.`;

  const buildUrl = (nextQuery: string, nextPricing: string) => {
    const params = new URLSearchParams();

    if (nextQuery) {
      params.set("q", nextQuery);
    }

    if (nextPricing && nextPricing !== "All Pricing") {
      params.set("pricing", nextPricing);
    }

    const query = params.toString();

    return `/category/${encodeURIComponent(categorySlug)}${
      query ? `?${query}` : ""
    }`;
  };

  return (
    <main className="min-h-screen bg-white text-slate-950">
      {/* Header */}
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

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-700">
            Home
          </Link>

          <span>/</span>

          <span className="font-medium text-slate-700">
            {categoryName}
          </span>
        </nav>

        {/* Hero */}
        <section className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {pageTitle}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
            {description}
          </p>

          <div className="mt-4 text-xs font-semibold text-blue-600">
            Showing {filteredTools.length.toLocaleString()}{" "}
            {filteredTools.length === 1 ? "Verified Tool" : "Verified Tools"}
          </div>
        </section>

        {/* Search / Filter */}
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
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <select
              name="pricing"
              defaultValue={selectedPricing}
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option>All Pricing</option>
              <option>Free</option>
              <option>Freemium</option>
              <option>Paid</option>
            </select>

            <button
              type="submit"
              className="h-12 rounded-xl bg-slate-950 px-7 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Search
            </button>
          </form>
        </section>

        {/* Database error */}
        {databaseError ? (
          <section className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
            <h2 className="text-lg font-bold text-red-900">
              Unable to load this category
            </h2>

            <p className="mt-2 text-sm text-red-700">
              The AI Vault database returned an error while loading this
              category.
            </p>

            <Link
              href={`/category/${encodeURIComponent(categorySlug)}`}
              className="mt-5 inline-flex rounded-lg bg-white px-5 py-3 text-sm font-bold text-red-700 shadow-sm"
            >
              Try Again →
            </Link>
          </section>
        ) : filteredTools.length === 0 ? (
          /* Empty state */
          <section className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-xl">
              🔎
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              No tools found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Try another search term or change the pricing filter.
            </p>

            <Link
              href={`/category/${encodeURIComponent(categorySlug)}`}
              className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
            >
              View All Tools
            </Link>
          </section>
        ) : (
          /* Tool Grid */
          <section className="grid gap-5 md:grid-cols-2">
            {filteredTools.map((tool, index) => {
              const toolName = getToolName(tool);
              const toolSlug = getToolSlug(tool);
              const toolDescription = getDescription(tool);
              const toolPricing = getPricing(tool);
              const toolScore = getScore(tool);
              const logoUrl = getLogoUrl(tool);
              const websiteUrl = getWebsiteUrl(tool);

              return (
                <Link
                  key={
                    tool.id !== undefined && tool.id !== null
                      ? String(tool.id)
                      : `${toolSlug}-${index}`
                  }
                  href={`/tool/${encodeURIComponent(toolSlug)}`}
                  className="group block"
                >
                  <article className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                    {/* Card top */}
                    <div className="flex items-start justify-between gap-4">
                      <ToolLogo
                        src={logoUrl}
                        websiteUrl={websiteUrl}
                        name={toolName}
                        size="md"
                      />

                      <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                        {toolPricing}
                      </span>
                    </div>

                    {/* Name */}
                    <h2 className="mt-4 line-clamp-1 text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600">
                      {toolName}
                    </h2>

                    {/* Description */}
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                      {toolDescription}
                    </p>

                    {/* Bottom */}
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-blue-600">
                        {normalizeText(tool.category) || categoryName}
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

        {/* Bottom information */}
        {!databaseError && tools.length > 0 && (
          <div className="mt-10 border-t border-slate-100 pt-6 text-center">
            <p className="text-xs text-slate-400">
              AI Vault has verified{" "}
              <span className="font-semibold text-slate-600">
                {totalTools.toLocaleString()}
              </span>{" "}
              tools in the {categoryName} category.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
