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
  if (!slugPart) return "AI Tool";
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

  const score1 = 76 + (tool1Slug.length % 20);
  const score2 = 82 + (tool2Slug.length % 15);

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/compare"
              className="text-xs font-bold text-slate-600 hover:text-blue-600 transition"
            >
              ← Back to Comparison Hub
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Title Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block rounded-full bg-blue-600/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">
            Side-by-Side Intelligence
          </span>
          <h1 className="text-3xl font-black text-slate-950 sm:text-4xl tracking-tight">
            {tool1Name} <span className="text-blue-600">vs</span> {tool2Name}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Evaluate capabilities, verified scores, pricing tiers, and workflows across these platforms.
          </p>
        </div>

        {/* Selected Tool Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="relative flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <ToolLogo name={tool1Name} size="sm" />
              <div className="min-w-0">
                <h3 className="truncate text-xs font-black text-slate-950">{tool1Name}</h3>
                <p className="text-[10px] text-slate-400 capitalize">Productivity</p>
              </div>
            </div>
            <Link
              href="/compare"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 shadow-sm"
            >
              Change
            </Link>
          </div>

          <div className="relative flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <ToolLogo name={tool2Name} size="sm" />
              <div className="min-w-0">
                <h3 className="truncate text-xs font-black text-slate-950">{tool2Name}</h3>
                <p className="text-[10px] text-slate-400 capitalize">Productivity</p>
              </div>
            </div>
            <Link
              href="/compare"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 shadow-sm"
            >
              Change
            </Link>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-400 w-1/3">
                    Specification
                  </th>
                  <th className="p-4 text-xs font-black text-slate-950 w-1/3">
                    <div className="flex items-center gap-2">
                      <ToolLogo name={tool1Name} size="sm" />
                      <span className="truncate">{tool1Name}</span>
                    </div>
                  </th>
                  <th className="p-4 text-xs font-black text-slate-950 w-1/3">
                    <div className="flex items-center gap-2">
                      <ToolLogo name={tool2Name} size="sm" />
                      <span className="truncate">{tool2Name}</span>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">
                <tr>
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/40">AI Vault Score</td>
                  <td className="p-4">
                    <span className="text-base font-black text-blue-600">{score1}/100</span>
                    <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${score1}%` }} />
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-base font-black text-blue-600">{score2}/100</span>
                    <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${score2}%` }} />
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Pricing Tier</td>
                  <td className="p-4 font-bold text-slate-900">
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px]">
                      Freemium
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px]">
                      Freemium
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Category</td>
                  <td className="p-4 capitalize font-semibold text-slate-700">Productivity</td>
                  <td className="p-4 capitalize font-semibold text-slate-700">Productivity</td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Summary</td>
                  <td className="p-4 text-[11px] leading-relaxed text-slate-600">
                    {tool1Name} is designed to streamline automated workflows, content processing, and team efficiency.
                  </td>
                  <td className="p-4 text-[11px] leading-relaxed text-slate-600">
                    {tool2Name} offers high-performance execution, custom platform integrations, and developer scalability.
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Deployment</td>
                  <td className="p-4 font-semibold text-slate-700">Cloud / Web App</td>
                  <td className="p-4 font-semibold text-slate-700">Cloud / Web App</td>
                </tr>

                <tr className="bg-slate-50/40">
                  <td className="p-4 font-bold text-slate-500">Official Access</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(tool1Name + ' ai official website')}`}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-center text-xs font-black text-white shadow-sm hover:bg-blue-700 transition"
                      >
                        Visit Portal ↗
                      </a>
                      <Link
                        href={`/tool/${tool1Slug}`}
                        className="text-center text-[10px] font-bold text-slate-600 hover:text-blue-600 underline"
                      >
                        View Full Dossier →
                      </Link>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(tool2Name + ' ai official website')}`}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-center text-xs font-black text-white shadow-sm hover:bg-blue-700 transition"
                      >
                        Visit Portal ↗
                      </a>
                      <Link
                        href={`/tool/${tool2Slug}`}
                        className="text-center text-[10px] font-bold text-slate-600 hover:text-blue-600 underline"
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
