"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

interface Tool {
  name?: string | null;
  slug?: string | null;
  category?: string | null;
  pricing?: string | null;
  description?: string | null;
}

interface DecisionResult {
  match_score: number;
  confidence: number;
  reasons: string[];
  matched_fields: string[];
  missing_fields: string[];
  summary: string;
}

interface Props {
  tool: Tool;

  goal?: string;
  category?: string;
  budget?: string;
  platform?: string;
  use_case?: string;
}

export default function DecisionPanel({
  tool,
  goal,
  category,
  budget,
  platform,
  use_case,
}: Props) {
  const [result, setResult] =
    useState<DecisionResult | null>(
      null,
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDecision() {
      if (!tool.slug) {
        return;
      }

      const baseUrl =
        process.env
          .NEXT_PUBLIC_API_URL;

      if (!baseUrl) {
        setError(true);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const params =
          new URLSearchParams();

        if (goal) {
          params.set(
            "goal",
            goal,
          );
        }

        if (category) {
          params.set(
            "category",
            category,
          );
        }

        if (budget) {
          params.set(
            "budget",
            budget,
          );
        }

        if (platform) {
          params.set(
            "platform",
            platform,
          );
        }

        if (use_case) {
          params.set(
            "use_case",
            use_case,
          );
        }

        const query =
          params.toString();

        const response =
          await fetch(
            `${baseUrl.replace(
              /\/$/,
              "",
            )}/api/decision/tool/${encodeURIComponent(
              tool.slug,
            )}${
              query
                ? `?${query}`
                : ""
            }`,
            {
              headers: {
                Accept:
                  "application/json",
              },
            },
          );

        if (!response.ok) {
          throw new Error(
            "Decision request failed",
          );
        }

        const data =
          (await response.json()) as DecisionResult;

        if (!cancelled) {
          setResult(data);
        }
      } catch (err) {
        console.error(
          "[DECISION_PANEL_ERROR]",
          err,
        );

        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDecision();

    return () => {
      cancelled = true;
    };
  }, [
    tool.slug,
    goal,
    category,
    budget,
    platform,
    use_case,
  ]);

  if (
    !goal &&
    !category &&
    !budget &&
    !platform &&
    !use_case
  ) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">
          Make a Better Decision
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Use AI Finder to describe what
          you need and AI Vault can compare
          available catalog data against
          your requirements.
        </p>

        <Link
          href="/ai-finder"
          className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-600"
        >
          Find My Best Tool →
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            Layer 3
          </p>

          <h2 className="mt-1 text-xl font-black text-slate-950">
            Why this tool matches
          </h2>
        </div>

        {result && (
          <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-8 border-blue-50">
            <span className="text-xl font-black text-slate-950">
              {result.match_score}
            </span>

            <span className="text-[10px] text-slate-400">
              /100
            </span>
          </div>
        )}
      </div>

      {loading && (
        <div className="mt-5 animate-pulse rounded-xl bg-slate-50 p-5">
          <div className="h-4 w-2/3 rounded bg-slate-200" />

          <div className="mt-3 h-3 w-full rounded bg-slate-200" />

          <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
        </div>
      )}

      {!loading &&
        !error &&
        result && (
          <>
            <p className="mt-5 text-sm leading-7 text-slate-600">
              {result.summary}
            </p>

            {result.reasons.length >
              0 && (
              <div className="mt-5">
                <h3 className="text-sm font-bold text-slate-900">
                  Matching signals
                </h3>

                <div className="mt-3 space-y-2">
                  {result.reasons
                    .slice(0, 5)
                    .map(
                      (reason) => (
                        <div
                          key={reason}
                          className="flex gap-3 rounded-xl bg-slate-50 p-3"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                            ✓
                          </span>

                          <span className="text-sm text-slate-700">
                            {reason}
                          </span>
                        </div>
                      ),
                    )}
                </div>
              </div>
            )}

            {result.confidence >
              0 && (
              <p className="mt-4 text-xs text-slate-400">
                Match confidence:{" "}
                {result.confidence}%
                based on available
                catalog data.
              </p>
            )}
          </>
        )}

      {!loading && error && (
        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          Decision intelligence is
          temporarily unavailable.
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/ai-finder"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
        >
          Find Better Match
        </Link>

        <Link
          href="/compare"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-600"
        >
          Compare Tools
        </Link>
      </div>
    </section>
  );
}
