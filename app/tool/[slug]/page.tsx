import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import ToolLogo from "@/components/ToolLogo";
import ToolScore from "@/components/ToolScore";

import { normalizeTool } from "@/lib/normalize-tool";
import { findTool, findRelatedTools } from "@/lib/tool-lookup";
import { getToolHref } from "@/lib/tool-href";
import { getToolScore, scoreLabel } from "@/lib/score";

import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getAllTools() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_tools")
    .select("*");

  if (error) {
    console.error("AI Vault tools query failed:", error);
    return [];
  }

  return (data ?? []) as Record<string, unknown>[];
}

async function getCurrentTool(slug: string) {
  const rows = await getAllTools();

  return {
    tool: findTool(rows, slug),
    rows,
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const { tool } = await getCurrentTool(slug);

  if (!tool) {
    return {
      title: "Tool Not Found | AI Vault",
    };
  }

  return {
    title: `${tool.name} | AI Vault`,
    description:
      tool.description ??
      `Explore ${tool.name} on AI Vault.`,
  };
}

export default async function ToolPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const { tool, rows } = await getCurrentTool(slug);

  if (!tool) {
    notFound();
  }

  const score = getToolScore(tool);

  const related = findRelatedTools(
    rows,
    tool,
    6
  );

  const officialWebsite =
    tool.official_website ??
    tool.website ??
    tool.url ??
    null;

  const features = Array.isArray(tool.features)
    ? tool.features
    : [];

  const useCases = Array.isArray(tool.use_cases)
    ? tool.use_cases
    : [];

  const integrations = Array.isArray(tool.integrations)
    ? tool.integrations
    : [];

  const limitations = Array.isArray(tool.limitations)
    ? tool.limitations
    : [];

  const platforms = Array.isArray(tool.platforms)
    ? tool.platforms
    : [];

  return (
    <main className="min-h-screen bg-[#f7f8fc]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <div className="mb-6 text-xs text-slate-400">
          <Link href="/" className="hover:text-blue-600">
            Home
          </Link>

          <span className="mx-2">/</span>

          <span>{tool.category ?? "Other"}</span>

          <span className="mx-2">/</span>

          <span className="text-slate-500">
            {tool.name}
          </span>
        </div>

        {/* HERO */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <ToolLogo
              name={tool.name}
              src={tool.logo_url ?? tool.logo}
              size="lg"
            />

            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Verified AI Tool
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {tool.category ?? "Other"}
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {tool.name}
              </h1>

              <div className="mt-3">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                  {tool.pricing ?? "Not specified"}
                </span>
              </div>
            </div>
          </div>

          {/* CANONICAL SCORE */}
          <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <ToolScore tool={tool} />

            {score !== null && (
              <p className="mt-2 text-xs text-slate-400">
                {scoreLabel(tool)} AI Vault evaluation
              </p>
            )}
          </div>

          {/* OVERVIEW */}
          <div className="mt-8">
            <p className="text-sm leading-7 text-slate-600">
              {tool.overview ??
                tool.description ??
                `Explore ${tool.name}, including its features, pricing, platforms, and use cases.`}
            </p>
          </div>

          {/* META */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <InfoCard
              label="AI Vault Score"
              value={
                score !== null
                  ? `${score}/100`
                  : "Not rated"
              }
            />

            <InfoCard
              label="Pricing"
              value={
                tool.pricing ??
                tool.pricing_model ??
                "Not specified"
              }
            />

            <InfoCard
              label="Category"
              value={tool.category ?? "Other"}
            />
          </div>
        </section>

        {/* TOOL INTELLIGENCE */}
        <section className="mt-10">
          <div className="mb-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500">
              Layer 1
            </span>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Tool Intelligence
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Understand this AI tool's features, use cases,
              pricing, platforms, and available product information.
            </p>
          </div>

          {/* CONTENT QUALITY — NOT AI VAULT SCORE */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">
              AI Vault Content Quality
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Completeness of the available database information.
            </p>

            <div className="mt-5 rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                This is content completeness information and is
                separate from the AI Vault Score.
              </p>
            </div>
          </div>
        </section>

        {/* OVERVIEW */}
        <ContentSection
          title="Tool Overview"
          content={
            tool.overview ??
            tool.description ??
            "Overview information is not available in the current database record."
          }
        />

        {/* FEATURES */}
        <ListSection
          title="Key Features"
          items={features}
          empty="Feature information is not available in the current database record."
        />

        {/* USE CASES */}
        <ListSection
          title="Use Cases"
          items={useCases}
          empty="Use-case information is not available in the current database record."
        />

        {/* PRICING */}
        <ContentSection
          title="Pricing"
          content={
            tool.pricing ??
            tool.pricing_model ??
            "Pricing information is not available."
          }
        />

        {/* PLATFORM */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Platform Details
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoCard
              label="Platforms"
              value={
                platforms.length
                  ? platforms.join(", ")
                  : "Not specified"
              }
            />

            <InfoCard
              label="Deployment"
              value={
                tool.deployment ?? "Not specified"
              }
            />

            <InfoCard
              label="License"
              value={
                tool.license ?? "Not specified"
              }
            />

            <InfoCard
              label="Pricing"
              value={
                tool.pricing ??
                tool.pricing_model ??
                "Not specified"
              }
            />
          </div>
        </section>

        {/* INTEGRATIONS */}
        <ListSection
          title="Integrations"
          items={integrations}
          empty="Integration information is not available in the current database record."
        />

        {/* LIMITATIONS */}
        <ListSection
          title="Limitations"
          items={limitations}
          empty="No specific limitations have been recorded in the current database entry."
        />

        {/* RELATED */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-5 text-2xl font-bold text-slate-950">
              Discover Similar Tools
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={String(item.id ?? item.slug)}
                  href={getToolHref(item)}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <ToolLogo
                      name={item.name}
                      src={
                        item.logo_url ??
                        item.logo
                      }
                      size="sm"
                    />

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-slate-950">
                        {item.name}
                      </h3>

                      <p className="text-[10px] text-slate-400">
                        {item.category ?? "Other"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {item.pricing ??
                        item.pricing_model ??
                        "Not specified"}
                    </span>

                    <span className="text-xs font-bold text-blue-600">
                      Explore →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* OFFICIAL WEBSITE */}
        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Official Website
          </h2>

          {officialWebsite ? (
            <a
              href={officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-600"
            >
              Visit Official Website ↗
            </a>
          ) : (
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-400">
              Official website is not available in the current database record.
            </div>
          )}
        </section>

        {/* CTA */}
        {officialWebsite && (
          <section className="mt-6 rounded-3xl bg-[#050718] px-6 py-12 text-center text-white sm:px-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-300">
              AI Vault
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Ready to explore {tool.name}?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
              Visit the official platform to verify the latest product information.
            </p>

            <a
              href={officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-950 hover:bg-blue-50"
            >
              Visit Official Website ↗
            </a>
          </section>
        )}

        <div className="mt-8 pb-10 text-center">
          <Link
            href="/"
            className="text-sm font-bold text-blue-600"
          >
            ← Back to AI Directory
          </Link>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function ContentSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">
        {title}
      </h2>

      <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">
        {content}
      </p>
    </section>
  );
}

function ListSection({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">
        {title}
      </h2>

      {items.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="rounded-full bg-slate-50 px-4 py-2 text-xs text-slate-600"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">
          {empty}
        </div>
      )}
    </section>
  );
}
