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

type ToolRecord = {
  id?: string | number | null;
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  category?: string | null;
  pricing?: string | null;

  logo_url?: string | null;
  logo?: string | null;
  image_url?: string | null;
  icon_url?: string | null;

  [key: string]: unknown;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const categories = [
  { name: "All", icon: "⚡" },
  { name: "Chatbot", icon: "🤖" },
  { name: "Coding", icon: "💻" },
  { name: "Image", icon: "🎨" },
  { name: "Writing", icon: "✍️" },
  { name: "Audio", icon: "🎵" },
  { name: "Video", icon: "🎬" },
];

const normalizeSlug = (value: unknown): string => {
  if (!value) return "";

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getToolName = (tool: ToolRecord): string =>
  String(tool.name || "AI Tool").trim();

const getToolDescription = (tool: ToolRecord): string =>
  String(
    tool.description ||
      "Verified AI software platform designed to improve productivity, creativity, and workflows."
  ).trim();

const getToolCategory = (tool: ToolRecord): string =>
  String(tool.category || "General AI").trim();

const getToolPricing = (tool: ToolRecord): string =>
  String(tool.pricing || "Freemium").trim();

const getToolLogo = (tool: ToolRecord): string | null => {
  if (
    typeof tool.logo_url === "string" &&
    tool.logo_url.trim()
  ) {
    return tool.logo_url;
  }

  if (
    typeof tool.logo === "string" &&
    tool.logo.trim()
  ) {
    return tool.logo;
  }

  if (
    typeof tool.image_url === "string" &&
    tool.image_url.trim()
  ) {
    return tool.image_url;
  }

  if (
    typeof tool.icon_url === "string" &&
    tool.icon_url.trim()
  ) {
    return tool.icon_url;
  }

  return null;
};

function HomeContent() {
  const searchParams = useSearchParams();

  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [globalTotalCount, setGlobalTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState("");

  /*
   * Prevent duplicate impression events during
   * React re-renders and state changes.
   */
  const impressionSent = useRef<Set<string>>(new Set());

  const activeCat =
    searchParams.get("cat") || "ALL";

  useEffect(() => {
    let cancelled = false;

    async function fetchToolsAndCount() {
      setLoading(true);

      try {
        /*
         * =====================================================
         * 1. GLOBAL EXACT COUNT
         * =====================================================
         */
        const countResult = await supabase
          .from("ai_tools")
          .select("id", {
            count: "exact",
            head: true,
          });

        if (
          !cancelled &&
          !countResult.error &&
          typeof countResult.count === "number"
        ) {
          setGlobalTotalCount(countResult.count);
        }

        /*
         * =====================================================
         * 2. DIRECTORY QUERY
         * =====================================================
         */
        let query = supabase
          .from("ai_tools")
          .select("*")
          .order("name", { ascending: true });

        if (activeCat !== "ALL") {
          query = query.ilike(
            "category",
            `%${activeCat}%`
          );
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        const rawData: ToolRecord[] =
          Array.isArray(data)
            ? (data as ToolRecord[])
            : [];

        /*
         * =====================================================
         * 3. DEDUPLICATE BY SLUG / NAME
         * =====================================================
         */
        const uniqueMap =
          new Map<string, ToolRecord>();

        for (const tool of rawData) {
          const key =
            normalizeSlug(tool.slug) ||
            normalizeSlug(tool.name) ||
            String(tool.id || "");

          if (key && !uniqueMap.has(key)) {
            uniqueMap.set(key, tool);
          }
        }

        const uniqueList =
          Array.from(uniqueMap.values());

        if (!cancelled) {
          setTools(uniqueList);

          /*
           * Safety fallback if exact count is unavailable.
           */
          if (
            !countResult.error &&
            typeof countResult.count === "number"
          ) {
            setGlobalTotalCount(countResult.count);
          } else if (uniqueList.length > 0) {
            setGlobalTotalCount(uniqueList.length);
          }
        }
      } catch (error) {
        console.error(
          "[HOME_FETCH_ERR]",
          error
        );

        if (!cancelled) {
          setTools([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchToolsAndCount();

    return () => {
      cancelled = true;
    };
  }, [activeCat]);

  /*
   * ===========================================================
   * LOCAL SEARCH
   * ===========================================================
   */
  const filteredTools = useMemo(() => {
    const term =
      localSearch.toLowerCase().trim();

    if (!term) {
      return tools;
    }

    return tools.filter((tool) => {
      const name =
        getToolName(tool).toLowerCase();

      const description =
        getToolDescription(tool).toLowerCase();

      const category =
        getToolCategory(tool).toLowerCase();

      return (
        name.includes(term) ||
        description.includes(term) ||
        category.includes(term)
      );
    });
  }, [tools, localSearch]);

  /*
   * ===========================================================
   * TRAFFIC: TOOL IMPRESSIONS
   * ===========================================================
   *
   * Track each tool once per page/session lifecycle.
   */
  useEffect(() => {
    if (loading) return;

    filteredTools.forEach((tool, index) => {
      const slug =
        normalizeSlug(tool.slug) ||
        normalizeSlug(tool.name) ||
        String(tool.id || "");

      if (!slug) return;

      if (impressionSent.current.has(slug)) {
        return;
      }

      impressionSent.current.add(slug);

      try {
        trackToolImpression(
          slug,
          getToolName(tool),
          getToolCategory(tool),
          index
        );
      } catch (error) {
        console.error(
          "[TRAFFIC_IMPRESSION_ERR]",
          error
        );
      }
    });
  }, [filteredTools, loading]);

  const totalDisplay =
    globalTotalCount > 0
      ? globalTotalCount
      : tools.length;

  /*
   * ===========================================================
   * WEBSITE SCHEMA
   * ===========================================================
   */
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AI Vault",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input":
        "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            websiteSchema
          ),
        }}
      />

      <main className="min-h-screen bg-[#fcfcfc] text-slate-950">
        {/* =====================================================
            NAVIGATION
        ====================================================== */}
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="text-xl font-black tracking-tight"
            >
              AI Vault
              <span className="text-blue-600">.</span>
            </Link>

            <div className="hidden items-center gap-5 md:flex">
              {categories
                .slice(0, 5)
                .map((category) => (
                  <Link
                    key={category.name}
                    href={
                      category.name === "All"
                        ? "/"
                        : `/?cat=${encodeURIComponent(
                            category.name
                          )}`
                    }
                    className={`text-sm font-medium transition ${
                      activeCat.toLowerCase() ===
                      category.name.toLowerCase()
                        ? "text-blue-600"
                        : "text-slate-600 hover:text-blue-600"
                    }`}
                  >
                    {category.name}
                  </Link>
                ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white">
                {totalDisplay.toLocaleString()}
              </div>
            </div>
          </div>
        </nav>

        {/* =====================================================
            HERO
        ====================================================== */}
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
              {totalDisplay.toLocaleString()}+
              verified AI tools, productivity
              software, developer utilities and
              business platforms.
            </p>
          </div>

          {/* ===================================================
              SEARCH
          ==================================================== */}
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={localSearch}
                onChange={(event) =>
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

          {/* ===================================================
              CATEGORY PILLS
          ==================================================== */}
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {categories.map((category) => {
              const isActive =
                activeCat.toLowerCase() ===
                category.name.toLowerCase();

              return (
                <Link
                  key={category.name}
                  href={
                    category.name === "All"
                      ? "/"
                      : `/?cat=${encodeURIComponent(
                          category.name
                        )}`
                  }
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </Link>
              );
            })}
          </div>
        </header>

        {/* =====================================================
            DIRECTORY
        ====================================================== */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Verified AI Directory{" "}
              <span className="text-blue-600">
                ({totalDisplay.toLocaleString()})
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

          {loading ? (
            <div className="py-20 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm font-medium text-slate-500">
                Loading Verified AI Engines...
              </p>
            </div>
          ) : filteredTools.length === 0 ? (
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

              <button
                type="button"
                onClick={() => {
                  setLocalSearch("");
                  window.history.pushState(
                    {},
                    "",
                    "/"
                  );
                  window.location.reload();
                }}
                className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View All Tools
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredTools.map(
                (tool, index) => {
                  const cleanSlug =
                    normalizeSlug(
                      tool.slug
                    ) ||
                    normalizeSlug(
                      tool.name
                    );

                  if (!cleanSlug) {
                    return null;
                  }

                  const name =
                    getToolName(tool);

                  const description =
                    getToolDescription(tool);

                  const category =
                    getToolCategory(tool);

                  const pricing =
                    getToolPricing(tool);

                  const logoUrl =
                    getToolLogo(tool);

                  return (
                    <Link
                      key={String(
                        tool.id ||
                          cleanSlug
                      )}
                      href={`/tool/${cleanSlug}`}
                      onClick={() => {
                        try {
                          trackToolClick(
                            cleanSlug,
                            name,
                            category,
                            index
                          );
                        } catch (error) {
                          console.error(
                            "[TRAFFIC_CLICK_ERR]",
                            error
                          );
                        }
                      }}
                      className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                    >
                      <div className="space-y-4">
                        {/* TOOL HEADER */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <ToolLogo
                              src={logoUrl}
                              fallbackSrc={
                                typeof tool.logo ===
                                  "string"
                                  ? tool.logo
                                  : null
                              }
                              name={name}
                              size="md"
                            />

                            <div className="min-w-0">
                              <h3 className="truncate text-base font-bold text-slate-950">
                                {name}
                              </h3>

                              <p className="mt-1 text-xs font-medium text-slate-500">
                                {category}
                              </p>
                            </div>
                          </div>

                          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                            {pricing}
                          </span>
                        </div>

                        {/* DESCRIPTION */}
                        <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">
                          {description}
                        </p>

                        {/* FOOTER */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            {category}
                          </span>

                          <span className="flex items-center gap-1 text-sm font-bold text-slate-900 transition group-hover:text-blue-600">
                            Explore
                            <span
                              className="transition-transform duration-200 group-hover:translate-x-1"
                              aria-hidden="true"
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

        {/* =====================================================
            FOOTER
        ====================================================== */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <h2 className="text-3xl font-black tracking-tight">
              AI Vault
              <span className="text-blue-600">
                .
              </span>
            </h2>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-500">
              <Link
                href="/privacy"
                className="transition hover:text-blue-600"
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                className="transition hover:text-blue-600"
              >
                Terms
              </Link>

              <Link
                href="/about"
                className="transition hover:text-blue-600"
              >
                About
              </Link>

              <Link
                href="/contact"
                className="transition hover:text-blue-600"
              >
                Contact
              </Link>
            </div>

            <p className="mt-6 text-xs text-slate-400">
              © {new Date().getFullYear()} AI Vault.
              All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}

/*
 * Next.js App Router:
 * useSearchParams() requires a Suspense boundary.
 */
export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-white">
          <div className="text-sm font-semibold text-slate-600">
            Loading AI Vault...
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
