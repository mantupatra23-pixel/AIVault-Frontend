// app/page.tsx
"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import ToolLogo from "@/components/ToolLogo";
import {
  trackToolClick,
  trackToolImpression,
} from "@/lib/traffic-tracker";
import { SITE_URL } from "@/lib/site-url";
import { cleanAiContent } from "@/lib/content-quality";

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

  [key: string]: unknown;
};

/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
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
   CATEGORIES
========================================================= */

const categories = [
  { name: "All", icon: "⚡" },
  { name: "Chatbot", icon: "🤖" },
  { name: "Coding", icon: "💻" },
  { name: "Image", icon: "🎨" },
  { name: "Writing", icon: "✍️" },
  { name: "Audio", icon: "🎵" },
  { name: "Video", icon: "🎬" },
];

/* =========================================================
   HELPERS
========================================================= */

function getCanonicalSlug(tool: ToolRecord): string {
  if (typeof tool.slug !== "string") {
    return "";
  }
  return tool.slug.trim();
}

function getToolHref(tool: ToolRecord): string | null {
  const slug = getCanonicalSlug(tool);
  if (!slug) return null;
  return `/tool/${encodeURIComponent(slug)}`;
}

function getToolName(tool: ToolRecord): string {
  if (typeof tool.name === "string" && tool.name.trim()) {
    return tool.name.trim();
  }
  return "AI Tool";
}

function cleanGeneratedContent(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  let text = cleanAiContent(value);
  if (!text) {
    text = value.trim();
    text = text.replace(/^I have (analyzed|conducted|reviewed|tested) [^.]*\.\s*/gi, "");
    text = text.replace(/^As (a|an) [^.]*,\s*/gi, "");
    text = text.replace(/^(In this|Our) (professional|in-depth) review[^.]*\.\s*/gi, "");
    text = text.replace(/\s+/g, " ").trim();
  }

  return text;
}

function getToolDescription(tool: ToolRecord): string {
  const candidates = [
    tool.short_description,
    tool.description,
    tool.overview,
  ];

  for (const candidate of candidates) {
    const cleaned = cleanGeneratedContent(candidate);
    if (cleaned && cleaned.length > 15) {
      return cleaned;
    }
  }

  return `Verified AI tool intelligence, features, pricing, and workflow details for ${getToolName(tool)}.`;
}

function getToolCategory(tool: ToolRecord): string {
  if (typeof tool.category === "string" && tool.category.trim()) {
    return tool.category.trim();
  }
  return "General AI";
}

/* =========================================================
   PRICING
========================================================= */

function normalizePricing(value: unknown): string {
  if (typeof value !== "string") return "Unknown";
  const raw = value.trim();
  if (!raw) return "Unknown";

  const valueLower = raw.toLowerCase();
  if (valueLower.includes("freemium")) return "Freemium";
  if (valueLower === "free" || valueLower.includes("free plan") || valueLower.includes("free to use")) return "Free";
  if (valueLower.includes("free trial") || valueLower.includes("trial")) return "Free Trial";
  if (valueLower.includes("contact sales") || valueLower.includes("contact us")) return "Contact Sales";
  if (valueLower.includes("open source") || valueLower.includes("opensource")) return "Open Source";
  if (valueLower.includes("enterprise")) return "Enterprise";
  if (valueLower.includes("paid") || valueLower.includes("subscription")) return "Paid";

  return raw;
}

function getToolPricing(tool: ToolRecord): string {
  const model = typeof tool.pricing_model === "string" ? tool.pricing_model.trim() : "";
  const pricing = typeof tool.pricing === "string" ? tool.pricing.trim() : "";
  return normalizePricing(model || pricing);
}

/* =========================================================
   SCORE (0-100 Format)
========================================================= */

function getToolScore(tool: ToolRecord): number {
  const raw = tool.ai_vault_score ?? tool.score ?? 0;
  const numberValue = Number(raw);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return 0;
  }

  if (numberValue <= 10) {
    return Math.round(numberValue * 10);
  }

  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

/* =========================================================
   LOGO
========================================================= */

