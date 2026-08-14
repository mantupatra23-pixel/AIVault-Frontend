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
   *
   * NEVER generate a slug from tool.name.
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

const getSupabase = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  return createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
};

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
   CANONICAL SLUG
========================================================= */

/*
 * This function ONLY reads the database slug.
 *
 * NEVER:
 *
 * normalizeSlug(tool.name)
 *
 * NEVER:
 *
 * create a slug from the tool name.
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

/*
 * Generate the frontend route ONLY
 * from the canonical database slug.
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
): string => {
  if (
    typeof tool.name === "string" &&
    tool.name.trim()
  ) {
    return tool.name.trim();
  }

  return "AI Tool";
};

/*
 * Remove known generated template language
 * from DISPLAYED canonical content.
 *
 * This does not modify Supabase.
 *
 * Database cleanup must be done separately
 * after the audit.
 */
const cleanGeneratedContent = (
  value: unknown
): string => {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  let text = value.trim();

  if (!text) {
    return "";
  }

  text = text.replace(
    /As a Senior SEO & AI Analyst for Visora AI,?\s*/gi,
    ""
  );

  text = text.replace(
    /As a Senior SEO and AI Analyst for Visora AI,?\s*/gi,
    ""
  );

  text = text.replace(
    /In this professional review,?\s*/gi,
    ""
  );

  text = text.replace(
    /Our professional review aims to provide an in-depth analysis of the tool,?\s*/gi,
    ""
  );

  return text
    .replace(/\s{2,}/g, " ")
    .trim();
};

const getToolDescription = (
  tool: ToolRecord
): string => {
  const candidates = [
    tool.description,
    tool.short_description,
    tool.overview,
  ];

  for (
    const candidate of candidates
  ) {
    const cleaned =
      cleanGeneratedContent(
        candidate
      );

    if (cleaned) {
      return cleaned;
    }
  }

  /*
   * IMPORTANT:
   *
   * Do NOT fabricate a generic description.
   */
  return "Description not specified.";
};

const getToolCategory = (
  tool: ToolRecord
): string => {
  if (
    typeof tool.category === "string" &&
    tool.category.trim()
  ) {
    return tool.category.trim();
  }

  return "General AI";
};

/* =========================================================
   PRICING NORMALIZATION
========================================================= */

const normalizePricing = (
  value: unknown
): string => {
  if (
    typeof value !== "string"
  ) {
    return "Unknown";
  }

  const raw =
    value.trim();

  if (!raw) {
    return "Unknown";
  }

  const v =
    raw.toLowerCase();

  if (
    v.includes("freemium")
  ) {
    return "Freemium";
  }

  if (
    v === "free" ||
    v.includes("free plan") ||
    v.includes("free to use")
  ) {
    return "Free";
  }

  if (
    v.includes("free trial") ||
    v.includes("trial")
  ) {
    return "Free Trial";
  }

  if (
    v.includes("contact sales") ||
    v.includes("contact us")
  ) {
    return "Contact Sales";
  }

  if (
    v.includes("open source") ||
    v.includes("opensource")
  ) {
    return "Open Source";
  }

  if (
    v.includes("enterprise")
  ) {
    return "Enterprise";
  }

  if (
    v.includes("paid") ||
    v.includes("subscription")
  ) {
    return "Paid";
  }

  /*
   * Preserve the actual DB value
   * when it doesn't match a controlled
   * value rather than inventing data.
   */
  return raw;
};

const getToolPricing = (
  tool: ToolRecord
): string => {
  const pricingModel =
    typeof tool.pricing_model ===
      "string"
      ? tool.pricing_model.trim()
      : "";

  const pricing =
    typeof tool.pricing ===
      "string"
      ? tool.pricing.trim()
      : "";

  return normalizePricing(
    pricingModel || pricing
  );
};

