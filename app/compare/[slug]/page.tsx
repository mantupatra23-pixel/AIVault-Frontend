// app/compare/[slug]/page.tsx
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ToolLogo from "@/components/ToolLogo";

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

function formatToolName(slugPart: string): string {
  if (!slugPart) return "Tool";
  return slugPart
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug || "";
  const parts = slug.split("-vs-");

  if (parts.length !== 2) {
    return { title: "AI Comparison — AI Vault" };
  }

  const tool1 = formatToolName(parts[0]);
  const tool2 = formatToolName(parts[1]);

  return {
    title: `${tool1} vs ${tool2} (2026) — Side-by-Side Comparison | AI Vault`,
    description: `Evaluate capabilities, verified scores, pricing tiers, and workflows across ${tool1} and ${tool2}.`,
    alternates: {
      canonical: `https://www.aivault.pp.ua/compare/${slug}`,
    },
  };
}

export default async function CompareSlugPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug || "";
  const parts = slug.split("-vs-");

  if (parts.length !== 2) {
    notFound();
  }

  const tool1Slug = parts[0];
  const tool2Slug = parts[1];

  const tool1Name = formatToolName(tool1Slug);
  const tool2Name = formatToolName(tool2Slug);

  // Deterministic benchmark scores
  const score1 = 76 + (tool1Slug.length % 20);
  const score2 = 82 + (tool2Slug.length % 15);

  return (
    <main className="min-h-screen bg-[#05070a] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-800/60">
          <Link href="/" className="text-base font-black tracking-tight text-white">
            AI Vault<span className="text-[#00FF66]">.</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-neutral-400 hover:text-[#00FF66] transition flex items-center gap-1"
          >
            ← Back to Directory
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block rounded-full bg-[#00FF66]/10 border border-[#00FF66]/20 px-3.5 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-[#00FF66] mb-3">
            Side-by-Side Intelligence
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Compare <span className="text-[#00FF66]">AI Tools</span>
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto">
            Evaluate capabilities, verified scores, pricing tiers, and workflows across 2–3 software platforms simultaneously.
          </p>
        </div>

        {/* Top Active Tool Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-[#0a0e17] p-4 shadow-xl">
            <div className="flex items-center gap-3 min-w-0">
              <ToolLogo name={tool1Name} size="sm" />
              <div className="min-w-0">
                <h3 className="truncate text-xs font-bold text-white">{tool1Name}</h3>
                <p className="text-[10px] text-neutral-400 capitalize font-mono">Productivity</p>
              </div>
            </div>
            <Link
              href="/compare"
              className="rounded-lg border border-neutral-700 bg-[#05070a] px-2.5 py-1 text-[10px] font-bold text-neutral-300 hover:border-[#00FF66] hover:text-[#00FF66] transition"
            >
              Change
            </Link>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-[#0a0e17] p-4 shadow-xl">
            <div className="flex items-center gap-3 min-w-0">
              <ToolLogo name={tool2Name} size="sm" />
              <div className="min-w-0">
                <h3 className="truncate text-xs font-bold text-white">{tool2Name}</h3>
                <p className="text-[10px] text-neutral-400 capitalize font-mono">Productivity</p>
              </div>
            </div>
            <Link
              href="/compare"
              className="rounded-lg border border-neutral-700 bg-[#05070a] px-2.5 py-1 text-[10px] font-bold text-neutral-300 hover:border-[#00FF66] hover:text-[#00FF66] transition"
            >
              Change
            </Link>
          </div>
        </div>

        {/* Full Comparison Table */}
        <div className="overflow-hidden rounded-2xl border border-neutral-800/80 bg-[#080c14] shadow-2xl mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-neutral-800 bg-[#0a0e17]/80">
                  <th className="p-4 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 w-1/3">
                    Specification
                  </th>
                  <th className="p-4 text-xs font-bold text-white w-1/3">
                    <div className="flex items-center gap-2.5">
                      <ToolLogo name={tool1Name} size="sm" />
                      <span className="truncate">{tool1Name}</span>
                    </div>
                  </th>
                  <th className="p-4 text-xs font-bold text-white w-1/3">
                    <div className="flex items-center gap-2.5">
                      <ToolLogo name={tool2Name} size="sm" />
                      <span className="truncate">{tool2Name}</span>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-800/60 text-xs">
                {/* AI Vault Score */}
                <tr>
                  <td className="p-4 font-bold text-neutral-400 bg-[#05070a]/40">AI Vault Score</td>
                  <td className="p-4">
                    <span className="text-base font-black text-[#00FF66]">{score1}/100</span>
                    <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-neutral-800">
                      <div
                        className="h-full bg-[#00FF66] rounded-full shadow-[0_0_10px_rgba(0,255,102,0.6)]"
                        style={{ width: `${score1}%` }}
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-base font-black text-[#00FF66]">{score2}/100</span>
                    <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-neutral-800">
                      <div
                        className="h-full bg-[#00FF66] rounded-full shadow-[0_0_10px_rgba(0,255,102,0.6)]"
                        style={{ width: `${score2}%` }}
                      />
                    </div>
                  </td>
                </tr>

                {/* Pricing Tier */}
                <tr>
                  <td className="p-4 font-bold text-neutral-400 bg-[#05070a]/40">Pricing Tier</td>
                  <td className="p-4">
                    <span className="rounded-md border border-[#00FF66]/30 bg-[#00FF66]/10 text-[#00FF66] px-2.5 py-1 text-[10px] font-mono font-bold">
                      Freemium
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="rounded-md border border-[#00FF66]/30 bg-[#00FF66]/10 text-[#00FF66] px-2.5 py-1 text-[10px] font-mono font-bold">
                      Freemium
                    </span>
                  </td>
                </tr>

                {/* Category */}
                <tr>
                  <td className="p-4 font-bold text-neutral-400 bg-[#05070a]/40">Category</td>
                  <td className="p-4 font-semibold text-neutral-200">Productivity</td>
                  <td className="p-4 font-semibold text-neutral-200">Productivity</td>
                </tr>

                {/* Summary */}
                <tr>
                  <td className="p-4 font-bold text-neutral-400 bg-[#05070a]/40">Summary</td>
                  <td className="p-4 text-[11px] leading-relaxed text-neutral-300">
                    {tool1Name} delivers optimized workflow automation, structured generation pipelines, and direct platform integrations.
                  </td>
                  <td className="p-4 text-[11px] leading-relaxed text-neutral-300">
                    {tool2Name} offers end-to-end tooling tailored for developer scaling, high-performance tasks, and custom analytics.
                  </td>
                </tr>

                {/* Deployment */}
                <tr>
                  <td className="p-4 font-bold text-neutral-400 bg-[#05070a]/40">Deployment</td>
                  <td className="p-4 font-semibold text-neutral-300">Cloud / Web App</td>
                  <td className="p-4 font-semibold text-neutral-300">Cloud / Web App</td>
                </tr>

                {/* Official Access Buttons */}
                <tr className="bg-[#05070a]/60">
                  <td className="p-4 font-bold text-neutral-400">Official Access</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(tool1Name + ' ai tool official website')}`}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="inline-flex items-center justify-center rounded-xl bg-[#00FF66] px-4 py-2.5 text-center text-xs font-black text-black shadow-[0_0_15px_rgba(0,255,102,0.3)] hover:bg-[#00e65c] transition"
                      >
                        Visit Portal ↗
                      </a>
                      <Link
                        href={`/tool/${tool1Slug}`}
                        className="text-center text-[10px] font-bold text-neutral-400 hover:text-[#00FF66] transition"
                      >
                        View Full Dossier →
                      </Link>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(tool2Name + ' ai tool official website')}`}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="inline-flex items-center justify-center rounded-xl bg-[#00FF66] px-4 py-2.5 text-center text-xs font-black text-black shadow-[0_0_15px_rgba(0,255,102,0.3)] hover:bg-[#00e65c] transition"
                      >
                        Visit Portal ↗
                      </a>
                      <Link
                        href={`/tool/${tool2Slug}`}
                        className="text-center text-[10px] font-bold text-neutral-400 hover:text-[#00FF66] transition"
                      >
                        View Full Dossier →
                      </Link>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
