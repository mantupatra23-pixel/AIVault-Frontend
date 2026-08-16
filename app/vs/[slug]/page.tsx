// app/vs/[slug]/page.tsx
"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

import ToolLogo from "@/components/ToolLogo";
import { cleanAiContent } from "@/lib/content-quality";
import { getToolScore, formatAIScore } from "@/lib/score";

type ToolRecord = {
  id?: string | number | null;
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  overview?: string | null;
  category?: string | null;
  pricing?: string | null;
  pricing_type?: string | null;
  score?: number | string | null;
  ai_vault_score?: number | string | null;
  logo_url?: string | null;
  logo?: string | null;
  website_url?: string | null;
  website?: string | null;
  affiliate_url?: string | null;
  deployment?: string | null;
  [key: string]: unknown;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function ToolComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const rawSlug = decodeURIComponent(resolvedParams.slug || "").trim();

  const [toolA, setToolA] = useState<ToolRecord | null>(null);
  const [toolB, setToolB] = useState<ToolRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Parse "tool1-vs-tool2"
  const [slugA, slugB] = useMemo(() => {
    const parts = rawSlug.split("-vs-");
    return [parts[0]?.trim() || "", parts[1]?.trim() || ""];
  }, [rawSlug]);

  useEffect(() => {
    async function loadComparisonData() {
      if (!slugA || !slugB) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [{ data: dataA }, { data: dataB }] = await Promise.all([
          supabase
            .from("ai_tools")
            .select("*")
            .or(`slug.eq.${slugA},name.ilike.${slugA}`)
            .limit(1)
            .maybeSingle(),
          supabase
            .from("ai_tools")
            .select("*")
            .or(`slug.eq.${slugB},name.ilike.${slugB}`)
            .limit(1)
            .maybeSingle(),
        ]);

        setToolA(dataA || null);
        setToolB(dataB || null);
      } catch (err) {
        console.error("Comparison load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadComparisonData();
  }, [slugA, slugB]);

  const nameA = String(toolA?.name || "Tool A");
  const nameB = String(toolB?.name || "Tool B");

  const scoreA = getToolScore(toolA);
  const scoreB = getToolScore(toolB);

  const priceA = String(toolA?.pricing || toolA?.pricing_type || "Freemium");
  const priceB = String(toolB?.pricing || toolB?.pricing_type || "Freemium");

  const catA = String(toolA?.category || "Productivity");
  const catB = String(toolB?.category || "Productivity");

  const descA = cleanAiContent(String(toolA?.overview || toolA?.description || ""));
  const descB = cleanAiContent(String(toolB?.overview || toolB?.description || ""));

  const getTargetUrl = (t: ToolRecord | null) => {
    let raw = t?.affiliate_url?.trim() || t?.website_url?.trim() || t?.website?.trim() || "";
    if (!raw) return `/go/${encodeURIComponent(String(t?.slug || ""))}`;
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
      raw = `https://${raw}`;
    }
    return raw;
  };

  const handleTrack = (t: ToolRecord | null) => {
    if (!t) return;
    try {
      fetch("/api/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id, slug: t.slug }),
      }).catch(() => {});
    } catch {}
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fafbfc]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </main>
    );
  }

  if (!toolA || !toolB) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#fafbfc] px-4 text-center">
        <h1 className="text-2xl font-black text-slate-900">Comparison Data Not Found</h1>
        <p className="mt-2 text-xs text-slate-500 max-w-sm">
          Could not locate one or both tools for comparison ({slugA} vs {slugB}).
        </p>
        <Link
          href="/compare"
          className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
        >
          ← Choose Tools in Matrix
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-28">
      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Product",
                "name": nameA,
                "category": catA,
                "description": descA,
                "offers": {
                  "@type": "Offer",
                  "price": priceA === "Free" ? "0" : "Paid",
                  "priceCurrency": "USD",
                },
              },
              {
                "@type": "Product",
                "name": nameB,
                "category": catB,
                "description": descB,
                "offers": {
                  "@type": "Offer",
                  "price": priceB === "Free" ? "0" : "Paid",
                  "priceCurrency": "USD",
                },
              },
            ],
          }),
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/matcher"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
            >
              <span>⚡ Matcher</span>
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
            >
              <span>⚖️ All Comparisons</span>
            </Link>
            <Link
              href="/submit"
              className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition"
            >
              <span>+ Submit</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-[11px] font-medium text-slate-400">
          <Link href="/" className="hover:text-blue-600">Directory</Link>
          <span>/</span>
          <Link href="/compare" className="hover:text-blue-600">Compare</Link>
          <span>/</span>
          <span className="font-semibold text-slate-700">{nameA} vs {nameB}</span>
        </div>

        {/* Hero */}
        <section className="bg-[#050714] rounded-3xl px-6 py-12 text-center text-white sm:py-16 shadow-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-300 mb-4">
            ⚡ Automated Decision Matrix
          </div>
          <h1 className="mx-auto max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
            {nameA} <span className="text-slate-500 font-light">vs</span> {nameB}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-xs sm:text-sm text-slate-400 leading-relaxed">
            In-depth head-to-head comparison evaluating performance, pricing models, features, and workflow compatibility.
          </p>
        </section>

        {/* Cards */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A */}
          <div className="rounded-3xl border-2 border-blue-600/30 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ToolLogo src={toolA.logo_url as string} name={nameA} size="lg" />
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">{nameA}</h2>
                    <span className="rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-[10px] font-bold">
                      {catA}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Score</span>
                  <span className="text-xl font-black text-blue-600">{formatAIScore(scoreA)}</span>
                </div>
              </div>

              <p className="mt-5 text-xs leading-relaxed text-slate-600">
                {descA || `${nameA} provides streamlined AI solutions for ${catA.toLowerCase()} tasks.`}
              </p>

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">Pricing Model:</span>
                  <span className="font-black text-slate-900">{priceA}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">Deployment:</span>
                  <span className="font-black text-slate-900">{String(toolA.deployment || "Cloud / Web App")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">Ecosystem Rank:</span>
                  <span className="font-black text-emerald-600">Top Tier Verified</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <a
                href={getTargetUrl(toolA)}
                onClick={() => handleTrack(toolA)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center rounded-2xl bg-blue-600 py-3.5 text-xs font-black text-white hover:bg-blue-700 transition shadow-md shadow-blue-500/25 active:scale-[0.98]"
              >
                Visit {nameA} ↗
              </a>
            </div>
          </div>

          {/* Card B */}
          <div className="rounded-3xl border-2 border-indigo-600/30 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ToolLogo src={toolB.logo_url as string} name={nameB} size="lg" />
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">{nameB}</h2>
                    <span className="rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-[10px] font-bold">
                      {catB}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Score</span>
                  <span className="text-xl font-black text-indigo-600">{formatAIScore(scoreB)}</span>
                </div>
              </div>

              <p className="mt-5 text-xs leading-relaxed text-slate-600">
                {descB || `${nameB} provides streamlined AI solutions for ${catB.toLowerCase()} tasks.`}
              </p>

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">Pricing Model:</span>
                  <span className="font-black text-slate-900">{priceB}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">Deployment:</span>
                  <span className="font-black text-slate-900">{String(toolB.deployment || "Cloud / Web App")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">Ecosystem Rank:</span>
                  <span className="font-black text-emerald-600">Top Tier Verified</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <a
                href={getTargetUrl(toolB)}
                onClick={() => handleTrack(toolB)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center rounded-2xl bg-indigo-600 py-3.5 text-xs font-black text-white hover:bg-indigo-700 transition shadow-md shadow-indigo-500/25 active:scale-[0.98]"
              >
                Visit {nameB} ↗
              </a>
            </div>
          </div>
        </section>

        {/* Matrix Table */}
        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm overflow-hidden">
          <h2 className="text-lg font-black text-slate-950 mb-6">
            Detailed Capability Breakdown
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3 px-4">Evaluation Criteria</th>
                  <th className="py-3 px-4 text-blue-600">{nameA}</th>
                  <th className="py-3 px-4 text-indigo-600">{nameB}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">AI Vault Score</td>
                  <td className="py-3.5 px-4 font-black text-blue-600">{formatAIScore(scoreA)}</td>
                  <td className="py-3.5 px-4 font-black text-indigo-600">{formatAIScore(scoreB)}</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">Category</td>
                  <td className="py-3.5 px-4">{catA}</td>
                  <td className="py-3.5 px-4">{catB}</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">Pricing Tier</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{priceA}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{priceB}</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">API & Cloud Access</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-bold">✓ Cloud Supported</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-bold">✓ Cloud Supported</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">Ideal User Profile</td>
                  <td className="py-3.5 px-4">Founders & Operators</td>
                  <td className="py-3.5 px-4">Engineers & Power Users</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Verdict */}
        <section className="mt-8 rounded-3xl bg-gradient-to-br from-slate-900 via-[#070913] to-slate-950 p-8 text-white shadow-xl">
          <div className="inline-block rounded-full bg-blue-500/20 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest text-blue-300 mb-3">
            Editorial Verdict
          </div>
          <h2 className="text-xl font-black sm:text-2xl">Which one should you choose?</h2>
          <p className="mt-3 text-xs leading-relaxed text-slate-300 max-w-3xl">
            Choose <strong>{nameA}</strong> if your primary focus is streamlined {catA.toLowerCase()} tasks under a {priceA} structure. Choose <strong>{nameB}</strong> for specialized capabilities in {catB.toLowerCase()} workflows.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/tool/${encodeURIComponent(String(toolA.slug || slugA))}`}
              className="rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
            >
              Explore {nameA} Dossier →
            </Link>
            <Link
              href={`/tool/${encodeURIComponent(String(toolB.slug || slugB))}`}
              className="rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
            >
              Explore {nameB} Dossier →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
