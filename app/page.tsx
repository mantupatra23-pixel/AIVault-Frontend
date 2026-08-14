"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import ToolLogo from "@/components/ToolLogo";
import { SITE_URL } from "@/lib/site-url";

import {
  trackToolClick,
  trackToolImpression,
} from "@/lib/traffic-tracker";

/* =========================================================
   TYPES
========================================================= */

type ToolRecord = {
  id?: string | number | null;

  /*
   * IMPORTANT:
   * slug is the canonical database identifier.
   * NEVER generate this from name.
   */
  slug?: string | null;

  name?: string | null;

  description?: string | null;
  short_description?: string | null;
  overview?: string | null;

  category?: string | null;

  pricing?: string | null;
  pricing_model?: string | null;

  score?: number | string | null;
  ai_vault_score?: number | string | null;

  logo_url?: string | null;
  logo?: string | null;
  image_url?: string | null;
  icon_url?: string | null;

  [key: string]: unknown;
};

/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* =========================================================
   CATEGORIES
========================================================= */

const categories = [
  {
    name: "All",
    icon: "⚡",
  },
  {
    name: "Chatbot",
    icon: "🤖",
  },
  {
    name: "Coding",
    icon: "💻",
  },
  {
    name: "Image",
    icon: "🎨",
  },
  {
    name: "Writing",
    icon: "✍️",
  },
  {
    name: "Audio",
    icon: "🎵",
  },
  {
    name: "Video",
    icon: "🎬",
  },
];

/* =========================================================
   CANONICAL SLUG HELPERS
========================================================= */

/**
 * IMPORTANT:
 *
 * This function does NOT create a slug.
 *
 * It only safely reads the canonical database slug.
 *
 * DO NOT:
 *   normalizeSlug(tool.name)
 *
 * DO NOT:
 *   create a slug from the tool name.
 */
const getCanonicalSlug = (
  tool: ToolRecord
): string => {
  if (
    typeof tool.slug !== "string"
  ) {
    return "";
  }

  return tool.slug.trim();
};

/**
 * URL path segment.
 *
 * The database slug remains unchanged.
 *
 * encodeURIComponent is only used when
 * placing that canonical slug into a URL.
 */
const getToolHref = (
  tool: ToolRecord
): string | null => {
  const slug =
    getCanonicalSlug(tool);

  if (!slug) {
    return null;
  }

  return `/tool/${encodeURIComponent(
    slug
  )}`;
};

/* =========================================================
   BASIC HELPERS
========================================================= */

const getToolName = (
  tool: ToolRecord
): string =>
  typeof tool.name === "string" &&
  tool.name.trim()
    ? tool.name.trim()
    : "AI Tool";

const getToolDescription = (
  tool: ToolRecord
): string => {
  const value =
    typeof tool.description ===
      "string" &&
    tool.description.trim()
      ? tool.description
      : typeof tool.short_description ===
          "string" &&
        tool.short_description.trim()
      ? tool.short_description
      : typeof tool.overview ===
          "string" &&
        tool.overview.trim()
      ? tool.overview
      : "Verified AI software platform designed to improve productivity, creativity, and workflows.";

  return value.trim();
};

const getToolCategory = (
  tool: ToolRecord
): string =>
  typeof tool.category ===
    "string" &&
  tool.category.trim()
    ? tool.category.trim()
    : "General AI";

const getToolPricing = (
  tool: ToolRecord
): string => {
  const value =
    typeof tool.pricing_model ===
      "string" &&
    tool.pricing_model.trim()
      ? tool.pricing_model
      : typeof tool.pricing ===
          "string" &&
        tool.pricing.trim()
      ? tool.pricing
      : "Unknown";

  return value.trim();
};

/* =========================================================
   CANONICAL SCORE
========================================================= */

const getToolScore = (
  tool: ToolRecord
): number => {
  const raw =
    tool.ai_vault_score ??
    tool.score;

  const value =
    Number(raw);

  if (
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value)
    )
  );
};

