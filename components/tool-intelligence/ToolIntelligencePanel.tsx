"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  calculateToolQuality,
  getToolFeatures,
  getToolIntegrations,
  getToolLimitations,
  getToolPlatforms,
  getToolPricing,
  getToolUseCases,
  getToolWebsite,
  rankRelatedTools,
  type RelatedToolResult,
  type ToolIntelligenceInput,
} from "@/lib/tool-intelligence";

interface Props {
  tool: ToolIntelligenceInput;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        {title}
      </h3>

      {children}
    </section>
  );
}

function Chip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
      {children}
    </span>
  );
}

function RelatedCard({
  tool,
}: {
  tool: RelatedToolResult;
}) {
  const slug =
    typeof tool.slug === "string"
      ? tool.slug.trim()
      : "";

  if (!slug) {
    return null;
  }

  const name =
    typeof tool.name === "string" &&
    tool.name.trim()
      ? tool.name.trim()
      : "AI Tool";

  const category =
    typeof tool.category === "string" &&
    tool.category.trim()
      ? tool.category.trim()
      : null;

  const pricing =
    getToolPricing(tool);

  const score =
    tool._related_score ?? 0;

  return (
    <Link
      href={`/tool/${encodeURIComponent(
        slug,
      )}`}
      className="group block rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-base font-bold text-gray-900 group-hover:text-blue-600">
            {name}
          </h4>

          {category && (
            <p className="mt-1 text-xs font-medium text-gray-500">
              {category}
            </p>
          )}
        </div>

        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600">
          {score}% match
        </span>
      </div>

      {typeof tool.description ===
        "string" &&
        tool.description.trim() && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">
            {tool.description.trim()}
          </p>
        )}

      {tool._match_reasons &&
        tool._match_reasons.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tool._match_reasons
              .slice(0, 3)
              .map((reason) => (
                <span
                  key={reason}
                  className="rounded-full bg-gray-50 px-2.5 py-1 text-[11px] text-gray-500"
                >
                  {reason}
                </span>
              ))}
          </div>
        )}

      {pricing && (
        <div className="mt-4 border-t border-gray-100 pt-3 text-xs font-semibold text-gray-500">
          Pricing:{" "}
          <span className="text-gray-700">
            {pricing}
          </span>
        </div>
      )}
    </Link>
  );
}

