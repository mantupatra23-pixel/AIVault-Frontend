// app/vault/page.tsx
"use client";

import { useEffect, useState } from "react";
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
  [key: string]: unknown;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export default function VaultPage() {
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("aivault_saved_tools");
      if (stored) {
        try {
          setSavedSlugs(JSON.parse(stored));
        } catch {
          setSavedSlugs([]);
        }
      }
    }
  }, []);

  useEffect(() => {
    async function fetchSavedTools() {
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
    fetchSavedTools();
  }, []);

  const savedTools = tools.filter((t) => {
    const slug = String(t.slug || "").toLowerCase();
    const name = String(t.name || "").toLowerCase();
    return savedSlugs.some((s) => s.toLowerCase() === slug || s.toLowerCase() === name);
  });

  const removeBookmark = (slug: string) => {
    const updated = savedSlugs.filter((s) => s.toLowerCase() !== slug.toLowerCase());
    setSavedSlugs(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("aivault_saved_tools", JSON.stringify(updated));
    }
  };

  return (
    <main className="min-h-screen bg-[#fafbfc] text-slate-900 pb-20">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
            AI Vault<span className="text-blue-600">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/compare" className="text-xs font-bold text-slate-600 hover:text-blue-600">
              ⚖️ Compare
            </Link>
            <Link href="/find" className="text-xs font-bold text-slate-600 hover:text-blue-600">
              ⚡ Matcher
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Personal Stack</span>
          <h1 className="text-3xl font-black text-slate-950 sm:text-4xl tracking-tight mt-1">
            My Saved Vault
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Tools bookmarked across sessions saved locally in your browser.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
            ))}
          </div>
        ) : savedTools.length > 0 ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedTools.map((tool) => {
                const name = String(tool.name || "AI Tool");
                const slug = String(tool.slug || "");
                const category = String(tool.category || "AI");
                const score = getToolScore(tool);
                const desc = cleanAiContent(tool.overview || tool.description) || `${name} provides software capabilities for ${category.toLowerCase()}.`;

                return (
                  <div
                    key={String(tool.id || slug)}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <ToolLogo name={name} src={(tool.logo_url || tool.logo) as string} size="sm" />
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-black text-slate-950">{name}</h3>
                            <p className="text-[10px] text-slate-400 capitalize">{category}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeBookmark(slug)}
                          className="text-slate-400 hover:text-rose-600 text-xs font-bold"
                          title="Remove bookmark"
                        >
                          ✕
                        </button>
                      </div>

                      <p className="mt-3 line-clamp-2 text-xs text-slate-600 leading-relaxed">
                        {desc}
                      </p>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-600">
                        {formatAIScore(score)}
                      </span>
                      <Link
                        href={`/tool/${encodeURIComponent(slug)}`}
                        className="text-xs font-black text-blue-600 hover:underline"
                      >
                        Open Dossier →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {savedTools.length >= 2 && (
              <div className="text-center pt-4">
                <Link
                  href={`/compare?tools=${savedTools.map((t) => t.slug || t.name).join(",")}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-xs font-black text-white shadow-md hover:bg-blue-700 transition"
                >
                  <span>⚖️ Compare All {savedTools.length} Saved Tools →</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-800">No saved tools in your vault yet.</p>
            <p className="mt-1 text-xs text-slate-400">Click the star (★) button on any tool card to bookmark it here.</p>
            <Link
              href="/"
              className="mt-5 inline-block rounded-xl bg-blue-600 px-6 py-3 text-xs font-black text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
            >
              Browse 745+ AI Directory
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