function getToolLogo(tool: ToolRecord): string | null {
  const candidates = [
    tool.logo_url,
    tool.logo,
    tool.image_url,
    tool.icon_url,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

/* =========================================================
   HERO
========================================================= */

function VaultHero({ toolCount }: { toolCount: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => ({
        id: index,
        left: `${5 + ((index * 31) % 90)}%`,
        top: `${8 + ((index * 47) % 82)}%`,
      })),
    []
  );

  return (
    <section className="relative isolate min-h-[570px] overflow-hidden bg-[#040616] sm:min-h-[620px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(79,70,229,0.35),transparent_35%),radial-gradient(circle_at_50%_60%,rgba(37,99,235,0.16),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:46px_46px] opacity-60" />
      <div className="absolute left-1/2 top-[45%] h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-[80px] sm:h-[520px] sm:w-[520px]" />

      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute h-1 w-1 rounded-full bg-blue-300 shadow-[0_0_12px_rgba(96,165,250,0.9)]"
          style={{
            left: particle.left,
            top: particle.top,
          }}
        />
      ))}

      {/* 3D RINGS */}
      <div className="absolute left-1/2 top-[45%] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 [transform:perspective(800px)_rotateX(65deg)] sm:h-[430px] sm:w-[430px]">
        <div className="absolute inset-0 rounded-full border border-blue-400/20 shadow-[0_0_50px_rgba(59,130,246,0.08)]" />
        <div className="absolute left-1/2 top-1/2 h-[75%] w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/35" />
        <div className="absolute left-1/2 top-1/2 h-[55%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/45 shadow-[0_0_35px_rgba(34,211,238,0.15)]" />
        <div className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-violet-400/60" />
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-200/70 bg-[radial-gradient(circle_at_30%_25%,#dbeafe,#8b5cf6_22%,#4338ca_50%,#08091a_85%)] shadow-[0_0_25px_rgba(96,165,250,0.8),0_0_80px_rgba(99,102,241,0.55),inset_-15px_-20px_25px_rgba(0,0,0,0.55)] sm:h-32 sm:w-32">
          <div className="absolute left-5 top-4 h-5 w-9 rounded-full bg-white/40 blur-md" />
          <div className="absolute inset-4 rounded-full border border-white/20" />
        </div>
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex min-h-[570px] flex-col items-center justify-center px-5 pb-16 pt-24 text-center sm:min-h-[620px]">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-slate-950/50 px-4 py-2 text-[9px] font-black tracking-[0.2em] text-blue-200 backdrop-blur-xl">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]" />
          AI INTELLIGENCE VAULT
        </div>

        <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-white sm:text-7xl">
          Discover the
          <br />
          <span className="bg-gradient-to-r from-blue-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
            Right AI.
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-sm leading-7 text-slate-300/75 sm:text-base">
          Search, compare and discover verified AI software from one intelligent directory. Find tools for productivity, coding, creativity and more.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <div className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-[10px] font-bold text-slate-300 backdrop-blur-xl">
            <strong className="text-white">{toolCount.toLocaleString()}</strong> AI TOOLS
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-[10px] font-bold text-slate-300 backdrop-blur-xl">
            <strong className="text-white">VERIFIED</strong> DIRECTORY
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-[10px] font-bold text-slate-300 backdrop-blur-xl">
            <strong className="text-white">AI VAULT</strong> SCORE
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   TOOL CARD
========================================================= */

function ToolCard({ tool, index }: { tool: ToolRecord; index: number }) {
  const name = getToolName(tool);
  const category = getToolCategory(tool);
  const description = getToolDescription(tool);
  const pricing = getToolPricing(tool);
  const score = getToolScore(tool);
  const logoUrl = getToolLogo(tool);
  const href = getToolHref(tool);

  const cardId = tool.id != null ? String(tool.id) : getCanonicalSlug(tool) || `tool-${index}`;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <ToolLogo
              src={logoUrl}
              fallbackSrc={logoUrl}
              name={name}
              size="md"
            />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-slate-950">
              {name}
            </h3>
            <p className="mt-1 truncate text-xs font-semibold text-slate-400">
              {category}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-black text-slate-600">
          {pricing}
        </span>
      </div>

      <p className="mt-5 line-clamp-3 min-h-[72px] text-[13px] leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
            AI Vault Score
          </span>
          <span className="text-xs font-black text-blue-600">
            {score}/100
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
          Verified AI Tool
        </span>
        <span className="text-xs font-black text-blue-600 transition-transform group-hover:translate-x-1">
          Explore →
        </span>
      </div>
    </>
  );

  if (!href) {
    return (
      <article
        key={cardId}
        className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.05)]"
      >
        {content}
      </article>
    );
  }

  return (
    <Link
      key={cardId}
      href={href}
      onClick={() => {
        try {
          const slug = getCanonicalSlug(tool);
          if (!slug) return;
          trackToolClick(slug, name, category, index);
        } catch (error) {
          console.error("[TRAFFIC_CLICK_ERR]", error);
        }
      }}
      className="group block h-full overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.045)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_25px_65px_rgba(37,99,235,0.12)]"
    >
      {content}
    </Link>
  );
}

