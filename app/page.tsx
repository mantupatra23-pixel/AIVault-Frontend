// app/page.tsx
"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import ToolLogo from "@/components/ToolLogo";
import { trackToolClick, trackToolImpression } from "@/lib/traffic-tracker";
import { SITE_URL } from "@/lib/site-url";
import { cleanAiContent } from "@/lib/content-quality";
import { getToolScore, formatAIScore, getScoreBarWidth } from "@/lib/score";

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
  neural_score?: number | string | null;
  rating?: number | string | null;
  logo_url?: string | null;
  logo?: string | null;
  image_url?: string | null;
  icon_url?: string | null;
  is_verified?: boolean;
  verified?: boolean;
  [key: string]: unknown;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase credentials missing.");
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const categories = [
  { name: "All", icon: "⚡" },
  { name: "Chatbot", icon: "🤖" },
  { name: "Coding", icon: "💻" },
  { name: "Image", icon: "🎨" },
  { name: "Writing", icon: "✍️" },
  { name: "Audio", icon: "🎵" },
  { name: "Video", icon: "🎬" },
];

function getCanonicalSlug(tool: ToolRecord): string {
  return typeof tool.slug === "string" ? tool.slug.trim() : "";
}

function getToolHref(tool: ToolRecord): string | null {
  const slug = getCanonicalSlug(tool);
  return slug ? `/tool/${encodeURIComponent(slug)}` : null;
}

function getToolName(tool: ToolRecord): string {
  return typeof tool.name === "string" && tool.name.trim() ? tool.name.trim() : "AI Tool";
}

function getToolDescription(tool: ToolRecord): string {
  const raw = tool.short_description || tool.description || tool.overview || "";
  const cleaned = cleanAiContent(raw);
  if (cleaned) return cleaned;
  return `${getToolName(tool)} provides software capabilities for ${(tool.category || "AI").toLowerCase()} tasks.`;
}

function getToolCategory(tool: ToolRecord): string {
  return typeof tool.category === "string" && tool.category.trim() ? tool.category.trim() : "General AI";
}

function normalizePricing(value: unknown): string {
  if (typeof value !== "string") return "Unknown";
  const v = value.trim().toLowerCase();
  if (v.includes("freemium")) return "Freemium";
  if (v === "free" || v.includes("free plan") || v.includes("free to use")) return "Free";
  if (v.includes("free trial") || v.includes("trial")) return "Free Trial";
  if (v.includes("contact sales") || v.includes("contact us")) return "Contact Sales";
  if (v.includes("open source") || v.includes("opensource")) return "Open Source";
  if (v.includes("enterprise")) return "Enterprise";
  if (v.includes("paid") || v.includes("subscription")) return "Paid";
  return value.trim() || "Unknown";
}

function getToolPricing(tool: ToolRecord): string {
  return normalizePricing(tool.pricing_model || tool.pricing);
}

function isToolVerified(tool: ToolRecord): boolean {
  return Boolean(tool.is_verified || tool.verified || tool.verification_status === "verified");
}