/* =========================================================
   LOGO
========================================================= */

const getToolLogo = (
  tool: ToolRecord
): string | null => {
  const candidates = [
    tool.logo_url,
    tool.logo,
    tool.image_url,
    tool.icon_url,
  ];

  for (const value of candidates) {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return null;
};

/* =========================================================
   HOMEPAGE
========================================================= */

function HomeContent() {
  const searchParams =
    useSearchParams();

  const [
    tools,
    setTools,
  ] = useState<ToolRecord[]>([]);

  const [
    totalCount,
    setTotalCount,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    localSearch,
    setLocalSearch,
  ] = useState("");

  /*
   * Prevent duplicate impression events.
   */
  const impressionSent =
    useRef<Set<string>>(
      new Set()
    );

  /* =======================================================
     ACTIVE CATEGORY
  ======================================================= */

  const activeCat =
    searchParams
      .get("cat")
      ?.trim() || "ALL";

  const isAllCategory =
    activeCat.toLowerCase() ===
    "all";

  /* =======================================================
     FETCH DIRECTORY
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function fetchTools() {
      setLoading(true);

      try {
        /*
         * ===================================================
         * 1. EXACT DATABASE COUNT
         * ===================================================
         *
         * No hardcoded:
         * 740
         * 742
         * 419
         */

        let countQuery =
          supabase
            .from("ai_tools")
            .select("id", {
              count: "exact",
              head: true,
            });

        if (
          !isAllCategory
        ) {
          countQuery =
            countQuery.ilike(
              "category",
              activeCat
            );
        }

        const countResult =
          await countQuery;

        if (
          countResult.error
        ) {
          console.error(
            "[AI_VAULT_COUNT_ERROR]",
            countResult.error
          );
        }

        /*
         * ===================================================
         * 2. DIRECTORY QUERY
         * ===================================================
         */

        let query =
          supabase
            .from("ai_tools")
            .select("*")
            .order(
              "name",
              {
                ascending: true,
                nullsFirst: false,
              }
            );

        /*
         * Category filtering is database-side.
         *
         * This means:
         *
         * All      -> all tools
         * Chatbot  -> Chatbot tools
         * Coding   -> Coding tools
         * etc.
         */

        if (
          !isAllCategory
        ) {
          query =
            query.ilike(
              "category",
              activeCat
            );
        }

        const {
          data,
          error,
        } = await query;

        if (error) {
          throw error;
        }

        const rawData =
          Array.isArray(data)
            ? (data as ToolRecord[])
            : [];

        /*
         * ===================================================
         * 3. SAFE DEDUPLICATION
         * ===================================================
         *
         * IMPORTANT:
         *
         * We deduplicate using the database slug.
         *
         * We DO NOT create a slug from name.
         */

        const uniqueMap =
          new Map<
            string,
            ToolRecord
          >();

        for (
          const tool of rawData
        ) {
          const canonicalSlug =
            getCanonicalSlug(
              tool
            );

          /*
           * If database slug is missing,
           * do NOT manufacture a route from name.
           *
           * Keep the record in the catalog,
           * but give it an internal unique key.
           */

          const key =
            canonicalSlug
              ? `slug:${canonicalSlug}`
              : `id:${String(
                  tool.id ??
                    `missing-${Math.random()}`
                )}`;

          if (
            !uniqueMap.has(key)
          ) {
            uniqueMap.set(
              key,
              tool
            );
          }
        }

        const uniqueList =
          Array.from(
            uniqueMap.values()
          );

        if (
          cancelled
        ) {
          return;
        }

        setTools(
          uniqueList
        );

        /*
         * Exact DB count.
         *
         * If count query fails, use loaded list only
         * as a visual fallback.
         */

        if (
          !countResult.error &&
          typeof countResult.count ===
            "number"
        ) {
          setTotalCount(
            countResult.count
          );
        } else {
          setTotalCount(
            uniqueList.length
          );
        }
      } catch (error) {
        console.error(
          "[HOME_FETCH_ERR]",
          error
        );

        if (
          !cancelled
        ) {
          setTools([]);
          setTotalCount(0);
        }
      } finally {
        if (
          !cancelled
        ) {
          setLoading(false);
        }
      }
    }

    fetchTools();

    return () => {
      cancelled = true;
    };
  }, [
    activeCat,
    isAllCategory,
  ]);

  /* =========================================================
     LOCAL SEARCH
  ========================================================= */

  const filteredTools =
    useMemo(() => {
      const term =
        localSearch
          .toLowerCase()
          .trim();

      if (!term) {
        return tools;
      }

      return tools.filter(
        (tool) => {
          const name =
            getToolName(
              tool
            ).toLowerCase();

          const description =
            getToolDescription(
              tool
            ).toLowerCase();

          const category =
            getToolCategory(
              tool
            ).toLowerCase();

          const slug =
            getCanonicalSlug(
              tool
            ).toLowerCase();

          return (
            name.includes(term) ||
            description.includes(
              term
            ) ||
            category.includes(
              term
            ) ||
            slug.includes(term)
          );
        }
      );
    }, [
      tools,
      localSearch,
    ]);

  /* =========================================================
     IMPRESSIONS
  ========================================================= */

  useEffect(() => {
    if (loading) {
      return;
    }

    filteredTools.forEach(
      (tool, index) => {
        /*
         * CRITICAL:
         *
         * Traffic must also use canonical DB slug.
         */

        const slug =
          getCanonicalSlug(
            tool
          );

        /*
         * Missing slug:
         *
         * No fake tracking identifier from name.
         */

        if (!slug) {
          return;
        }

        if (
          impressionSent.current.has(
            slug
          )
        ) {
          return;
        }

        impressionSent.current.add(
          slug
        );

        try {
          trackToolImpression(
            slug,
            getToolName(
              tool
            ),
            getToolCategory(
              tool
            ),
            index
          );
        } catch (error) {
          console.error(
            "[TRAFFIC_IMPRESSION_ERR]",
            error
          );
        }
      }
    );
  }, [
    filteredTools,
    loading,
  ]);

  /* =========================================================
     DISPLAY COUNT
  ========================================================= */

  const totalDisplay =
    totalCount;

  /* =========================================================
     WEBSITE SCHEMA
  ========================================================= */

  const websiteSchema = {
    "@context":
      "https://schema.org",

    "@type":
      "WebSite",

    name:
      "AI Vault",

    url:
      SITE_URL,

    potentialAction: {
      "@type":
        "SearchAction",

      target: {
        "@type":
          "EntryPoint",

        urlTemplate:
          `${SITE_URL}/?q={search_term_string}`,
      },

      "query-input":
        "required name=search_term_string",
    },
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      {/* =====================================================
          WEBSITE JSON-LD
      ====================================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              websiteSchema
            ),
        }}
      />

      <main className="min-h-screen bg-[#fcfcfc] text-slate-950">

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">

          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">

            <Link
              href="/"
              className="text-xl font-black tracking-tight"
            >
              AI Vault
              <span className="text-blue-600">
                .
              </span>
            </Link>

            <div className="hidden items-center gap-5 md:flex">

              {categories
                .slice(0, 5)
                .map(
                  (category) => {
                    const active =
                      activeCat.toLowerCase() ===
                      category.name.toLowerCase();

                    return (
                      <Link
                        key={
                          category.name
                        }
                        href={
                          category.name ===
                          "All"
                            ? "/"
                            : `/?cat=${encodeURIComponent(
                                category.name
                              )}`
                        }
                        className={`text-sm font-medium transition ${
                          active
                            ? "text-blue-600"
                            : "text-slate-600 hover:text-blue-600"
                        }`}
                      >
                        {
                          category.name
                        }
                      </Link>
                    );
                  }
                )}

            </div>

            <div className="flex items-center gap-3">

              <div className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white">
                {totalDisplay.toLocaleString()}
              </div>

            </div>

          </div>

        </nav>

        {/* =================================================
            HERO
        ================================================= */}

        <header className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16">

          <div className="text-center">

            <h1 className="mx-auto max-w-5xl text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">

              Discover the World&apos;s

              <br />

              <span className="italic text-blue-600">
                Best AI Software
              </span>

            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">

              Discover, compare, and explore{" "}

              {totalDisplay.toLocaleString()}

              + verified AI tools,
              productivity software,
              developer utilities and
              business platforms.

            </p>

          </div>

          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="mx-auto mt-8 max-w-2xl">

            <div className="relative">

              <input
                type="text"
                value={
                  localSearch
                }
                onChange={(
                  event
                ) =>
                  setLocalSearch(
                    event.target.value
                  )
                }
                placeholder={
                  totalDisplay > 0
                    ? `Search ${totalDisplay.toLocaleString()}+ AI tools...`
                    : "Search AI tools by name, category..."
                }
                aria-label="Search AI tools"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 pr-14 text-sm font-medium outline-none shadow-sm transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2">

                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />

                  <path d="m20 20-4-4" />

                </svg>

              </div>

            </div>

          </div>

          {/* =================================================
              CATEGORY PILLS
          ================================================= */}

          <div className="mt-7 flex flex-wrap justify-center gap-2">

            {categories.map(
              (category) => {
                const active =
                  activeCat.toLowerCase() ===
                  category.name.toLowerCase();

                return (
                  <Link
                    key={
                      category.name
                    }
                    href={
                      category.name ===
                      "All"
                        ? "/"
                        : `/?cat=${encodeURIComponent(
                            category.name
                          )}`
                    }
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >

                    <span>
                      {
                        category.icon
                      }
                    </span>

                    <span>
                      {
                        category.name
                      }
                    </span>

                  </Link>
                );
              }
            )}

          </div>

        </header>

        {/* =================================================
            DIRECTORY
        ================================================= */}

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">

              Verified AI Directory{" "}

              <span className="text-blue-600">
                (
                {totalDisplay.toLocaleString()}
                )
              </span>

            </h2>

            {localSearch && (
              <button
                type="button"
                onClick={() =>
                  setLocalSearch("")
                }
                className="text-xs font-semibold text-slate-600 transition hover:text-blue-600"
              >
                Clear search
              </button>
            )}

          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="py-20 text-center">

              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm font-medium text-slate-500">
                Loading Verified AI Engines...
              </p>

            </div>
          ) : filteredTools.length ===
            0 ? (
            /* =================================================
               EMPTY
            ================================================= */

            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                🔎
              </div>

              <h3 className="mt-5 text-xl font-bold">
                No AI tools found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Try another search term or choose
                a different category.
              </p>

              <Link
                href="/"
                onClick={() =>
                  setLocalSearch("")
                }
                className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View All Tools
              </Link>

            </div>
          ) : (
            /* =================================================
               CARDS
            ================================================= */

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

              {filteredTools.map(
                (tool, index) => {
                  /*
                   * =================================================
                   * CANONICAL ROUTING
                   * =================================================
                   *
                   * NEVER:
                   *
                   * normalizeSlug(tool.name)
                   *
                   * NEVER:
                   *
                   * `/tool/${tool.name}`
                   *
                   * ONLY:
                   *
                   * `/tool/${tool.slug}`
                   */

                  const toolHref =
                    getToolHref(
                      tool
                    );

                  const canonicalSlug =
                    getCanonicalSlug(
                      tool
                    );

                  const name =
                    getToolName(
                      tool
                    );

                  const description =
                    getToolDescription(
                      tool
                    );

                  const category =
                    getToolCategory(
                      tool
                    );

                  const pricing =
                    getToolPricing(
                      tool
                    );

                  const score =
                    getToolScore(
                      tool
                    );

                  const logoUrl =
                    getToolLogo(
                      tool
                    );

                  /*
                   * If slug is missing, don't create a
                   * fake route from the name.
                   *
                   * Keep card visible so the database
                   * issue is not hidden.
                   */

                  if (!toolHref) {
                    return (
                      <div
                        key={String(
                          tool.id ??
                            `missing-${index}`
                        )}
                        className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm"
                      >

                        <div className="space-y-4">

                          <div className="flex items-start justify-between gap-3">

                            <div className="flex min-w-0 items-center gap-3">

                              <ToolLogo
                                src={
                                  logoUrl
                                }
                                fallbackSrc={
                                  typeof tool.logo ===
                                  "string"
                                    ? tool.logo
                                    : null
                                }
                                name={
                                  name
                                }
                                size="md"
                              />

                              <div className="min-w-0">

                                <h3 className="truncate text-base font-bold text-slate-950">
                                  {
                                    name
                                  }
                                </h3>

                                <p className="mt-1 text-xs font-medium text-slate-500">
                                  {
                                    category
                                  }
                                </p>

                              </div>

                            </div>

                            <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                              Slug Missing
                            </span>

                          </div>

                          <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">
                            {
                              description
                            }
                          </p>

                        </div>

                      </div>
                    );
                  }

                  return (
                    <Link
                      key={String(
                        tool.id ??
                          canonicalSlug
                      )}
                      href={
                        toolHref
                      }
                      onClick={() => {
                        try {
                          trackToolClick(
                            canonicalSlug,
                            name,
                            category,
                            index
                          );
                        } catch (
                          error
                        ) {
                          console.error(
                            "[TRAFFIC_CLICK_ERR]",
                            error
                          );
                        }
                      }}
                      className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                    >

                      <div className="space-y-4">

                        {/* =================================================
                            TOOL HEADER
                        ================================================= */}

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex min-w-0 items-center gap-3">

                            <ToolLogo
                              src={
                                logoUrl
                              }
                              fallbackSrc={
                                typeof tool.logo ===
                                "string"
                                  ? tool.logo
                                  : null
                              }
                              name={
                                name
                              }
                              size="md"
                            />

                            <div className="min-w-0">

                              <h3 className="truncate text-base font-bold text-slate-950">
                                {
                                  name
                                }
                              </h3>

                              <p className="mt-1 text-xs font-medium text-slate-500">
                                {
                                  category
                                }
                              </p>

                            </div>

                          </div>

                          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                            {
                              pricing
                            }
                          </span>

                        </div>

                        {/* =================================================
                            DESCRIPTION
                        ================================================= */}

                        <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">
                          {
                            description
                          }
                        </p>

                        {/* =================================================
                            FOOTER
                        ================================================= */}

                        <div className="flex items-center justify-between border-t border-slate-100 pt-4">

                          <div className="flex items-center gap-3">

                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              {
                                category
                              }
                            </span>

                            {score >
                              0 && (
                              <span className="text-[10px] font-bold text-slate-500">
                                {
                                  score
                                }
                                /100
                              </span>
                            )}

                          </div>

                          <span className="flex items-center gap-1 text-sm font-bold text-slate-950 transition group-hover:text-blue-600">

                            Explore

                            <span
                              aria-hidden="true"
                              className="transition-transform group-hover:translate-x-1"
                            >
                              →
                            </span>

                          </span>

                        </div>

                      </div>

                    </Link>
                  );
                }
              )}

            </div>
          )}

        </section>

      </main>
    </>
  );
}

/* =========================================================
   PAGE EXPORT
========================================================= */

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#fcfcfc] text-slate-950">

          <div className="flex min-h-screen items-center justify-center">

            <div className="text-center">

              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm font-medium text-slate-500">
                Loading AI Vault...
              </p>

            </div>

          </div>

        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
