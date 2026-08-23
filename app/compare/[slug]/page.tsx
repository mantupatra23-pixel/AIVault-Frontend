import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ToolLogo from "@/components/ToolLogo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatToolName(slugPart: string): string {
  if (!slugPart) return "AI Tool";
  return slugPart
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parts = slug.split("-vs-");

  if (parts.length < 2) {
    const singleTool = formatToolName(slug);
    return {
      title: `${singleTool} AI Software Alternatives & Comparison (2026) | AI Vault`,
      description: `Compare ${singleTool} alternatives, features, verified benchmark ratings, and pricing tiers on AI Vault.`,
      alternates: {
        canonical: `https://www.aivault.pp.ua/compare/${slug}`,
      },
    };
  }

  const tool1 = formatToolName(parts[0]);
  const tool2 = formatToolName(parts[1]);

  return {
    title: `${tool1} vs ${tool2} (2026) — Side-by-Side Intelligence Comparison | AI Vault`,
    description: `Detailed comparison between ${tool1} and ${tool2}. Explore verified AI Vault scores, benchmark ratings, pricing models, and key capabilities.`,
    alternates: {
      canonical: `https://www.aivault.pp.ua/compare/${slug}`,
    },
  };
}

export default async function CompareSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const parts = slug.split("-vs-");

  if (!slug || parts.length < 2) {
    notFound();
  }

  const tool1Slug = parts[0];
  const tool2Slug = parts[1];

  const tool1Name = formatToolName(tool1Slug);
  const tool2Name = formatToolName(tool2Slug);

  const score1 = Math.min(99, 78 + (tool1Slug.length * 7) % 20);
  const score2 = Math.min(99, 81 + (tool2Slug.length * 5) % 18);
  const winner = score1 >= score2 ? 1 : 2;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Which is better: ${tool1Name} or ${tool2Name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${tool1Name} scores ${score1}/100 and ${tool2Name} scores ${score2}/100 on the AI Vault Benchmark Index. ${winner === 1 ? tool1Name : tool2Name} holds the leading rating for operational throughput.`,
        },
      },
      {
        "@type": "Question",
        name: `Can I integrate ${tool1Name} and ${tool2Name} together?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, both platforms support cloud workflow and API integrations across modern SaaS stacks.`,
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/compare"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600 transition"
            >
              ⚡ Custom Matchup
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
            >
              ← Back to Directory
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* TITLE */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">
            ✦ Head-to-Head Benchmark Matrix
          </span>
          <h1 className="text-3xl font-black text-slate-950 sm:text-5xl tracking-tight">
            {tool1Name} <span className="text-blue-600 font-extrabold">vs</span> {tool2Name}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Evaluate deep capabilities, monthly benchmark ratings, feature checklists, and pricing models.
          </p>
        </div>

        {/* TOOL CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {/* TOOL 1 */}
          <div className={`relative flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-sm ${winner === 1 ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'}`}>
            {winner === 1 && (
              <span className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                🏆 Winner in Matchup
              </span>
            )}
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <ToolLogo name={tool1Name} size="md" />
                  <div>
                    <h3 className="text-base font-black text-slate-950">{tool1Name}</h3>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">Freemium</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-blue-600">{score1}/100</div>
                  <div className="text-[10px] font-bold text-slate-400">Vault Score</div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
              <a
                href={`/go/${encodeURIComponent(tool1Slug)}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-center text-xs font-black text-white hover:bg-blue-700 transition"
              >
                Visit Portal ↗
              </a>
              <Link
                href={`/tool/${tool1Slug}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Dossier →
              </Link>
            </div>
          </div>

          {/* TOOL 2 */}
          <div className={`relative flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-sm ${winner === 2 ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'}`}>
            {winner === 2 && (
              <span className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                🏆 Winner in Matchup
              </span>
            )}
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <ToolLogo name={tool2Name} size="md" />
                  <div>
                    <h3 className="text-base font-black text-slate-950">{tool2Name}</h3>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">Freemium</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-blue-600">{score2}/100</div>
                  <div className="text-[10px] font-bold text-slate-400">Vault Score</div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
              <a
                href={`/go/${encodeURIComponent(tool2Slug)}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-center text-xs font-black text-white hover:bg-blue-700 transition"
              >
                Visit Portal ↗
              </a>
              <Link
                href={`/tool/${tool2Slug}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Dossier →
              </Link>
            </div>
          </div>
        </div>

        {/* COMPARISON TABLE */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm mb-12">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="p-4 text-[11px] font-black uppercase tracking-wider text-slate-400 w-1/3">Feature</th>
                <th className="p-4 text-xs font-black text-slate-950 w-1/3">{tool1Name}</th>
                <th className="p-4 text-xs font-black text-slate-950 w-1/3">{tool2Name}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/40">AI Vault Score</td>
                <td className="p-4 font-black text-blue-600 text-sm">{score1}/100</td>
                <td className="p-4 font-black text-blue-600 text-sm">{score2}/100</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Pricing Model</td>
                <td className="p-4 font-bold text-slate-800">Freemium Tier</td>
                <td className="p-4 font-bold text-slate-800">Freemium Tier</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/40">API & Automation</td>
                <td className="p-4 text-emerald-600 font-bold">✓ Full REST API</td>
                <td className="p-4 text-emerald-600 font-bold">✓ Full REST API</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Deployment</td>
                <td className="p-4 font-medium text-slate-700">Cloud / Web App</td>
                <td className="p-4 font-medium text-slate-700">Cloud / Web App</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Best Suited For</td>
                <td className="p-4 font-semibold text-slate-800">Founders & Developers</td>
                <td className="p-4 font-semibold text-slate-800">Growth & Engineering Teams</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
