"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ToolLogo from "@/components/ToolLogo";
import { SITE_URL } from "@/lib/site-url";

type ToolRecord = {
  id?: string | number | null;
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  category?: string | null;
  pricing?: string | null;

  // Logo fields supported by the database.
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

const normalizeSlug = (value: unknown) => {
  if (!value) return "";

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getToolName = (tool: ToolRecord) =>
  String(tool.name || "AI Tool").trim();

const getToolDescription = (tool: ToolRecord) =>
  String(
    tool.description ||
      "Verified AI software platform designed to improve productivity and workflows."
  ).trim();

const getToolCategory = (tool: ToolRecord) =>
  String(tool.category || "General AI").trim();

const getToolPricing = (tool: ToolRecord) =>
  String(tool.pricing || "Freemium").trim();

const getToolLogo = (tool: ToolRecord) => {
  return (
    (typeof tool.logo_url === "string" && tool.logo_url.trim()
      ? tool.logo_url
      : null) ||
    (typeof tool.logo === "string" && tool.logo.trim()
      ? tool.logo
      : null) ||
    (typeof tool.image_url === "string" && tool.image_url.trim()
      ? tool.image_url
      : null) ||
    (typeof tool.icon_url === "string" && tool.icon_url.trim()
      ? tool.icon_url
      : null)
  );
};

function HomeContent() {
  const searchParams = useSearchParams();

  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [globalTotalCount, setGlobalTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState("");

  const activeCat = searchParams.get("cat") || "ALL";

  useEffect(() => {
    let cancelled = false;

    async function fetchToolsAndCount() {
      setLoading(true);

      try {
        /*
         * 1. GLOBAL EXACT COUNT
         *
         * Count the entire ai_tools table independently from
         * category filtering so the homepage always shows the
         * real directory size.
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
         * 2. DIRECTORY QUERY
         *
         * Fetch the complete directory data.
         */
        let query = supabase
          .from("ai_tools")
          .select("*")
          .order("name", { ascending: true });

        /*
         * Category filtering is performed by Supabase only when
         * a real category is selected.
         */
        if (activeCat !== "ALL") {
          query = query.ilike("category", `%${activeCat}%`);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        const rawData: ToolRecord[] = Array.isArray(data)
          ? (data as ToolRecord[])
          : [];

        /*
         * 3. DEDUPLICATE BY SLUG / NAME
         *
         * This prevents duplicate cards from appearing if the
         * database contains duplicate records.
         */
        const uniqueMap = new Map<string, ToolRecord>();

        for (const tool of rawData) {
          const key =
            normalizeSlug(tool.slug) ||
            normalizeSlug(tool.name) ||
            String(tool.id || "");

          if (key && !uniqueMap.has(key)) {
            uniqueMap.set(key, tool);
          }
        }

        const uniqueList = Array.from(uniqueMap.values());

        if (!cancelled) {
          setTools(uniqueList);

          /*
           * Safety fallback:
           * if the exact count is unavailable, use the returned
           * unique directory count.
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
        console.error("[HOME_FETCH_ERR]", error);

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
   * Local UI search.
   *
   * This does not mutate the Supabase data.
   */
  const filteredTools = useMemo(() => {
    const term = localSearch.toLowerCase().trim();

    if (!term) {
      return tools;
    }

    return tools.filter((tool) => {
      const name = getToolName(tool).toLowerCase();
      const description = getToolDescription(tool).toLowerCase();
      const category = getToolCategory(tool).toLowerCase();

      return (
        name.includes(term) ||
        description.includes(term) ||
        category.includes(term)
      );
    });
  }, [tools, localSearch]);

  const totalDisplay =
    globalTotalCount > 0 ? globalTotalCount : tools.length;

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AI Vault",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />

      <main className="min-h-screen bg-[#fcfcfc] text-slate-950">
        {/* =========================================================
            NAVIGATION
        ========================================================= */}
        <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="text-xl font-black tracking-tight text-slate-950"
            >
              AI Vault
              <span className="text-blue-600">.</span>
            </Link>

            <div className="hidden items-center gap-5 lg:flex">
              {categories.slice(0, 5).map((category) => (
                <Link
                  key={category.name}
                  href={
                    category.name === "All"
                      ? "/"
                      : `/?cat=${encodeURIComponent(category.name)}`
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
              <div className="rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                {totalDisplay > 0 ? `${totalDisplay}+` : "740+"} ENGINES
              </div>
            </div>
          </div>
        </nav>

        {/* =========================================================
            HERO
        ========================================================= */}
        <header className="mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 sm:pt-20">
          <div className="text-center">
            <h1 className="mx-auto max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.04em] sm:text-6xl md:text-7xl">
              Discover the World&apos;s
              <br />
              <span className="italic text-blue-600">
                Best AI Software
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Discover, compare, and explore {totalDisplay || 740}+
              production AI tools, developer utilities, and SaaS
              platforms.
            </p>
          </div>

          {/* =======================================================
              SEARCH BAR
          ======================================================= */}
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={localSearch}
                onChange={(event) =>
                  setLocalSearch(event.target.value)
                }
                placeholder={
                  totalDisplay > 0
                    ? `Search ${totalDisplay}+ AI tools by name, category, or workflow...`
                    : "Search AI tools by name, category, or workflow..."
                }
                aria-label="Search AI tools"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-5 pr-16 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <div className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
              </div>
            </div>
          </div>

          {/* =======================================================
              CATEGORY PILLS
          ======================================================= */}
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
                      : `/?cat=${encodeURIComponent(category.name)}`
                  }
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "bg-slate-950 text-white shadow-md"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </Link>
              );
            })}
          </div>
        </header>

        {/* =========================================================
            DIRECTORY
        ========================================================= */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Verified AI Directory ({totalDisplay})
            </h2>

            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch("")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Clear search
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
              <p className="mt-4 text-sm font-medium text-slate-500">
                Loading Verified AI Engines...
              </p>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                🔎
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-950">
                No AI tools found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Try another search term or choose a different
                category.
              </p>

              <button
                type="button"
                onClick={() => setLocalSearch("")}
                className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
              >
                View All Tools
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {filteredTools.map((tool) => {
                const cleanSlug =
                  normalizeSlug(tool.slug) ||
                  normalizeSlug(tool.name);

                if (!cleanSlug) {
                  return null;
                }

                const name = getToolName(tool);
                const description = getToolDescription(tool);
                const category = getToolCategory(tool);
                const pricing = getToolPricing(tool);
                const logoUrl = getToolLogo(tool);

                return (
                  <Link
                    key={String(tool.id || cleanSlug)}
                    href={`/tool/${cleanSlug}`}
                    className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                  >
                    <div className="space-y-4">
                      {/* =================================================
                          TOOL HEADER
                      ================================================= */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                          {/* IMPORTANT:
                              ToolLogo uses src/fallbackSrc/name.
                              DO NOT pass tool={tool}.
                          */}
                          <ToolLogo
                            src={logoUrl}
                            fallbackSrc={
                              typeof tool.logo === "string"
                                ? tool.logo
                                : null
                            }
                            name={name}
                            size="md"
                          />

                          <div className="min-w-0">
                            <h3 className="truncate text-xl font-bold tracking-tight text-slate-950">
                              {name}
                            </h3>

                            <p className="mt-1 text-xs font-medium text-slate-400">
                              {category}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 rounded-full bg-slate-50 px-3 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                          {pricing}
                        </span>
                      </div>

                      {/* =================================================
                          DESCRIPTION
                      ================================================= */}
                      <p className="line-clamp-3 min-h-[60px] text-sm leading-6 text-slate-500">
                        {description}
                      </p>

                      {/* =================================================
                          FOOTER
                      ================================================= */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                          {category}
                        </span>

                        <span className="flex items-center gap-1 text-sm font-bold text-slate-950 transition group-hover:text-blue-600">
                          Explore
                          <span
                            className="transition-transform group-hover:translate-x-1"
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* =========================================================
            FOOTER
        ========================================================= */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">
              AI Vault<span className="text-blue-600">.</span>
            </h2>

            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-slate-500">
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
              © {new Date().getFullYear()} AI Vault. All rights
              reserved.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}

/*
 * Next.js App Router:
 *
 * useSearchParams() requires the component using it to be
 * rendered under Suspense during production builds.
 */
export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-[#fcfcfc]">
          <div className="text-sm font-semibold text-slate-500">
            Loading AI Vault...
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
