"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { createClient } from "@supabase/supabase-js";

/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getSupabase() {
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
}

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

  ai_vault_score?: number | string | null;

  logo_url?: string | null;

  logo?: string | null;

  image_url?: string | null;

  icon_url?: string | null;

  website_url?: string | null;

  official_website?: string | null;

  official_website_url?: string | null;

  website?: string | null;

  url?: string | null;

  external_url?: string | null;

  features?: unknown;

  key_features?: unknown;

  feature_list?: unknown;

  use_cases?: unknown;

  useCases?: unknown;

  integrations?: unknown;

  integration_list?: unknown;

  platforms?: unknown;

  platform?: unknown;

  operating_system?: unknown;

  operating_systems?: unknown;

  deployment?: unknown;

  deployment_type?: unknown;

  license?: unknown;

  limitations?: unknown;

  limitation?: unknown;

  pros?: unknown;

  cons?: unknown;

  tags?: unknown;

  [key: string]: unknown;
};

/* =========================================================
   HELPERS
========================================================= */

function text(
  value: unknown
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

function firstText(
  ...values: unknown[]
): string {
  for (
    const value of values
  ) {
    const result =
      text(value);

    if (result) {
      return result;
    }
  }

  return "";
}

/* =========================================================
   CLEAN AI CONTENT
========================================================= */

function cleanContent(
  value: unknown
): string {
  let result =
    text(value);

  if (!result) {
    return "";
  }

  const removePatterns = [
    /As a Senior SEO & AI Analyst for Visora AI,?\s*/gi,

    /As a Senior SEO and AI Analyst for Visora AI,?\s*/gi,

    /As a professional AI analyst,?\s*/gi,

    /In this professional review,?\s*/gi,

    /Our professional review aims to provide an in-depth analysis of the tool,?\s*/gi,

    /This comprehensive review provides an in-depth analysis of[^.]*\.\s*/gi,
  ];

  for (
    const pattern of removePatterns
  ) {
    result =
      result.replace(
        pattern,
        ""
      );
  }

  return result
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

/* =========================================================
   NAME
========================================================= */

function getName(
  tool: ToolRecord
): string {
  return (
    firstText(
      tool.name
    ) ||
    "AI Tool"
  );
}

/* =========================================================
   CATEGORY
========================================================= */

function getCategory(
  tool: ToolRecord
): string {
  return (
    firstText(
      tool.category
    ) ||
    "General AI"
  );
}

/* =========================================================
   DESCRIPTION
========================================================= */

function getDescription(
  tool: ToolRecord
): string {
  const candidates = [
    tool.description,
    tool.short_description,
    tool.overview,
  ];

  for (
    const candidate of candidates
  ) {
    const cleaned =
      cleanContent(
        candidate
      );

    if (
      cleaned &&
      cleaned.length > 20
    ) {
      return cleaned;
    }
  }

  return `${getName(
    tool
  )} is an AI-powered tool listed in the AI Vault directory. Explore its features, pricing, supported platforms and official product information.`;
}

/* =========================================================
   PRICING
========================================================= */

function normalizePricing(
  value: unknown
): string {
  const raw =
    text(value);

  if (!raw) {
    return "Unknown";
  }

  const lower =
    raw.toLowerCase();

  if (
    lower.includes(
      "freemium"
    )
  ) {
    return "Freemium";
  }

  if (
    lower === "free" ||
    lower.includes(
      "free plan"
    ) ||
    lower.includes(
      "free to use"
    )
  ) {
    return "Free";
  }

  if (
    lower.includes(
      "free trial"
    ) ||
    lower === "trial"
  ) {
    return "Free Trial";
  }

  if (
    lower.includes(
      "open source"
    ) ||
    lower.includes(
      "opensource"
    )
  ) {
    return "Open Source";
  }

  if (
    lower.includes(
      "contact sales"
    )
  ) {
    return "Contact Sales";
  }

  if (
    lower.includes(
      "enterprise"
    )
  ) {
    return "Enterprise";
  }

  if (
    lower.includes(
      "subscription"
    ) ||
    lower.includes(
      "paid"
    )
  ) {
    return "Paid";
  }

  return raw;
}

function getPricing(
  tool: ToolRecord
): string {
  return normalizePricing(
    firstText(
      tool.pricing_model,
      tool.pricing
    )
  );
}

/* =========================================================
   SCORE
========================================================= */

function getToolScore(
  tool: ToolRecord
): number {
  const raw =
    tool.ai_vault_score ??
    tool.score;

  const value =
    Number(raw);

  if (
    !Number.isFinite(
      value
    )
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
}

/* =========================================================
   CONTENT QUALITY
========================================================= */

function getContentQuality(
  tool: ToolRecord
): number {
  let points = 0;

  const description =
    getDescription(tool);

  if (
    description.length >
    80
  ) {
    points += 20;
  }

  if (
    getList(
      tool.features ??
        tool.key_features ??
        tool.feature_list
    ).length > 0
  ) {
    points += 20;
  }

  if (
    getList(
      tool.use_cases ??
        tool.useCases
    ).length > 0
  ) {
    points += 15;
  }

  if (
    getList(
      tool.integrations ??
        tool.integration_list
    ).length > 0
  ) {
    points += 15;
  }

  if (
    getList(
      tool.platforms ??
        tool.platform ??
        tool.operating_system ??
        tool.operating_systems
    ).length > 0
  ) {
    points += 10;
  }

  if (
    getWebsite(tool)
  ) {
    points += 10;
  }

  if (
    getPricing(tool) !==
    "Unknown"
  ) {
    points += 10;
  }

  return Math.min(
    100,
    points
  );
}

/* =========================================================
   LOGO
========================================================= */

function getLogo(
  tool: ToolRecord
): string {
  return firstText(
    tool.logo_url,
    tool.logo,
    tool.image_url,
    tool.icon_url
  );
}

/* =========================================================
   WEBSITE
========================================================= */

function getWebsite(
  tool: ToolRecord
): string {
  const candidates = [
    tool.website_url,
    tool.official_website_url,
    tool.official_website,
    tool.website,
    tool.external_url,
    tool.url,
  ];

  for (
    const candidate of candidates
  ) {
    const value =
      text(candidate);

    if (!value) {
      continue;
    }

    if (
      value.startsWith(
        "http://"
      ) ||
      value.startsWith(
        "https://"
      )
    ) {
      return value;
    }

    if (
      value.startsWith(
        "www."
      )
    ) {
      return `https://${value}`;
    }

    if (
      value.includes(".")
    ) {
      return `https://${value}`;
    }
  }

  return "";
}

/* =========================================================
   ARRAY NORMALIZER
========================================================= */

function getList(
  value: unknown
): string[] {
  if (
    Array.isArray(value)
  ) {
    return value
      .flatMap(
        (item) => {
          if (
            typeof item ===
            "string"
          ) {
            return [
              item
                .trim(),
            ];
          }

          if (
            item &&
            typeof item ===
              "object"
          ) {
            const object =
              item as Record<
                string,
                unknown
              >;

            const found =
              firstText(
                object.name,
                object.title,
                object.label,
                object.value,
                object.description
              );

            return found
              ? [found]
              : [];
          }

          return [];
        }
      )
      .filter(Boolean);
  }

  if (
    typeof value ===
    "string"
  ) {
    const raw =
      value.trim();

    if (!raw) {
      return [];
    }

    try {
      const parsed =
        JSON.parse(raw);

      if (
        Array.isArray(
          parsed
        )
      ) {
        return getList(
          parsed
        );
      }
    } catch {
      // Normal text.
    }

    return raw
      .split(
        /[\n,;|]+/
      )
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean);
  }

  return [];
}

/* =========================================================
   GENERIC FIELD
========================================================= */

function getFieldList(
  tool: ToolRecord,
  keys: string[]
): string[] {
  for (
    const key of keys
  ) {
    const value =
      tool[key];

    const list =
      getList(value);

    if (
      list.length > 0
    ) {
      return list;
    }
  }

  return [];
}

/* =========================================================
   TOOL DATA MODEL
========================================================= */

function buildToolData(
  tool: ToolRecord
) {
  return {
    features:
      getFieldList(
        tool,
        [
          "features",
          "key_features",
          "feature_list",
        ]
      ),

    useCases:
      getFieldList(
        tool,
        [
          "use_cases",
          "useCases",
          "use_case",
          "usecase",
        ]
      ),

    integrations:
      getFieldList(
        tool,
        [
          "integrations",
          "integration_list",
        ]
      ),

    platforms:
      getFieldList(
        tool,
        [
          "platforms",
          "platform",
          "supported_platforms",
        ]
      ),

    limitations:
      getFieldList(
        tool,
        [
          "limitations",
          "limitation",
          "cons",
        ]
      ),

    tags:
      getFieldList(
        tool,
        [
          "tags",
        ]
      ),
  };
}

/* =========================================================
   UI COMPONENTS
========================================================= */

function Pill({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-600">
      {children}
    </span>
  );
}

function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
      {children}
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-400">
      {text}
    </div>
  );
}

