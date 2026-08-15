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

import {
  useSearchParams,
} from "next/navigation";

import dynamic from "next/dynamic";

import ToolLogo from "@/components/ToolLogo";

import Vault3DCard from "@/components/Vault3DCard";

import {
  trackToolClick,
  trackToolImpression,
} from "@/lib/traffic-tracker";

import { SITE_URL } from "@/lib/site-url";

/* =========================================================
   3D HERO
========================================================= */

const Vault3DHero = ({ toolCount }: { toolCount?: number }) => (
  <section className="min-h-[620px] bg-[#050714] relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.22),transparent_45%)]" />
    <div className="relative z-10 flex min-h-[620px] items-center justify-center">
      <div className="h-32 w-32 rounded-full border border-blue-400/30 bg-gradient-to-br from-blue-500/30 via-violet-500/30 to-transparent shadow-[0_0_80px_rgba(99,102,241,0.35)]" />
    </div>
  </section>
);

/* =========================================================
   TYPES
========================================================= */

type ToolRecord = {
  id?: string | number | null;

  slug?: string | null;

  name?: string | null;

  description?: string | null;

  short_description?: string | null;

  overview?: string | null;

  category?: string | null;

  pricing?: string | null;

  pricing_model?: string | null;

  score?: number | string | null;

  ai_vault_score?:
    | number
    | string
    | null;

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
  process.env
    .NEXT_PUBLIC_SUPABASE_URL ||
  "";

const SUPABASE_ANON_KEY =
  process.env
    .NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const getSupabase = () => {
  if (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY
  ) {
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

const getCanonicalSlug = (
  tool: ToolRecord
): string => {
  if (
    typeof tool.slug !==
    "string"
  ) {
    return "";
  }

  return tool.slug.trim();
};

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
   HELPERS
========================================================= */

const getToolName = (
  tool: ToolRecord
): string => {
  if (
    typeof tool.name ===
      "string" &&
    tool.name.trim()
  ) {
    return tool.name.trim();
  }

  return "AI Tool";
};

const cleanGeneratedContent = (
  value: unknown
): string => {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  let text =
    value.trim();

  if (!text) {
    return "";
  }

  const patterns = [
    /As a Senior SEO & AI Analyst for Visora AI,?\s*/gi,

    /As a Senior SEO and AI Analyst for Visora AI,?\s*/gi,

    /In this professional review,?\s*/gi,

    /Our professional review aims to provide an in-depth analysis of the tool,?\s*/gi,
  ];

  for (
    const pattern of patterns
  ) {
    text =
      text.replace(
        pattern,
        ""
      );
  }

  return text
    .replace(
      /\s{2,}/g,
      " "
    )
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

  return "Description not specified.";
};

const getToolCategory = (
  tool: ToolRecord
): string => {
  if (
    typeof tool.category ===
      "string" &&
    tool.category.trim()
  ) {
    return tool.category.trim();
  }

  return "General AI";
};

/* =========================================================
   PRICING
========================================================= */

const normalizePricing = (
  value: unknown
): string => {
  if (
    typeof value !==
    "string"
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
    v.includes(
      "free plan"
    ) ||
    v.includes(
      "free to use"
    )
  ) {
    return "Free";
  }

  if (
    v.includes(
      "free trial"
    ) ||
    v.includes("trial")
  ) {
    return "Free Trial";
  }

  if (
    v.includes(
      "contact sales"
    ) ||
    v.includes(
      "contact us"
    )
  ) {
    return "Contact Sales";
  }

  if (
    v.includes(
      "open source"
    ) ||
    v.includes(
      "opensource"
    )
  ) {
    return "Open Source";
  }

  if (
    v.includes(
      "enterprise"
    )
  ) {
    return "Enterprise";
  }

  if (
    v.includes("paid") ||
    v.includes(
      "subscription"
    )
  ) {
    return "Paid";
  }

  return raw;
};

const getToolPricing = (
  tool: ToolRecord
): string => {
  const model =
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
    model || pricing
  );
};

/* =========================================================
   SCORE
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
      typeof value ===
        "string" &&
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
  ] = useState<
    ToolRecord[]
  >([]);

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

  const impressionSent =
    useRef<
      Set<string>
    >(new Set());

  /* =======================================================
     CATEGORY
  ======================================================= */

  const activeCat =
    searchParams
      .get("cat")
      ?.trim() || "ALL";

  const isAllCategory =
    activeCat.toLowerCase() ===
    "all";

  /* =======================================================
     FETCH
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    async function fetchTools() {
      setLoading(true);

      setErrorMessage("");

      try {
        const supabase =
          getSupabase();

        let countQuery =
          supabase
            .from("ai_tools")
            .select(
              "id",
              {
                count:
                  "exact",
                head: true,
              }
            );

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

        let query =
          supabase
            .from("ai_tools")
            .select("*")
            .order(
              "name",
              {
                ascending:
                  true,
                nullsFirst:
                  false,
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
        } =
          await query;

        if (error) {
          throw error;
        }

        const rawData =
          Array.isArray(data)
            ? (data as ToolRecord[])
            : [];

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

            const key =
              slug
                ? `slug:${slug}`
                : tool.id !=
                  null
                ? `id:${String(
                    tool.id
                  )}`
                : `missing:${index}`;

            if (
              !uniqueMap.has(
                key
              )
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

          setErrorMessage(
            "Unable to load the AI tool directory. Please try again."
          );
        }
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false
          );
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
     SEARCH
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
            name.includes(
              term
            ) ||
            description.includes(
              term
            ) ||
            category.includes(
              term
            ) ||
            slug.includes(
              term
            )
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
      (
        tool,
        index
      ) => {
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
        } catch (
          error
        ) {
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

  const totalDisplay =
    totalCount;

  /* =========================================================
     WEBSITE SCHEMA
  ========================================================= */

  const websiteSchema =
    {
      "@context":
        "https://schema.org",

      "@type":
        "WebSite",

      name: "AI Vault",

      url: SITE_URL,

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
     VIEW ALL
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              websiteSchema
            ),
        }}
      />

      <main className="min-h-screen bg-[#f8faff] text-slate-950">

        {/* =================================================
            NAV
        ================================================= */}

        <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-2xl">

          <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">

            <Link
              href="/"
              className="group flex items-center gap-2"
            >

              <span className="text-xl font-black tracking-[-0.04em]">
                AI Vault
                <span className="text-blue-600">
                  .
                </span>
              </span>

            </Link>

            <div className="hidden items-center gap-6 md:flex">

              {categories
                .slice(0, 5)
                .map(
                  (
                    category
                  ) => {
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
                        className={`text-sm font-semibold transition ${
                          active
                            ? "text-blue-600"
                            : "text-slate-500 hover:text-blue-600"
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

            <div className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-blue-500/20">
              {totalDisplay.toLocaleString()}
            </div>

          </div>

        </nav>

        {/* =================================================
            3D HERO
        ================================================= */}

        <Vault3DHero
          toolCount={
            totalDisplay
          }
        />

        {/* =================================================
            SEARCH AREA
        ================================================= */}

        <section className="relative z-20 -mt-8 px-4">

          <div className="mx-auto max-w-4xl rounded-[28px] border border-white/80 bg-white/95 p-3 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">

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
                  totalDisplay
                    ? `Search ${totalDisplay.toLocaleString()}+ AI tools...`
                    : "Search AI tools..."
                }
                aria-label="Search AI tools"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-5 pr-14 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

              <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">

                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
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

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">

              {categories.map(
                (
                  category
                ) => {
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
                      className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition ${
                        active
                          ? "border-slate-950 bg-slate-950 text-white shadow-lg"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
                      }`}
                    >
                      <span>
                        {
                          category.icon
                        }
                      </span>

                      {
                        category.name
                      }
                    </Link>
                  );
                }
              )}

            </div>

          </div>

        </section>

        {/* =================================================
            DIRECTORY
        ================================================= */}

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">

          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">

            <div>

              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                AI DISCOVERY ENGINE
              </div>

              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">

                {isAllCategory
                  ? "Verified AI Directory"
                  : `${activeCat} AI Tools`}

                <span className="ml-2 text-blue-600">
                  (
                  {totalDisplay.toLocaleString()}
                  )
                </span>

              </h2>

            </div>

            {localSearch && (
              <button
                type="button"
                onClick={() =>
                  setLocalSearch(
                    ""
                  )
                }
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-600"
              >
                Clear search
              </button>
            )}

          </div>

          {/* ERROR */}

          {errorMessage ? (
            <div className="rounded-[30px] border border-red-100 bg-white px-6 py-20 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-red-500">
                !
              </div>

              <h3 className="mt-5 text-xl font-black">
                Directory unavailable
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {errorMessage}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white"
              >
                Try Again
              </button>

            </div>
          ) : loading ? (
            <div className="py-24 text-center">

              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-5 text-sm font-bold text-slate-500">
                Loading Intelligence Vault...
              </p>

            </div>
          ) : filteredTools.length ===
            0 ? (
            <div className="rounded-[30px] border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                🔎
              </div>

              <h3 className="mt-5 text-xl font-black">
                No AI tools found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Try another search term or choose another category.
              </p>

              <button
                type="button"
                onClick={
                  handleViewAll
                }
                className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white"
              >
                View All Tools
              </button>

            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

              {filteredTools.map(
                (
                  tool,
                  index
                ) => {
                  const href =
                    getToolHref(
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

                  const logoUrl =
                    getToolLogo(
                      tool
                    );

                  const score =
                    getToolScore(
                      tool
                    );

                  if (!href) {
                    return (
                      <Vault3DCard
                        key={
                          tool.id !=
                          null
                            ? String(
                                tool.id
                              )
                            : `missing-${index}`
                        }
                      >
                        <div className="p-6">

                          <div className="flex items-center gap-4">

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

                            <div>

                              <h3 className="font-black">
                                {
                                  name
                                }
                              </h3>

                              <p className="text-xs text-slate-500">
                                {
                                  category
                                }
                              </p>

                            </div>

                          </div>

                          <p className="mt-5 text-sm text-slate-500">
                            Canonical database URL unavailable.
                          </p>

                        </div>
                      </Vault3DCard>
                    );
                  }

                  return (
                    <Vault3DCard
                      key={
                        tool.id !=
                        null
                          ? String(
                              tool.id
                            )
                          : getCanonicalSlug(
                              tool
                            )
                      }
                    >

                      <Link
                        href={
                          href
                        }
                        onClick={() => {
                          try {
                            const slug =
                              getCanonicalSlug(
                                tool
                              );

                            if (!slug) {
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
                        className="block h-full p-6"
                      >

                        {/* HEADER */}

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex min-w-0 items-center gap-4">

                            <div className="relative">

                              <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-lg opacity-0 transition group-hover:opacity-100" />

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

                            </div>

                            <div className="min-w-0">

                              <h3 className="truncate text-base font-black text-slate-950">
                                {
                                  name
                                }
                              </h3>

                              <p className="mt-1 truncate text-xs font-semibold text-slate-400">
                                {
                                  category
                                }
                              </p>

                            </div>

                          </div>

                          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black text-slate-600">
                            {
                              pricing
                            }
                          </span>

                        </div>

                        {/* DESCRIPTION */}

                        <p className="mt-5 line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-500">
                          {
                            description
                          }
                        </p>

                        {/* SCORE */}

                        <div className="mt-5">

                          <div className="mb-2 flex items-center justify-between">

                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                              AI Vault Score
                            </span>

                            <span className="text-xs font-black text-blue-600">
                              {
                                score
                              }
                              /100
                            </span>

                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">

                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                              style={{
                                width: `${score}%`,
                              }}
                            />

                          </div>

                        </div>

                        {/* FOOTER */}

                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Verified AI Tool
                          </span>

                          <span className="text-sm font-black text-blue-600 transition group-hover:translate-x-1">
                            Explore →
                          </span>

                        </div>

                      </Link>

                    </Vault3DCard>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* =================================================
            PREMIUM CTA
        ================================================= */}

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">

          <div className="relative overflow-hidden rounded-[36px] bg-[#050714] px-6 py-16 text-center text-white shadow-[0_30px_100px_rgba(15,23,42,0.15)] sm:px-10">

            <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[100px]" />

            <div className="relative">

              <div className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-blue-300">
                THE INTELLIGENCE VAULT
              </div>

              <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
                Find the right AI.
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                Search, compare and discover the next generation of AI software from one intelligent directory.
              </p>

              <Link
                href="/ai-finder"
                className="mt-8 inline-flex rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-1"
              >
                Find My AI Tool →
              </Link>

            </div>

          </div>

        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="border-t border-slate-200 bg-white">

          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">

            <p>
              ©{" "}
              {new Date().getFullYear()}{" "}
              AI Vault. All rights reserved.
            </p>

            <div className="flex flex-wrap gap-5">

              <Link
                href="/"
                className="hover:text-blue-600"
              >
                AI Tools
              </Link>

              <Link
                href="/ai-finder"
                className="hover:text-blue-600"
              >
                AI Finder
              </Link>

              <Link
                href="/compare"
                className="hover:text-blue-600"
              >
                Compare
              </Link>

              <Link
                href="/saved"
                className="hover:text-blue-600"
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
   PAGE
========================================================= */

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#050714]">

          <div className="text-center">

            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-blue-500" />

            <p className="mt-5 text-sm font-bold text-slate-400">
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