function getToolLogo(tool: ToolRecord): string | null {
  const candidates = [tool.logo_url, tool.logo, tool.image_url, tool.icon_url];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function VaultHero({ toolCount }: { toolCount: number }) {
  return (
    <section className="relative isolate min-h-[570px] overflow-hidden bg-[#040616] sm:min-h-[620px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(79,70,229,0.35),transparent_35%),radial-gradient(circle_at_50%_60%,rgba(37,99,235,0.16),transparent_55%)]" />
      <div className="relative z-10 flex min-h-[570px] flex-col items-center justify-center px-5 pb-16 pt-24 text-center sm:min-h-[620px]">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-slate-950/50 px-4 py-2 text-[9px] font-black tracking-[0.2em] text-blue-200 backdrop-blur-xl">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]" />
          AI INTELLIGENCE VAULT
        </div>

        <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-white sm:text-7xl">
          Discover the<br />
          <span className="bg-gradient-to-r from-blue-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
            Right AI.
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-sm leading-7 text-slate-300/75 sm:text-base">
          Search, compare and discover verified AI software from one intelligent directory. Find tools for productivity, coding, creativity and more.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <div className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-[10px] font-bold text-slate-300 backdrop-blur-xl">
            <strong className="text-white">{toolCount > 0 ? toolCount.toLocaleString() : "..."}</strong> AI TOOLS
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

function ToolCard({ tool, index }: { tool: ToolRecord; index: number }) {
  const name = getToolName(tool);
  const category = getToolCategory(tool);
  const description = getToolDescription(tool);
  const pricing = getToolPricing(tool);
  const score = getToolScore(tool);
  const formattedScore = formatAIScore(score);
  const barWidth = getScoreBarWidth(score);
  const logoUrl = getToolLogo(tool);
  const href = getToolHref(tool);
  const verified = isToolVerified(tool);

  const cardId = tool.id != null ? String(tool.id) : getCanonicalSlug(tool) || `tool-${index}`;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <ToolLogo src={logoUrl} fallbackSrc={logoUrl} name={name} size="md" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-slate-950">{name}</h3>
            <p className="mt-1 truncate text-xs font-semibold text-slate-400">{category}</p>
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
            {formattedScore}
          </span>
        </div>
        {score !== null && (
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"
              style={{ width: barWidth }}
            />
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
          {verified ? "Verified AI Tool" : "AI Directory"}
        </span>
        <span className="text-xs font-black text-blue-600 transition-transform group-hover:translate-x-1">
          Explore →
        </span>
      </div>
    </>
  );

  if (!href) {
    return (
      <article key={cardId} className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
        {content}
      </article>
    );
  }

  return (
    <Link
      key={cardId}
      href={href}
      onClick={() => {
        const slug = getCanonicalSlug(tool);
        if (slug) trackToolClick(slug, name, category, index);
      }}
      className="group block h-full overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.045)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_25px_65px_rgba(37,99,235,0.12)]"
    >
      {content}
    </Link>
  );
}

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

        let countQuery = supabase.from("ai_tools").select("id", { count: "exact", head: true });
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
        if (result.error) throw result.error;

        const rows = Array.isArray(result.data) ? (result.data as ToolRecord[]) : [];
        const uniqueMap = new Map<string, ToolRecord>();

        rows.forEach((tool, index) => {
          const slug = getCanonicalSlug(tool);
          const key = slug ? `slug:${slug}` : tool.id != null ? `id:${String(tool.id)}` : `idx:${index}`;
          if (!uniqueMap.has(key)) uniqueMap.set(key, tool);
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
        console.error("[CATALOG_FETCH_ERROR]", error);
        if (!cancelled) {
          setTools([]);
          setTotalCount(0);
          setErrorMessage("Unable to load the AI tool directory. Please check your connection.");
        }
      } finally {
        if (!cancelled) setLoading(false);
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
      trackToolImpression(slug, getToolName(tool), getToolCategory(tool), index);
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

  return (
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
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={totalCount > 0 ? `Search ${totalCount.toLocaleString()} verified AI tools...` : "Search AI tools..."}
              aria-label="Search AI tools"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 pr-14 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            {localSearch && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-lg text-slate-700 hover:bg-slate-300"
              >
                ×
              </button>
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
            <h3 className="text-xl font-black text-slate-900">Directory unavailable</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{errorMessage}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white">
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-[26px] border border-slate-200 bg-slate-100/60 p-6" />
            ))}
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="rounded-[30px] border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
            <h3 className="text-xl font-black text-slate-900">No AI tools found</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Try another search term or select another category filter.</p>
            <button type="button" onClick={clearSearch} className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white">
              View All Tools
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredTools.map((tool, index) => (
              <ToolCard key={tool.id != null ? String(tool.id) : getCanonicalSlug(tool) || `tool-${index}`} tool={tool} index={index} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#050714]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-blue-500" />
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