/* =========================================================
   HOME CONTENT
========================================================= */

function HomeContent() {
  const searchParams = useSearchParams();

  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [localSearch, setLocalSearch] = useState("");

  const impressionSent = useRef<Set<string>>(new Set());

  const activeCat = searchParams.get("cat")?.trim() || "All";
  const isAllCategory = activeCat.toLowerCase() === "all";

  useEffect(() => {
    const query = searchParams.get("q")?.trim() || "";
    setLocalSearch(query);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadTools() {
      setLoading(true);
      setErrorMessage("");

      try {
        const supabase = getSupabase();

        let countQuery = supabase
          .from("ai_tools")
          .select("id", { count: "exact", head: true });

        if (!isAllCategory) {
          countQuery = countQuery.ilike("category", activeCat);
        }

        const countResult = await countQuery;

        let query = supabase
          .from("ai_tools")
          .select("*")
          .order("name", { ascending: true, nullsFirst: false });

        if (!isAllCategory) {
          query = query.ilike("category", activeCat);
        }

        const result = await query;

        if (result.error) {
          throw result.error;
        }

        const rows = Array.isArray(result.data) ? (result.data as ToolRecord[]) : [];
        const uniqueMap = new Map<string, ToolRecord>();

        rows.forEach((tool, index) => {
          const slug = getCanonicalSlug(tool);
          let key = slug ? `slug:${slug}` : tool.id != null ? `id:${String(tool.id)}` : `missing:${index}`;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, tool);
          }
        });

        const uniqueTools = Array.from(uniqueMap.values());

        if (cancelled) return;

        setTools(uniqueTools);
        setTotalCount(
          !countResult.error && typeof countResult.count === "number"
            ? countResult.count
            : uniqueTools.length
        );
      } catch (error) {
        console.error("[HOME_FETCH_ERR]", error);
        if (!cancelled) {
          setTools([]);
          setTotalCount(0);
          setErrorMessage("Unable to load the AI tool directory. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTools();

    return () => {
      cancelled = true;
    };
  }, [activeCat, isAllCategory]);

  const filteredTools = useMemo(() => {
    const term = localSearch.toLowerCase().trim();
    if (!term) return tools;

    return tools.filter((tool) => {
      const name = getToolName(tool).toLowerCase();
      const description = getToolDescription(tool).toLowerCase();
      const category = getToolCategory(tool).toLowerCase();
      const slug = getCanonicalSlug(tool).toLowerCase();

      return name.includes(term) || description.includes(term) || category.includes(term) || slug.includes(term);
    });
  }, [tools, localSearch]);

  useEffect(() => {
    if (loading) return;

    filteredTools.forEach((tool, index) => {
      const slug = getCanonicalSlug(tool);
      if (!slug || impressionSent.current.has(slug)) return;

      impressionSent.current.add(slug);
      try {
        trackToolImpression(slug, getToolName(tool), getToolCategory(tool), index);
      } catch (error) {
        console.error("[TRAFFIC_IMPRESSION_ERR]", error);
      }
    });
  }, [filteredTools, loading]);

  function getCategoryHref(category: string) {
    return category === "All" ? "/" : `/?cat=${encodeURIComponent(category)}`;
  }

  function clearSearch() {
    setLocalSearch("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/?${query}` : "/");
  }

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <main className="min-h-screen bg-[#f8faff] text-slate-950">
        <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-2xl">
          <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="text-xl font-black tracking-[-0.04em]">
              AI Vault<span className="text-blue-600">.</span>
            </Link>

            <div className="hidden items-center gap-6 md:flex">
              {categories.slice(0, 5).map((category) => {
                const active = activeCat.toLowerCase() === category.name.toLowerCase();
                return (
                  <Link
                    key={category.name}
                    href={getCategoryHref(category.name)}
                    className={
                      active
                        ? "text-sm font-bold text-blue-600"
                        : "text-sm font-semibold text-slate-500 transition hover:text-blue-600"
                    }
                  >
                    {category.name}
                  </Link>
                );
              })}
            </div>

            <div className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-blue-500/20">
              {totalCount.toLocaleString()}
            </div>
          </div>
        </nav>

        <VaultHero toolCount={totalCount} />

        <section className="relative z-20 -mt-8 px-4">
          <div className="mx-auto max-w-4xl rounded-[28px] border border-white bg-white/95 p-3 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="relative">
              <input
                type="text"
                value={localSearch}
                onChange={(event) => setLocalSearch(event.target.value)}
                placeholder={totalCount > 0 ? `Search ${totalCount.toLocaleString()}+ AI tools...` : "Search AI tools..."}
                aria-label="Search AI tools"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 pr-14 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

              {localSearch ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-lg text-slate-700 hover:bg-slate-300"
                >
                  ×
                </button>
              ) : (
                <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                  </svg>
                </div>
              )}
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => {
                const active = activeCat.toLowerCase() === category.name.toLowerCase();
                return (
                  <Link
                    key={category.name}
                    href={getCategoryHref(category.name)}
                    className={
                      active
                        ? "flex shrink-0 items-center gap-2 rounded-full border border-slate-950 bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-lg"
                        : "flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                    }
                  >
                    <span>{category.icon}</span>
                    {category.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                AI DISCOVERY ENGINE
              </div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                {isAllCategory ? "Verified AI Directory" : `${activeCat} AI Tools`}
                <span className="ml-2 text-blue-600">({filteredTools.length.toLocaleString()})</span>
              </h2>
            </div>

            {localSearch && (
              <button
                type="button"
                onClick={clearSearch}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-600"
              >
                Clear Search
              </button>
            )}
          </div>

          {errorMessage ? (
            <div className="rounded-[30px] border border-red-100 bg-white px-6 py-20 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-red-500">!</div>
              <h3 className="mt-5 text-xl font-black">Directory unavailable</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{errorMessage}</p>
              <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white">
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="py-24 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="mt-5 text-sm font-bold text-slate-500">Loading Intelligence Vault...</p>
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="rounded-[30px] border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">🔎</div>
              <h3 className="mt-5 text-xl font-black">No AI tools found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Try another search term or choose another category.</p>
              <button type="button" onClick={clearSearch} className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white">
                View All Tools
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredTools.map((tool, index) => (
                <ToolCard
                  key={tool.id != null ? String(tool.id) : getCanonicalSlug(tool) || `tool-${index}`}
                  tool={tool}
                  index={index}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="relative overflow-hidden rounded-[36px] bg-[#050714] px-6 py-16 text-center text-white shadow-[0_30px_100px_rgba(15,23,42,0.15)] sm:px-10">
            <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[100px]" />
            <div className="relative z-10">
              <div className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-blue-300">
                THE INTELLIGENCE VAULT
              </div>
              <h2 className="text-3xl font-black tracking-tight sm:text-5xl">Find the right AI.</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                Search, compare and discover the next generation of AI software from one intelligent directory.
              </p>
              <Link
                href="/ai-finder"
                className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-1 hover:bg-slate-100"
              >
                Find My AI Tool →
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">
            <p>© 2026 AI Vault. All rights reserved.</p>
            <div className="flex flex-wrap gap-5">
              <Link href="/" className="hover:text-blue-600">AI Tools</Link>
              <Link href="/ai-finder" className="hover:text-blue-600">AI Finder</Link>
              <Link href="/compare" className="hover:text-blue-600">Compare</Link>
              <Link href="/saved" className="hover:text-blue-600">Saved</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#050714]">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-blue-500" />
            <p className="mt-5 text-sm font-bold text-slate-400">Loading AI Vault...</p>
          </div>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
