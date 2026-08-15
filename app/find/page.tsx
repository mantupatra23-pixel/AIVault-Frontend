// app/find/page.tsx
"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

import ToolLogo from "@/components/ToolLogo";
import { getToolScore, formatAIScore } from "@/lib/score";
import { cleanAiContent } from "@/lib/content-quality";

type ToolRecord = {
  id?: string | number | null;
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  overview?: string | null;
  category?: string | null;
  pricing?: string | null;
  pricing_model?: string | null;
  score?: number | string | null;
  logo_url?: string | null;
  logo?: string | null;
  website_url?: string | null;
  website?: string | null;
  [key: string]: unknown;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const CATEGORIES = [
  { id: "Marketing", label: "Marketing & Growth", icon: "📈" },
  { id: "Productivity", label: "Productivity & Ops", icon: "🚀" },
  { id: "Coding", label: "Coding & Development", icon: "💻" },
  { id: "Chatbot", label: "Chatbots & Assistants", icon: "🤖" },
  { id: "Writing", label: "Content & Copywriting", icon: "✍️" },
  { id: "Image", label: "Design & Image Gen", icon: "🎨" },
];

const BUDGET_OPTIONS = [
  { id: "free", label: "100% Free / Open Source", desc: "No subscriptions required" },
  { id: "freemium", label: "Freemium / Free Trial", desc: "Free tier with optional upgrades" },
  { id: "paid", label: "Commercial / Paid SaaS", desc: "Dedicated pro-tier features" },
];

const PRIORITIES = [
  { id: "score", label: "Highest Vault Score", desc: "Proven catalog quality & uptime" },
  { id: "ease", label: "Fastest Setup", desc: "Minimal onboarding friction" },
  { id: "scale", label: "Team Scalability", desc: "High batch volume & collaboration" },
];

function MatcherContent() {
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Wizard Steps
  const [step, setStep] = useState(1);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const supabase = getSupabase();
        const { data, error } = await supabase.from("ai_tools").select("*");
        if (error) throw error;
        setTools((data as ToolRecord[]) || []);
      } catch (err) {
        console.error("Error loading tools:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Recommendation Matches
  const matchedResults = useMemo(() => {
    if (!selectedCat || !selectedBudget) return [];

    let filtered = tools.filter((t) => {
      const c = (t.category || "").toLowerCase();
      const p = (t.pricing_model || t.pricing || "").toLowerCase();

      const catMatch = c.includes(selectedCat.toLowerCase());
      let budgetMatch = true;

      if (selectedBudget === "free") {
        budgetMatch = p.includes("free") && !p.includes("freemium");
      } else if (selectedBudget === "freemium") {
        budgetMatch = p.includes("freemium") || p.includes("trial");
      } else if (selectedBudget === "paid") {
        budgetMatch = p.includes("paid") || p.includes("sub");
      }

      return catMatch && budgetMatch;
    });

    if (filtered.length === 0) {
      filtered = tools.filter((t) => (t.category || "").toLowerCase().includes((selectedCat || "").toLowerCase()));
    }

    return filtered
      .sort((a, b) => (getToolScore(b) ?? 0) - (getToolScore(a) ?? 0))
      .slice(0, 3);
  }, [tools, selectedCat, selectedBudget]);

  const handleReset = () => {
    setSelectedCat(null);
    setSelectedBudget(null);
    setSelectedPriority(null);
    setStep(1);
  };

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-20">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/compare" className="text-xs font-bold text-slate-600 hover:text-blue-600">
              ⚖️ Compare
            </Link>
            <Link href="/vault" className="text-xs font-bold text-slate-600 hover:text-blue-600">
              ★ My Vault
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="text-center mb-8">
          <span className="inline-block rounded-full bg-blue-600/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">
            Interactive Matcher
          </span>
          <h1 className="text-3xl font-black text-slate-950 sm:text-4xl tracking-tight">
            Find Your Ideal AI Tool
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Answer 3 quick questions to receive verified, high-match software recommendations.
          </p>
        </div>

        {/* PROGRESS STEP BAR */}
        <div className="mb-8 flex items-center justify-between relative max-w-xs mx-auto">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all ${
                step >= num
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white border border-slate-300 text-slate-400"
              }`}
            >
              {num}
            </div>
          ))}
        </div>

        {/* STEP 1: CATEGORY SELECTION */}
        {step === 1 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-base font-black text-slate-950 mb-1">
              Step 1: What is your primary objective?
            </h2>
            <p className="text-xs text-slate-400 mb-6">Select the primary domain you need to automate:</p>

            <div className="grid gap-3 sm:grid-cols-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCat(cat.id);
                    setStep(2);
                  }}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                    selectedCat === cat.id
                      ? "border-blue-600 bg-blue-50/50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{cat.label}</h3>
                    <p className="text-[10px] text-slate-400">Verified tools in {cat.id}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* STEP 2: BUDGET SELECTION */}
        {step === 2 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-base font-black text-slate-950 mb-1">
              Step 2: What is your preferred pricing tier?
            </h2>
            <p className="text-xs text-slate-400 mb-6">Choose how you plan to budget for this software:</p>

            <div className="space-y-3">
              {BUDGET_OPTIONS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedBudget(b.id);
                    setStep(3);
                  }}
                  className="w-full flex items-center justify-between rounded-2xl border border-slate-200 p-4 text-left hover:border-blue-500 hover:bg-blue-50/30 transition"
                >
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{b.label}</h3>
                    <p className="text-[11px] text-slate-400">{b.desc}</p>
                  </div>
                  <span className="text-blue-600 font-black text-xs">Select →</span>
                </button>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <button
                onClick={() => setStep(1)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                ← Back to Step 1
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: PRIORITY SELECTION */}
        {step === 3 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-base font-black text-slate-950 mb-1">
              Step 3: What is your primary priority?
            </h2>
            <p className="text-xs text-slate-400 mb-6">Help us calibrate the exact algorithm weighting:</p>

            <div className="space-y-3">
              {PRIORITIES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPriority(p.id);
                    setStep(4);
                  }}
                  className="w-full flex items-center justify-between rounded-2xl border border-slate-200 p-4 text-left hover:border-blue-500 hover:bg-blue-50/30 transition"
                >
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{p.label}</h3>
                    <p className="text-[11px] text-slate-400">{p.desc}</p>
                  </div>
                  <span className="text-blue-600 font-black text-xs">Complete →</span>
                </button>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <button
                onClick={() => setStep(2)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                ← Back to Step 2
              </button>
            </div>
          </section>
        )}

        {/* RESULTS SCREEN */}
        {step === 4 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
                  ✓ Matching Complete
                </span>
                <h2 className="text-xl font-black text-slate-950 mt-0.5">
                  Top Matches for Your Stack
                </h2>
              </div>
              <button
                onClick={handleReset}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Restart Wizard
              </button>
            </div>

            {matchedResults.length > 0 ? (
              <div className="space-y-4">
                {matchedResults.map((t, idx) => {
                  const name = String(t.name || "AI Tool");
                  const slug = String(t.slug || "");
                  const pricing = String(t.pricing_model || t.pricing || "Freemium");
                  const score = getToolScore(t);
                  const formatted = formatAIScore(score);
                  const desc = cleanAiContent(t.overview || t.description) || `${name} matches your selected requirements.`;

                  return (
                    <div
                      key={String(t.id || slug)}
                      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:border-blue-300"
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-950">{name}</h3>
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                              {pricing}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500 leading-relaxed">
                            {desc}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                        <span className="text-sm font-black text-blue-600">
                          Score: {formatted}
                        </span>
                        <Link
                          href={`/tool/${encodeURIComponent(slug)}`}
                          className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 transition"
                        >
                          View Tool →
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {matchedResults.length >= 2 && (
                  <div className="text-center pt-2">
                    <Link
                      href={`/compare?tools=${matchedResults.map((t) => t.slug || t.name).join(",")}`}
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 border border-blue-200 px-5 py-3 text-xs font-black text-blue-700 hover:bg-blue-100 transition"
                    >
                      <span>⚖️ Compare All {matchedResults.length} Matches Side-by-Side →</span>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
                <p className="text-xs font-bold text-slate-500">No exact tool matches found for this filter combination.</p>
                <button
                  onClick={handleReset}
                  className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white"
                >
                  Reset Questions
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default function MatcherPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#fafbfc]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        </div>
      }
    >
      <MatcherContent />
    </Suspense>
  );
}