/* =========================================================
   AI VAULT SCORE
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

  for (
    const value of candidates
  ) {
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
   HOME CONTENT
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
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    localSearch,
    setLocalSearch,
  ] = useState("");

  /*
   * Prevent duplicate impression events
   * during React re-renders.
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
     FETCH TOOLS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function fetchTools() {
      setLoading(true);
      setErrorMessage("");

      try {
        const supabase =
          getSupabase();

        /* =================================================
           1. EXACT DATABASE COUNT
        ================================================= */

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

        /* =================================================
           2. DIRECTORY QUERY
        ================================================= */

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

        /* =================================================
           3. SAFE DEDUPLICATION
        ================================================= */

        const uniqueMap =
          new Map<
            string,
            ToolRecord
          >();

        rawData.forEach(
          (
            tool,
            index
          ) => {
            const slug =
              getCanonicalSlug(
                tool
              );

            /*
             * If slug exists:
             *
             * slug is the unique identity.
             *
             * If slug is missing:
             *
             * DO NOT manufacture a slug
             * from name.
             */
            const key =
              slug
                ? `slug:${slug}`
                : tool.id != null
                ? `id:${String(
                    tool.id
                  )}`
                : `missing:${index}`;

            if (
              !uniqueMap.has(key)
            ) {
              uniqueMap.set(
                key,
                tool
              );
            }
          }
        );

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

        /* =================================================
           4. COUNT
        ================================================= */

        if (
          !countResult.error &&
          typeof countResult.count ===
            "number"
        ) {
          setTotalCount(
            countResult.count
          );
        } else {
          /*
           * Visual fallback only.
           */
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

          setErrorMessage(
            "Unable to load the AI tool directory. Please try again."
          );
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
         * Traffic tracking uses ONLY
         * canonical database slug.
         */

        const slug =
          getCanonicalSlug(
            tool
          );

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
     RESET
  ========================================================= */

  const handleViewAll =
    () => {
      setLocalSearch("");

      window.history.replaceState(
        null,
        "",
        "/"
      );

      window.location.reload();
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

              {isAllCategory
                ? "Verified AI Directory"
                : `${activeCat} AI Tools`}

              {" "}

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
                  setLocalSearch(
                    ""
                  )
                }
                className="text-xs font-semibold text-slate-600 transition hover:text-blue-600"
              >
                Clear search
              </button>
            )}

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {errorMessage ? (
            <div className="rounded-3xl border border-red-100 bg-white px-6 py-16 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-2xl">
                !
              </div>

              <h3 className="mt-5 text-xl font-bold">
                Directory unavailable
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {errorMessage}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Try Again
              </button>

            </div>
          ) : loading ? (

            /* =================================================
               LOADING
            ================================================= */

            <div className="py-20 text-center">

              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm font-medium text-slate-500">
                Loading Verified AI Engines...
              </p>

            </div>

          ) : filteredTools.length === 0 ? (

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
                Try another search term or choose a different category.
              </p>

              <button
                type="button"
                onClick={
                  handleViewAll
                }
                className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View All Tools
              </button>

            </div>

          ) : (

            /* =================================================
               TOOL GRID
            ================================================= */

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

              {filteredTools.map(
                (
                  tool,
                  index
                ) => {

                  const href =
                    getToolHref(
                      tool
                    );

                  /*
                   * No canonical slug =
                   * no clickable fake route.
                   */
                  if (!href) {
                    return (
                      <article
                        key={
                          tool.id != null
                            ? String(
                                tool.id
                              )
                            : `missing-${index}`
                        }
                        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                      >

                        <div className="flex items-start gap-3">

                          <ToolLogo
                            src={getToolLogo(
                              tool
                            )}
                            fallbackSrc={
                              typeof tool.logo ===
                                "string"
                                ? tool.logo
                                : null
                            }
                            name={getToolName(
                              tool
                            )}
                            size="md"
                          />

                          <div className="min-w-0">

                            <h3 className="truncate text-base font-bold text-slate-950">
                              {
                                getToolName(
                                  tool
                                )
                              }
                            </h3>

                            <p className="mt-1 text-xs font-medium text-slate-500">
                              {
                                getToolCategory(
                                  tool
                                )
                              }
                            </p>

                          </div>

                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-500">
                          This tool does not currently have a canonical database URL.
                        </p>

                      </article>
                    );
                  }

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

                  const logoUrl =
                    getToolLogo(
                      tool
                    );

                  const score =
                    getToolScore(
                      tool
                    );

                  return (
                    <Link
                      key={
                        tool.id != null
                          ? String(
                              tool.id
                            )
                          : getCanonicalSlug(
                              tool
                            )
                      }
                      href={
                        href
                      }
                      onClick={() => {
                        try {
                          const slug =
                            getCanonicalSlug(
                              tool
                            );

                          if (
                            !slug
                          ) {
                            return;
                          }

                          trackToolClick(
                            slug,
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

                        {/* =================================
                            TOOL HEADER
                        ================================== */}

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

                              <p className="mt-1 truncate text-xs font-medium text-slate-500">
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

                        {/* =================================
                            DESCRIPTION
                        ================================== */}

                        <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">
                          {
                            description
                          }
                        </p>

                        {/* =================================
                            FOOTER
                        ================================== */}

                        <div className="flex items-center justify-between border-t border-slate-100 pt-4">

                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            {
                              category
                            }
                          </span>

                          <div className="flex items-center gap-3">

                            <span
                              className="text-[10px] font-bold text-slate-400"
                              title="AI Vault catalog/data quality score"
                            >
                              AV Score{" "}
                              {
                                score
                              }
                              /100
                            </span>

                            <span className="flex items-center gap-1 text-sm font-bold text-blue-600 transition group-hover:translate-x-0.5">
                              Explore
                              <span aria-hidden="true">
                                →
                              </span>
                            </span>

                          </div>

                        </div>

                      </div>

                    </Link>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="border-t border-slate-200 bg-white">

          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-xs text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">

            <p>
              ©{" "}
              {new Date().getFullYear()}{" "}
              AI Vault. All rights reserved.
            </p>

            <div className="flex flex-wrap gap-4">

              <Link
                href="/"
                className="transition hover:text-blue-600"
              >
                AI Tools
              </Link>

              <Link
                href="/ai-finder"
                className="transition hover:text-blue-600"
              >
                AI Finder
              </Link>

              <Link
                href="/compare"
                className="transition hover:text-blue-600"
              >
                Compare
              </Link>

              <Link
                href="/saved"
                className="transition hover:text-blue-600"
              >
                Saved
              </Link>

            </div>

          </div>

        </footer>

      </main>
    </>
  );
}

/* =========================================================
   PAGE WRAPPER
========================================================= */

/*
 * useSearchParams() requires a Suspense boundary
 * in the App Router for reliable production builds.
 */
export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#fcfcfc] text-slate-950">

          <div className="text-center">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading AI Vault...
            </p>

          </div>

        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
