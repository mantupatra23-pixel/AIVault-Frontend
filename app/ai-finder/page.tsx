"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type Recommendation = {
  tool?: {
    name?: string;
    slug?: string;
  };
  match_score?: number;
  confidence?: number;
  reasons?: string[];
};

type DecisionResponse = {
  requirements?: {
    goal?: string;
    category?: string;
    budget?: string;
    platform?: string;
    use_case?: string;
  };
  results?: Recommendation[];
  count?: number;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

export default function AIFinderPage() {
  const [goal, setGoal] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("free/freemium");
  const [platform, setPlatform] = useState("web");
  const [useCase, setUseCase] = useState("");

  const [results, setResults] = useState<Recommendation[]>([]);
  const [requirements, setRequirements] =
    useState<DecisionResponse["requirements"]>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function findBestTools(event?: FormEvent) {
    event?.preventDefault();

    setError("");
    setResults([]);

    if (!API_URL) {
      setError(
        "NEXT_PUBLIC_API_URL is not configured."
      );
      return;
    }

    if (!goal.trim()) {
      setError("Please enter what you want to accomplish.");
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams();

      params.set("goal", goal.trim());

      if (category.trim()) {
        params.set("category", category.trim());
      }

      if (budget.trim()) {
        params.set("budget", budget.trim());
      }

      if (platform.trim()) {
        params.set("platform", platform.trim());
      }

      if (useCase.trim()) {
        params.set("use_case", useCase.trim());
      }

      const response = await fetch(
        `${API_URL}/api/decision/recommend?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        let message =
          "Recommendation request failed.";

        try {
          const body = await response.json();

          if (body?.detail) {
            message = String(body.detail);
          }
        } catch {
          // Ignore invalid error JSON.
        }

        throw new Error(message);
      }

      const data: DecisionResponse =
        await response.json();

      setRequirements(
        data.requirements ?? {
          goal,
          category,
          budget,
          platform,
          use_case: useCase,
        }
      );

      setResults(
        Array.isArray(data.results)
          ? data.results
          : []
      );
    } catch (err) {
      console.error(
        "AI Finder error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to get recommendations."
      );
    } finally {
      setLoading(false);
    }
  }

  function clearFinder() {
    setGoal("");
    setCategory("");
    setBudget("free/freemium");
    setPlatform("web");
    setUseCase("");
    setResults([]);
    setRequirements(null);
    setError("");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          <Link
            href="/"
            className="text-xl font-black tracking-tight"
          >
            AI Vault
            <span className="text-blue-600">
              .
            </span>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
          >
            ← Directory
          </Link>

        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6 sm:py-16">

          <div className="mx-auto mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-600">
            AI Tool Finder
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
            Find the right AI tool
            <br />
            <span className="text-blue-600">
              for your exact needs.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            Tell AI Vault what you want to accomplish.
            Our decision engine compares the available
            AI tools and ranks the best matches.
          </p>

        </div>
      </section>

      {/* FINDER */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        <form
          onSubmit={findBestTools}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >

          <div className="grid gap-6">

            {/* GOAL */}
            <div>
              <label
                htmlFor="goal"
                className="mb-2 block text-sm font-bold text-slate-900"
              >
                What do you want to accomplish?
              </label>

              <textarea
                id="goal"
                value={goal}
                onChange={(e) =>
                  setGoal(e.target.value)
                }
                placeholder="Example: I want to build landing pages without coding."
                rows={4}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-bold text-slate-900"
              >
                Category
              </label>

              <input
                id="category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                placeholder="Example: website builder"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            {/* GRID */}
            <div className="grid gap-5 sm:grid-cols-2">

              {/* BUDGET */}
              <div>
                <label
                  htmlFor="budget"
                  className="mb-2 block text-sm font-bold text-slate-900"
                >
                  Budget
                </label>

                <select
                  id="budget"
                  value={budget}
                  onChange={(e) =>
                    setBudget(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="free">
                    Free only
                  </option>

                  <option value="free/freemium">
                    Free / Freemium
                  </option>

                  <option value="freemium">
                    Freemium
                  </option>

                  <option value="paid">
                    Paid
                  </option>

                  <option value="enterprise">
                    Enterprise
                  </option>
                </select>
              </div>

              {/* PLATFORM */}
              <div>
                <label
                  htmlFor="platform"
                  className="mb-2 block text-sm font-bold text-slate-900"
                >
                  Platform
                </label>

                <select
                  id="platform"
                  value={platform}
                  onChange={(e) =>
                    setPlatform(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="web">
                    Web
                  </option>

                  <option value="windows">
                    Windows
                  </option>

                  <option value="macos">
                    macOS
                  </option>

                  <option value="linux">
                    Linux
                  </option>

                  <option value="android">
                    Android
                  </option>

                  <option value="ios">
                    iOS
                  </option>

                  <option value="api">
                    API
                  </option>

                  <option value="browser">
                    Browser
                  </option>

                  <option value="extension">
                    Browser Extension
                  </option>
                </select>
              </div>

            </div>

            {/* USE CASE */}
            <div>
              <label
                htmlFor="useCase"
                className="mb-2 block text-sm font-bold text-slate-900"
              >
                Specific use case
              </label>

              <input
                id="useCase"
                value={useCase}
                onChange={(e) =>
                  setUseCase(e.target.value)
                }
                placeholder="Example: landing page creation"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            {/* ERROR */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <strong className="font-bold">
                  Error:
                </strong>{" "}
                {error}
              </div>
            )}

            {/* BUTTONS */}
            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-slate-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Finding best tools..."
                  : "Find Best AI Tools →"}
              </button>

              <button
                type="button"
                onClick={clearFinder}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 transition hover:border-slate-300 disabled:opacity-50"
              >
                Clear
              </button>

            </div>

          </div>
        </form>

        {/* REQUIREMENTS SUMMARY */}
        {requirements && (
          <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">

            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                  Decision Engine
                </p>

                <h2 className="mt-1 text-lg font-black text-slate-900">
                  Your requirements
                </h2>
              </div>

              {results.length > 0 && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-600">
                  {results.length} match
                  {results.length === 1
                    ? ""
                    : "es"}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">

              {requirements.goal && (
                <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-700">
                  Goal: {requirements.goal}
                </span>
              )}

              {requirements.category && (
                <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-700">
                  Category:{" "}
                  {requirements.category}
                </span>
              )}

              {requirements.budget && (
                <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-700">
                  Budget:{" "}
                  {requirements.budget}
                </span>
              )}

              {requirements.platform && (
                <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-700">
                  Platform:{" "}
                  {requirements.platform}
                </span>
              )}

              {requirements.use_case && (
                <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-700">
                  Use case:{" "}
                  {requirements.use_case}
                </span>
              )}

            </div>
          </section>
        )}

        {/* RESULTS */}
        {results.length > 0 && (
          <section className="mt-8">

            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                AI Vault Recommendations
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Best matching tools
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Ranked using your requirements,
                available tool data, and deterministic
                matching rules.
              </p>
            </div>

            <div className="space-y-4">

              {results.map(
                (item, index) => {
                  const name =
                    item.tool?.name ||
                    "Unnamed tool";

                  const slug =
                    item.tool?.slug;

                  const score =
                    typeof item.match_score ===
                    "number"
                      ? item.match_score
                      : 0;

                  const confidence =
                    typeof item.confidence ===
                    "number"
                      ? item.confidence
                      : 0;

                  return (
                    <article
                      key={
                        slug ||
                        `${name}-${index}`
                      }
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6"
                    >

                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                        {/* TOOL */}
                        <div className="min-w-0 flex-1">

                          <div className="flex items-start gap-4">

                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
                              {name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                                  #{index + 1} Match
                                </span>

                                {confidence >=
                                  80 && (
                                  <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-green-600">
                                    High confidence
                                  </span>
                                )}

                              </div>

                              <h3 className="mt-2 break-words text-xl font-black text-slate-950">
                                {name}
                              </h3>

                              {slug && (
                                <p className="mt-1 text-xs text-slate-400">
                                  /tool/{slug}
                                </p>
                              )}

                            </div>

                          </div>

                          {/* REASONS */}
                          {Array.isArray(
                            item.reasons
                          ) &&
                            item.reasons.length >
                              0 && (
                              <div className="mt-5">

                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                                  Why it matches
                                </p>

                                <div className="space-y-2">

                                  {item.reasons.map(
                                    (
                                      reason,
                                      reasonIndex
                                    ) => (
                                      <div
                                        key={`${reason}-${reasonIndex}`}
                                        className="flex gap-3 rounded-xl bg-slate-50 p-3"
                                      >
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                                          ✓
                                        </span>

                                        <span className="text-sm leading-6 text-slate-600">
                                          {reason}
                                        </span>
                                      </div>
                                    )
                                  )}

                                </div>
                              </div>
                            )}

                        </div>

                        {/* SCORE */}
                        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">

                          <div className="rounded-2xl bg-slate-950 px-5 py-4 text-center text-white">

                            <div className="text-3xl font-black">
                              {score}
                            </div>

                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              Match Score
                            </div>

                          </div>

                          <div className="rounded-xl bg-slate-100 px-3 py-2 text-center">

                            <div className="text-sm font-black text-slate-800">
                              {confidence}%
                            </div>

                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              Confidence
                            </div>

                          </div>

                        </div>

                      </div>

                      {/* ACTION */}
                      {slug && (
                        <div className="mt-5 border-t border-slate-100 pt-5">

                          <Link
                            href={`/tool/${encodeURIComponent(
                              slug
                            )}`}
                            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-blue-700 sm:w-auto"
                          >
                            View {name} →
                          </Link>

                        </div>
                      )}

                    </article>
                  );
                }
              )}

            </div>
          </section>
        )}

        {/* NO RESULTS */}
        {!loading &&
          requirements &&
          results.length === 0 &&
          !error && (
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                🔎
              </div>

              <h2 className="mt-4 text-xl font-black">
                No strong matches found
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Try a broader category, different
                platform, or a less restrictive budget.
              </p>

            </section>
          )}

        {/* EMPTY STATE */}
        {!requirements &&
          !loading && (
            <section className="mt-8 grid gap-4 sm:grid-cols-3">

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-2xl">
                  🎯
                </div>

                <h3 className="mt-3 font-bold">
                  Goal Matching
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Match tools against what you
                  actually want to accomplish.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-2xl">
                  ⚡
                </div>

                <h3 className="mt-3 font-bold">
                  Smart Ranking
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  See match scores and confidence
                  instead of a generic tool list.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-2xl">
                  🧠
                </div>

                <h3 className="mt-3 font-bold">
                  Explainable Results
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Every recommendation explains why
                  the tool matched your requirements.
                </p>
              </div>

            </section>
          )}

      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} AI Vault. AI Tool Finder.
        </div>
      </footer>

    </main>
  );
}