export default function ToolIntelligencePanel({
  tool,
}: Props) {
  const quality =
    calculateToolQuality(tool);

  const features =
    getToolFeatures(tool);

  const useCases =
    getToolUseCases(tool);

  const platforms =
    getToolPlatforms(tool);

  const integrations =
    getToolIntegrations(tool);

  const limitations =
    getToolLimitations(tool);

  const pricing =
    getToolPricing(tool);

  const website =
    getToolWebsite(tool);

  const [related, setRelated] =
    useState<RelatedToolResult[]>(
      [],
    );

  const [relatedLoading, setRelatedLoading] =
    useState(true);

  const [relatedError, setRelatedError] =
    useState(false);

  /* =======================================================
     LAYER 2 — RELATED TOOLS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadRelatedTools() {
      const slug =
        typeof tool.slug === "string"
          ? tool.slug.trim()
          : "";

      if (!slug) {
        setRelatedLoading(false);
        return;
      }

      setRelatedLoading(true);
      setRelatedError(false);

      try {
        /*
         * Existing AI Vault backend endpoint.
         *
         * IMPORTANT:
         * NEXT_PUBLIC_API_URL must point to the
         * existing FastAPI backend.
         */
        const baseUrl =
          process.env
            .NEXT_PUBLIC_API_URL;

        if (!baseUrl) {
          throw new Error(
            "NEXT_PUBLIC_API_URL is not configured",
          );
        }

        const response =
          await fetch(
            `${baseUrl.replace(
              /\/$/,
              "",
            )}/api/tools/${encodeURIComponent(
              slug,
            )}/related`,
            {
              method: "GET",
              headers: {
                Accept:
                  "application/json",
              },
              next: {
                revalidate: 300,
              } as RequestInit["next"],
            } as RequestInit,
          );

        if (!response.ok) {
          throw new Error(
            `Related tools request failed: ${response.status}`,
          );
        }

        const data =
          (await response.json()) as {
            results?: RelatedToolResult[];
          };

        const results =
          Array.isArray(
            data.results,
          )
            ? data.results
            : [];

        if (!cancelled) {
          setRelated(
            results.slice(0, 5),
          );
        }
      } catch (error) {
        console.error(
          "[TOOL_RELATED_ERROR]",
          error,
        );

        if (!cancelled) {
          setRelated([]);
          setRelatedError(true);
        }
      } finally {
        if (!cancelled) {
          setRelatedLoading(false);
        }
      }
    }

    loadRelatedTools();

    return () => {
      cancelled = true;
    };
  }, [tool.slug]);

  /*
   * Client-side fallback.
   *
   * If the backend is unavailable but the page already
   * receives related candidate data in the future,
   * this remains deterministic.
   */
  const localRelated =
    useMemo(() => {
      return rankRelatedTools(
        tool,
        [],
        5,
      );
    }, [tool]);

  const displayRelated =
    related.length > 0
      ? related
      : localRelated;

  return (
    <div className="space-y-5">
      {/* =====================================================
          LAYER 1 — QUALITY
      ====================================================== */}

      <Section title="AI Vault Content Quality">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-8 border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {quality.score}
              </div>

              <div className="text-xs text-gray-500">
                / 100
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 text-xl font-semibold">
              {quality.label}
            </div>

            <div className="mb-3 text-sm text-gray-500">
              Grade {quality.grade}
            </div>

            <div className="flex flex-wrap gap-2">
              {quality.strengths
                .slice(0, 5)
                .map((item) => (
                  <Chip key={item}>
                    {item}
                  </Chip>
                ))}
            </div>
          </div>
        </div>

        {quality.missing.length >
          0 && (
          <div className="mt-5 rounded-xl bg-gray-50 p-4">
            <div className="mb-2 text-sm font-medium text-gray-900">
              Missing information
            </div>

            <div className="flex flex-wrap gap-2">
              {quality.missing.map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white px-3 py-1 text-sm text-gray-500"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>
        )}
      </Section>

      {/* =====================================================
          OVERVIEW
      ====================================================== */}

      {tool.description && (
        <Section title="Tool Overview">
          <p className="leading-7 text-gray-600">
            {tool.description}
          </p>
        </Section>
      )}

      {/* =====================================================
          FEATURES
      ====================================================== */}

      {features.length > 0 && (
        <Section title="Features">
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map(
              (
                feature,
                index,
              ) => (
                <div
                  key={`${feature}-${index}`}
                  className="rounded-xl bg-gray-50 p-4"
                >
                  <div className="flex gap-3">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-xs text-white">
                      ✓
                    </span>

                    <span className="text-sm leading-6 text-gray-700">
                      {feature}
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>
        </Section>
      )}

      {/* =====================================================
          USE CASES
      ====================================================== */}

      {useCases.length > 0 && (
        <Section title="Use Cases">
          <div className="flex flex-wrap gap-2">
            {useCases.map(
              (
                useCase,
                index,
              ) => (
                <Chip
                  key={`${useCase}-${index}`}
                >
                  {useCase}
                </Chip>
              ),
            )}
          </div>
        </Section>
      )}

      {/* =====================================================
          PRICING
      ====================================================== */}

      {pricing && (
        <Section title="Pricing">
          <p className="text-gray-700">
            {pricing}
          </p>

          {website && (
            <p className="mt-3 text-xs leading-5 text-gray-500">
              Check the official website
              for current pricing and
              availability.
            </p>
          )}
        </Section>
      )}

      {/* =====================================================
          PLATFORMS
      ====================================================== */}

      {platforms.length > 0 && (
        <Section title="Platforms">
          <div className="flex flex-wrap gap-2">
            {platforms.map(
              (platform) => (
                <Chip key={platform}>
                  {platform}
                </Chip>
              ),
            )}
          </div>
        </Section>
      )}

      {/* =====================================================
          INTEGRATIONS
      ====================================================== */}

      {integrations.length > 0 && (
        <Section title="Integrations">
          <div className="flex flex-wrap gap-2">
            {integrations.map(
              (integration) => (
                <Chip
                  key={integration}
                >
                  {integration}
                </Chip>
              ),
            )}
          </div>
        </Section>
      )}

      {/* =====================================================
          LIMITATIONS
      ====================================================== */}

      {limitations.length > 0 && (
        <Section title="Limitations">
          <div className="grid gap-3 sm:grid-cols-2">
            {limitations.map(
              (
                limitation,
                index,
              ) => (
                <div
                  key={`${limitation}-${index}`}
                  className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-gray-700"
                >
                  {limitation}
                </div>
              ),
            )}
          </div>
        </Section>
      )}

      {/* =====================================================
          LAYER 2 — DISCOVERY
      ====================================================== */}

      <Section title="Discover Similar Tools">
        {relatedLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-black/5 bg-gray-50 p-5"
                >
                  <div className="h-4 w-2/3 rounded bg-gray-200" />

                  <div className="mt-3 h-3 w-full rounded bg-gray-200" />

                  <div className="mt-2 h-3 w-4/5 rounded bg-gray-200" />
                </div>
              ),
            )}
          </div>
        ) : displayRelated.length >
          0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {displayRelated.map(
              (item) => (
                <RelatedCard
                  key={
                    item.slug ??
                    item.name
                  }
                  tool={item}
                />
              ),
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 p-5">
            <p className="text-sm leading-6 text-gray-500">
              No sufficiently relevant
              related tools were found
              for this tool yet.
            </p>

            {relatedError && (
              <p className="mt-2 text-xs text-gray-400">
                Recommendations will
                appear when the existing
                discovery service has
                matching catalog data.
              </p>
            )}
          </div>
        )}
      </Section>

      {/* =====================================================
          DISCOVERY ACTIONS
      ====================================================== */}

      <section className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/ai-finder"
          className="rounded-2xl border border-black/10 bg-white p-5 text-sm font-semibold text-gray-900 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
        >
          Find the right AI tool →
        </Link>

        <Link
          href="/compare"
          className="rounded-2xl border border-black/10 bg-white p-5 text-sm font-semibold text-gray-900 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
        >
          Compare tools →
        </Link>

        {tool.category ? (
          <Link
            href={`/category/${encodeURIComponent(
              String(
                tool.category,
              )
                .trim()
                .toLowerCase()
                .replace(
                  /[^a-z0-9]+/g,
                  "-",
                )
                .replace(
                  /^-+|-+$/g,
                  "",
                ),
            )}`}
            className="rounded-2xl border border-black/10 bg-white p-5 text-sm font-semibold text-gray-900 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
          >
            Explore {tool.category} →
          </Link>
        ) : (
          <Link
            href="/"
            className="rounded-2xl border border-black/10 bg-white p-5 text-sm font-semibold text-gray-900 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
          >
            Explore AI Vault →
          </Link>
        )}
      </section>

      {/* =====================================================
          OFFICIAL WEBSITE
      ====================================================== */}

      {website && (
        <Section title="Official Website">
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Visit Official Website →
          </a>
        </Section>
      )}
    </div>
  );
}
