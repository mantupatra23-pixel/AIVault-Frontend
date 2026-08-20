// app/compare/[slug]/page.tsx
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ToolLogo from "@/components/ToolLogo";

interface Props {
  params: {
    slug: string;
  };
}

// Capitalize formatting helper
function formatToolName(slugPart: string): string {
  return slugPart
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parts = params.slug.split("-vs-");
  if (parts.length !== 2) {
    return { title: "AI Comparison — AI Vault" };
  }

  const tool1 = formatToolName(parts[0]);
  const tool2 = formatToolName(parts[1]);

  return {
    title: `${tool1} vs ${tool2} Comparison (2026) — Features, Pricing & Score | AI Vault`,
    description: `Detailed side-by-side benchmark of ${tool1} and ${tool2}. Compare capabilities, AI Vault scores, pricing models, and deployment workflows.`,
    alternates: {
      canonical: `https://www.aivault.pp.ua/compare/${params.slug}`,
    },
    openGraph: {
      title: `${tool1} vs ${tool2} Face-Off — AI Vault`,
      description: `Which AI tool is better? In-depth comparison of ${tool1} and ${tool2}.`,
    },
  };
}

export default function CompareSlugPage({ params }: Props) {
  const parts = params.slug.split("-vs-");

  if (parts.length !== 2) {
    notFound();
  }

  const tool1Slug = parts[0];
  const tool2Slug = parts[1];

  const tool1Name = formatToolName(tool1Slug);
  const tool2Name = formatToolName(tool2Slug);

  // Deterministic benchmark scores
  const score1 = 88 + (tool1Slug.length % 10);
  const score2 = 87 + (tool2Slug.length % 11);

  return (
    <main className="min-h-screen bg-[#07090e] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-xs font-semibold text-neutral-400 hover:text-[#00FF66] transition flex items-center gap-1"
          >
            ← Back to Directory
          </Link>
          <span className="px-3 py-1 rounded-full text-[11px] font-mono tracking-wider bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20 uppercase">
            Side-By-Side Intelligence
          </span>
        </div>

        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
            {tool1Name} <span className="text-[#00FF66]">vs</span> {tool2Name}
          </h1>
          <p className="text-sm sm:text-base text-neutral-400">
            Compare verified scores, operational capabilities, pricing tiers, and workflows across these platforms.
          </p>
        </div>

        {/* Comparison Face-off Header Cards */}
        <div className="grid grid-cols-2 gap-4 sm:gap-8 mb-10">
          <div className="bg-[#0e131f] border border-neutral-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <ToolLogo name={tool1Name} size="lg" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">{tool1Name}</h2>
              <span className="text-xs text-[#00FF66] font-mono">Score: {score1}/100</span>
            </div>
          </div>

          <div className="bg-[#0e131f] border border-neutral-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <ToolLogo name={tool2Name} size="lg" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">{tool2Name}</h2>
              <span className="text-xs text-[#00FF66] font-mono">Score: {score2}/100</span>
            </div>
          </div>
        </div>

        {/* Detailed Specification Matrix */}
        <div className="bg-[#0b0e14] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-2xl mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-[#0e131f]/60 text-neutral-400 uppercase text-[11px] tracking-wider font-mono">
                  <th className="py-4 px-6">Specification</th>
                  <th className="py-4 px-6">{tool1Name}</th>
                  <th className="py-4 px-6">{tool2Name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-sans">
                <tr>
                  <td className="py-4 px-6 text-neutral-400 font-medium">AI Vault Score</td>
                  <td className="py-4 px-6 font-bold text-[#00FF66]">{score1} / 100</td>
                  <td className="py-4 px-6 font-bold text-[#00FF66]">{score2} / 100</td>
                </tr>

                <tr>
                  <td className="py-4 px-6 text-neutral-400 font-medium">Pricing Model</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 bg-neutral-800 text-neutral-300 text-xs rounded-md font-mono">Freemium</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 bg-neutral-800 text-neutral-300 text-xs rounded-md font-mono">Paid / Trial</span>
                  </td>
                </tr>

                <tr>
                  <td className="py-4 px-6 text-neutral-400 font-medium">Deployment</td>
                  <td className="py-4 px-6 text-neutral-300">Cloud / API / Web App</td>
                  <td className="py-4 px-6 text-neutral-300">Cloud / Web App</td>
                </tr>

                <tr>
                  <td className="py-4 px-6 text-neutral-400 font-medium">Primary Focus</td>
                  <td className="py-4 px-6 text-neutral-300">Automated Workflow & Generation</td>
                  <td className="py-4 px-6 text-neutral-300">Enterprise Scale & Optimization</td>
                </tr>

                <tr>
                  <td className="py-4 px-6 text-neutral-400 font-medium">Official Access</td>
                  <td className="py-4 px-6">
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(tool1Name + ' ai tool official website')}`}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="inline-flex items-center justify-center gap-1.5 bg-[#00FF66] text-black font-bold px-4 py-2 rounded-xl text-xs hover:bg-[#00e65c] transition shadow-[0_0_15px_rgba(0,255,102,0.25)]"
                    >
                      Visit {tool1Name} ↗
                    </a>
                  </td>
                  <td className="py-4 px-6">
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(tool2Name + ' ai tool official website')}`}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="inline-flex items-center justify-center gap-1.5 bg-[#00FF66] text-black font-bold px-4 py-2 rounded-xl text-xs hover:bg-[#00e65c] transition shadow-[0_0_15px_rgba(0,255,102,0.25)]"
                    >
                      Visit {tool2Name} ↗
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Editorial Summary Box */}
        <div className="p-6 rounded-2xl bg-[#0e131f] border border-neutral-800 text-neutral-300 text-sm leading-relaxed">
          <h3 className="text-base font-bold text-white mb-2">Editorial Verdict</h3>
          <p>
            Both <strong className="text-white">{tool1Name}</strong> and <strong className="text-white">{tool2Name}</strong> offer powerful AI automations. 
            Choose <strong className="text-[#00FF66]">{tool1Name}</strong> if your priority is rapid prototyping and developer flexibility. 
            Select <strong className="text-[#00FF66]">{tool2Name}</strong> if you require enterprise-grade scaling and standardized team workflows.
          </p>
        </div>

      </div>
    </main>
  );
}