function ScoreCircle({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[7px] border-slate-100">
        <div className="text-center">
          <div className="text-xl font-black text-slate-950">
            {score}
          </div>

          <div className="text-[8px] font-bold text-slate-400">
            /100
          </div>
        </div>
      </div>

      <div>
        <div className="text-sm font-black text-slate-950">
          {label}
        </div>

        <div className="mt-1 text-xs text-slate-500">
          AI Vault evaluation
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ToolDetailPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const rawSlug =
    params?.slug;

  const slug =
    Array.isArray(rawSlug)
      ? rawSlug[0]
      : rawSlug;

  const decodedSlug =
    slug
      ? decodeURIComponent(
          String(slug)
        )
      : "";

  const [
    tool,
    setTool,
  ] =
    useState<ToolRecord | null>(
      null
    );

  const [
    similarTools,
    setSimilarTools,
  ] =
    useState<ToolRecord[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     FETCH
  ======================================================= */

  useEffect(() => {
    if (!decodedSlug) {
      return;
    }

    let cancelled =
      false;

    async function loadTool() {
      setLoading(true);
      setError("");

      try {
        const supabase =
          getSupabase();

        const {
          data,
          error:
            fetchError,
        } =
          await supabase
            .from(
              "ai_tools"
            )
            .select("*")
            .eq(
              "slug",
              decodedSlug
            )
            .maybeSingle();

        if (
          fetchError
        ) {
          throw fetchError;
        }

        if (
          !data
        ) {
          throw new Error(
            "Tool not found."
          );
        }

        if (
          cancelled
        ) {
          return;
        }

        const current =
          data as ToolRecord;

        setTool(
          current
        );

        /* =================================================
           SIMILAR TOOLS
        ================================================= */

        const category =
          getCategory(
            current
          );

        const {
          data:
            relatedData,
        } =
          await supabase
            .from(
              "ai_tools"
            )
            .select("*")
            .ilike(
              "category",
              category
            )
            .neq(
              "slug",
              decodedSlug
            )
            .order(
              "name",
              {
                ascending:
                  true,
              }
            )
            .limit(6);

        if (
          !cancelled &&
          Array.isArray(
            relatedData
          )
        ) {
          setSimilarTools(
            relatedData as ToolRecord[]
          );
        }
      } catch (
        fetchError
      ) {
        console.error(
          "[TOOL_DETAIL_ERROR]",
          fetchError
        );

        if (
          !cancelled
        ) {
          setError(
            "Unable to load this AI tool."
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

    loadTool();

    return () => {
      cancelled =
        true;
    };
  }, [
    decodedSlug,
  ]);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const data =
    useMemo(() => {
      if (!tool) {
        return null;
      }

      const sections =
        buildToolData(
          tool
        );

      return {
        name:
          getName(tool),

        category:
          getCategory(tool),

        description:
          getDescription(tool),

        pricing:
          getPricing(tool),

        logo:
          getLogo(tool),

        website:
          getWebsite(tool),

        score:
          getToolScore(tool),

        contentQuality:
          getContentQuality(
            tool
          ),

        ...sections,
      };
    }, [
      tool,
    ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8faff]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-5 text-sm font-bold text-slate-500">
            Loading AI Tool Intelligence...
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error ||
    !tool ||
    !data
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8faff] px-5">
        <div className="w-full max-w-lg rounded-[30px] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-500">
            !
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Tool unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error ||
              "This AI tool could not be found."}
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex rounded-xl bg-slate-950 px-6 py-3 text-sm font-black text-white"
          >
            ← Back to AI Vault
          </Link>
        </div>
      </main>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f8faff] text-slate-950">

      {/* ===================================================
          NAV
      =================================================== */}

      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[64px] max-w-7xl items-center justify-between px-4 sm:px-6">

          <Link
            href="/"
            className="text-lg font-black tracking-[-0.04em] text-slate-950"
          >
            AI Vault
            <span className="text-blue-600">
              .
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-full px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-blue-600 sm:block"
            >
              AI Tools
            </Link>

            <Link
              href="/ai-finder"
              className="hidden rounded-full px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-blue-600 sm:block"
            >
              AI Finder
            </Link>

            <Link
              href="/compare"
              className="hidden rounded-full px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-blue-600 sm:block"
            >
              Compare
            </Link>

            <Link
              href="/"
              className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white"
            >
              Directory
            </Link>
          </div>
        </div>
      </nav>

      {/* ===================================================
          MAIN
      =================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">

        {/* BREADCRUMB */}

        <div className="mb-7 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-400">
          <Link
            href="/"
            className="hover:text-blue-600"
          >
            Home
          </Link>

          <span>/</span>

          <Link
            href={`/?cat=${encodeURIComponent(
              data.category
            )}`}
            className="hover:text-blue-600"
          >
            {data.category}
          </Link>

          <span>/</span>

          <span className="text-slate-600">
            {data.name}
          </span>
        </div>

        {/* =================================================
            HERO CARD
        ================================================= */}

        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.06)] sm:p-8">

          <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">

            <div className="flex min-w-0 gap-5">

              {/* LOGO */}

              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-slate-200 bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20">
                {data.logo ? (
                  <img
                    src={data.logo}
                    alt={`${data.name} logo`}
                    className="h-full w-full object-cover"
                    onError={(
                      event
                    ) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  <span className="text-2xl font-black text-white">
                    {data.name
                      .slice(
                        0,
                        2
                      )
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <div className="min-w-0">

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">
                    Verified AI Tool
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                    {data.category}
                  </span>
                </div>

                <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
                  {data.name}
                </h1>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Pill>
                    {data.pricing}
                  </Pill>

                  {data.tags
                    .slice(
                      0,
                      5
                    )
                    .map(
                      (
                        tag,
                        index
                      ) => (
                        <Pill
                          key={`${tag}-${index}`}
                        >
                          {tag}
                        </Pill>
                      )
                    )}
                </div>
              </div>
            </div>

            {/* SCORE */}

            <div className="shrink-0 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              <div className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-600">
                AI Vault Score
              </div>

              <div className="mt-1 flex items-end gap-1">
                <span className="text-4xl font-black text-slate-950">
                  {data.score}
                </span>

                <span className="mb-1 text-sm font-bold text-slate-400">
                  /100
                </span>
              </div>

              <div className="mt-3 h-1.5 w-44 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                  style={{
                    width: `${data.score}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}

          <div className="mt-8 max-w-5xl">
            <p className="text-sm leading-7 text-slate-600 sm:text-base">
              {data.description}
            </p>
          </div>

          {/* QUICK STATS */}

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
                AI Vault Score
              </div>

              <div className="mt-2 text-xl font-black">
                {data.score}
                <span className="text-sm text-slate-400">
                  /100
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
                Pricing
              </div>

              <div className="mt-2 text-sm font-black">
                {data.pricing}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
                Category
              </div>

              <div className="mt-2 text-sm font-black">
                {data.category}
              </div>
            </div>

          </div>
        </section>

        {/* =================================================
            TOOL INTELLIGENCE
        ================================================= */}

        <section className="mt-10">

          <SectionLabel>
            Layer 1
          </SectionLabel>

          <h2 className="text-2xl font-black tracking-tight">
            Tool Intelligence
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Understand this AI tool through features,
            use cases, pricing, platforms and available
            product information.
          </p>

          {/* CONTENT QUALITY */}

          <div className="mt-6 rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h3 className="text-base font-black">
                  AI Vault Content Quality
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Completeness of the available
                  database information.
                </p>
              </div>

              <ScoreCircle
                score={
                  data.contentQuality
                }
                label={
                  data.contentQuality >=
                  80
                    ? "Excellent"
                    : data.contentQuality >=
                        60
                      ? "Good"
                      : data.contentQuality >=
                          40
                        ? "Fair"
                        : "Needs improvement"
                }
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Pill>
                Tool name
              </Pill>

              {data.description && (
                <Pill>
                  Detailed overview
                </Pill>
              )}

              {data.pricing !==
                "Unknown" && (
                <Pill>
                  Pricing information
                </Pill>
              )}

              {data.platforms
                .length >
                0 && (
                <Pill>
                  Platform information
                </Pill>
              )}

              {data.website && (
                <Pill>
                  Official website
                </Pill>
              )}
            </div>

            {data.features
              .length ===
              0 &&
              data.useCases
                .length ===
                0 && (
                <div className="mt-5 rounded-2xl bg-amber-50 px-5 py-4 text-xs font-semibold text-amber-700">
                  Some structured product information
                  is not available in the database yet.
                </div>
              )}
          </div>
        </section>

        {/* =================================================
            OVERVIEW
        ================================================= */}

        <section className="mt-6 rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-lg font-black">
            Tool Overview
          </h2>

          <p className="mt-5 text-sm leading-7 text-slate-600">
            {data.description}
          </p>
        </section>

        {/* =================================================
            FEATURES
        ================================================= */}

        <section className="mt-6 rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-black">
            Key Features
          </h2>

          {data.features.length >
          0 ? (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.features.map(
                (
                  feature,
                  index
                ) => (
                  <div
                    key={`${feature}-${index}`}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white">
                        ✓
                      </span>

                      <span className="text-sm font-semibold text-slate-700">
                        {feature}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                text="Feature information is not available in the current database record."
              />
            </div>
          )}
        </section>

        {/* =================================================
            USE CASES
        ================================================= */}

        <section className="mt-6 rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-black">
            Use Cases
          </h2>

          {data.useCases.length >
          0 ? (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.useCases.map(
                (
                  useCase,
                  index
                ) => (
                  <div
                    key={`${useCase}-${index}`}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold text-slate-700"
                  >
                    {useCase}
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                text="Use-case information is not available in the current database record."
              />
            </div>
          )}
        </section>

        {/* =================================================
            PRICING
        ================================================= */}

        <section className="mt-6 rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-black">
            Pricing
          </h2>

          <div className="mt-5 rounded-2xl bg-slate-50 p-5">
            <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
              Pricing Model
            </div>

            <div className="mt-2 text-lg font-black text-slate-950">
              {data.pricing}
            </div>
          </div>
        </section>

        {/* =================================================
            PLATFORM DETAILS
        ================================================= */}

        <section className="mt-6 rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-black">
            Platform Details
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
                Platforms
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {data.platforms.length >
                0 ? (
                  data.platforms.map(
                    (
                      platform,
                      index
                    ) => (
                      <Pill
                        key={`${platform}-${index}`}
                      >
                        {platform}
                      </Pill>
                    )
                  )
                ) : (
                  <span className="text-sm font-bold text-slate-500">
                    Web
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
                Deployment
              </div>

              <div className="mt-3 text-sm font-black">
                {getList(
                  tool.deployment ??
                    tool.deployment_type
                ).join(
                  ", "
                ) ||
                  "Web / Cloud"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
                License
              </div>

              <div className="mt-3 text-sm font-black">
                {firstText(
                  tool.license
                ) ||
                  "Not specified"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
                Pricing
              </div>

              <div className="mt-3 text-sm font-black">
                {data.pricing}
              </div>
            </div>

          </div>
        </section>

        {/* =================================================
            INTEGRATIONS
        ================================================= */}

        <section className="mt-6 rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-black">
            Integrations
          </h2>

          {data.integrations.length >
          0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {data.integrations.map(
                (
                  integration,
                  index
                ) => (
                  <Pill
                    key={`${integration}-${index}`}
                  >
                    {integration}
                  </Pill>
                )
              )}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                text="Integration information is not available in the current database record."
              />
            </div>
          )}
        </section>

        {/* =================================================
            LIMITATIONS
        ================================================= */}

        <section className="mt-6 rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-black">
            Limitations
          </h2>

          {data.limitations.length >
          0 ? (
            <div className="mt-5 space-y-3">
              {data.limitations.map(
                (
                  limitation,
                  index
                ) => (
                  <div
                    key={`${limitation}-${index}`}
                    className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600"
                  >
                    {limitation}
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                text="No specific limitations have been recorded in the current database entry."
              />
            </div>
          )}
        </section>

        {/* =================================================
            SIMILAR TOOLS
        ================================================= */}

        <section className="mt-10">

          <h2 className="text-2xl font-black tracking-tight">
            Discover Similar Tools
          </h2>

          {similarTools.length >
          0 ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similarTools.map(
                (
                  related,
                  index
                ) => {
                  const relatedSlug =
                    text(
                      related.slug
                    );

                  if (
                    !relatedSlug
                  ) {
                    return null;
                  }

                  const relatedName =
                    getName(
                      related
                    );

                  return (
                    <Link
                      key={
                        related.id !=
                        null
                          ? String(
                              related.id
                            )
                          : `${relatedSlug}-${index}`
                      }
                      href={`/tool/${encodeURIComponent(
                        relatedSlug
                      )}`}
                      className="group rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-black text-white">
                          {getLogo(
                            related
                          ) ? (
                            <img
                              src={getLogo(
                                related
                              )}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            relatedName
                              .slice(
                                0,
                                2
                              )
                              .toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-black">
                            {relatedName}
                          </h3>

                          <p className="mt-1 text-[10px] font-semibold text-slate-400">
                            {getCategory(
                              related
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                          {getPricing(
                            related
                          )}
                        </span>

                        <span className="text-xs font-black text-blue-600 transition group-hover:translate-x-1">
                          Explore →
                        </span>
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                text="No closely related tools are available yet."
              />
            </div>
          )}
        </section>

        {/* =================================================
            ACTION LINKS
        ================================================= */}

        <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">

          <Link
            href="/ai-finder"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-xs font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
          >
            Find the right AI tool →
          </Link>

          <Link
            href="/compare"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-xs font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
          >
            Compare tools →
          </Link>

          <Link
            href={`/?cat=${encodeURIComponent(
              data.category
            )}`}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-xs font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
          >
            Explore {data.category} →
          </Link>

        </section>

        {/* =================================================
            OFFICIAL WEBSITE
        ================================================= */}

        <section className="mt-6 rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">

          <div className="text-lg font-black">
            Official Website
          </div>

          {data.website ? (
            <a
              href={data.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-black !text-white shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5 hover:bg-blue-600"
            >
              Visit Official Website ↗
            </a>
          ) : (
            <div className="mt-5 rounded-xl bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-500">
              Official website URL is not available in the current database record.
            </div>
          )}
        </section>

        {/* =================================================
            OFFICIAL ACCESS CTA
        ================================================= */}

        <section className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-6">

          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
            Official Access
          </div>

          <h2 className="mt-2 text-xl font-black">
            Try {data.name}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Visit the official platform for current
            product information, features and availability.
          </p>

          <div className="mt-6 flex flex-col gap-3">

            {data.website ? (
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-black !text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                VISIT OFFICIAL PORTAL ↗
              </a>
            ) : (
              <div className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-slate-200 px-5 py-3 text-sm font-black text-slate-500">
                Official portal unavailable
              </div>
            )}

            <Link
              href="/"
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black !text-slate-700 transition hover:border-blue-200 hover:!text-blue-600"
            >
              ← Back to Directory
            </Link>

          </div>
        </section>

        {/* =================================================
            ABOUT
        ================================================= */}

        <section className="mt-10">

          <h2 className="text-2xl font-black">
            About {data.name}
          </h2>

          <p className="mt-5 text-sm leading-7 text-slate-600">
            {data.description}
          </p>
        </section>

        {/* =================================================
            FINAL CTA
        ================================================= */}

        <section className="relative mt-12 overflow-hidden rounded-[32px] bg-[#050714] px-6 py-14 text-center text-white shadow-[0_30px_90px_rgba(15,23,42,0.15)] sm:px-10">

          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[100px]" />

          <div className="relative">

            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-300">
              AI VAULT
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Ready to explore{" "}
              {data.name}?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
              Visit the official platform to verify
              the latest product information.
            </p>

            {data.website ? (
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-7 py-3 text-sm font-black !text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                Visit Official Website ↗
              </a>
            ) : (
              <Link
                href="/"
                className="mt-7 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-7 py-3 text-sm font-black !text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                Explore AI Vault →
              </Link>
            )}

          </div>
        </section>
      </div>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="mt-12 border-t border-slate-200 bg-white">

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
  );
}
