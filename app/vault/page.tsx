// app/vault/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ToolLogo from "@/components/ToolLogo";
import { formatAIScore } from "@/lib/score";

type ToolRecord = {
  id: string | number;
  slug?: string | null;
  name?: string | null;
  category?: string | null;
  pricing?: string | null;
  pricing_model?: string | null;
  score?: number | string | null;
  neural_score?: number | string | null;
  logo_url?: string | null;
  logo?: string | null;
  overview?: string | null;
  description?: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function VaultPage() {
  const [savedTools, setSavedTools] = useState<ToolRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSavedVault = async () => {
    try {
      setLoading(true);
      if (typeof window === "undefined") return;

      const stored = localStorage.getItem("aivault_saved_tools");
      const slugs: string[] = stored ? JSON.parse(stored) : [];

      if (slugs.length === 0) {
        setSavedTools([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("ai_tools")
        .select("*")
        .in("slug", slugs);

      if (error) throw error;
      setSavedTools(data || []);
    } catch (err) {
      console.error("Vault load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedVault();
  }, []);

  const handleRemove = (slug: string) => {
    try {
      const stored = localStorage.getItem("aivault_saved_tools");
      let list: string[] = stored ? JSON.parse(stored) : [];
      list = list.filter((s) => s.toLowerCase() !== slug.toLowerCase());
      localStorage.setItem("aivault_saved_tools", JSON.stringify(list));
      setSavedTools((prev) => prev.filter((t) => (t.slug || "").toLowerCase() !== slug.toLowerCase()));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="min-h-screen bg-[#050714] text-slate-100 pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#070a1e]/90 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-lg font-black tracking-tight text-white">
            AI Vault<span className="text-blue-500">.</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/compare"
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white"
            >
              ⚖️ Compare Matrix
            </Link>
            <Link
              href="/"
              className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-blue-700 transition"
            >
              ← Explore Directory
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        {/* Title */}
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              Personal Workbench
            </span>
            <h1 className="text-2xl font-black text-white sm:text-3xl mt-1">
              ★ My Saved AI Stack ({savedTools.length})
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Bookmarks and shortlists saved locally for easy benchmarking and access.
            </p>
          </div>

          {savedTools.length > 1 && (
            <Link
              href={`/compare?tools=${savedTools.map((t) => t.slug).join(",")}`}
              className="self-start sm:self-auto rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700 shadow-md transition"
            >
              Compare All in Matrix →
            </Link>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500 animate-pulse">
            Loading your saved vault collection...
          </div>
        ) : savedTools.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedTools.map((t) => {
              const slug = String(t.slug || "");
              const name = String(t.name || "AI Tool");
              const category = String(t.category || "Productivity");
              const pricing = String(t.pricing || t.pricing_model || "Freemium");
              const score = formatAIScore(t.score || t.neural_score || 90);
              const logo = (t.logo_url || t.logo) as string | undefined;

              return (
                <div
                  key={t.id || slug}
                  className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-[#0c102b] p-5 shadow-lg transition hover:border-slate-700"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/tool/${encodeURIComponent(slug)}`} className="flex items-center gap-3 min-w-0">
                        <ToolLogo name={name} src={logo} size="sm" />
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-black text-white hover:text-blue-400 transition">
                            {name}
                          </h3>
                          <p className="text-[10px] capitalize text-slate-400">{category}</p>
                        </div>
                      </Link>

                      <button
                        onClick={() => handleRemove(slug)}
                        className="rounded-lg p-1 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 text-xs font-bold"
                        title="Remove from Saved Vault"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-400">
                      {t.overview || t.description || `${name} helps optimize ${category.toLowerCase()} pipelines.`}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                        {pricing}
                      </span>
                      <span className="text-[11px] font-black text-blue-400">{score}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/tool/${encodeURIComponent(slug)}`}
                        className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-black text-white hover:bg-blue-700 transition"
                      >
                        Dossier ↗
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-[#070a1e] p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-2xl text-amber-400 mb-4">
              ★
            </div>
            <h2 className="text-lg font-black text-white">Your Saved Vault is Empty</h2>
            <p className="mx-auto mt-2 max-w-sm text-xs text-slate-400 leading-relaxed">
              You haven't bookmarked any AI tools yet. Browse the catalog and tap <strong>★ Save</strong> on any tool to build your custom stack.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-700 transition shadow-md shadow-blue-600/20"
            >
              Browse 750+ Verified Tools →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
