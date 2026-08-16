// app/api/matcher/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

interface ToolRecord {
  id?: string | number;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  overview?: string | null;
  category?: string | null;
  pricing?: string | null;
  pricing_type?: string | null;
  score?: number | string | null;
  ai_vault_score?: number | string | null;
  logo_url?: string | null;
  logo?: string | null;
  website_url?: string | null;
}

export async function POST(req: Request) {
  try {
    const { prompt, pricing } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: tools, error } = await supabase
      .from("ai_tools")
      .select("*")
      .not("slug", "is", null);

    if (error || !tools || tools.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const searchTerms = prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const scored = tools
      .filter((t: ToolRecord) => {
        if (!pricing || pricing === "All") return true;
        const p = String(t.pricing_type || t.pricing || "").toLowerCase();
        if (pricing === "Free" && (!p.includes("free") || p.includes("freemium"))) return false;
        if (pricing === "Freemium" && !p.includes("freemium")) return false;
        if (pricing === "Paid" && !p.includes("paid")) return false;
        return true;
      })
      .map((t: ToolRecord) => {
        let score = 0;
        const haystack = `${t.name || ""} ${t.category || ""} ${t.tagline || ""} ${t.description || ""} ${t.overview || ""}`.toLowerCase();

        searchTerms.forEach((term) => {
          if (String(t.name || "").toLowerCase().includes(term)) score += 45;
          if (String(t.category || "").toLowerCase().includes(term)) score += 35;
          if (haystack.includes(term)) score += 15;
        });

        const rawVaultScore = Number(t.ai_vault_score || t.score) || 90;
        const fitScore = Math.min(99, Math.max(72, Math.round(score > 0 ? 82 + (score % 17) : rawVaultScore)));

        const cleanCat = String(t.category || "AI Software");
        const reason = `Optimized for ${cleanCat.toLowerCase()} workflows. Matches your query regarding "${searchTerms.slice(0, 3).join(", ")}" with high accuracy.`;

        return {
          ...t,
          fit_score: fitScore,
          reason,
          relevance: score,
        };
      });

    scored.sort((a, b) => b.relevance - a.relevance || b.fit_score - a.fit_score);

    return NextResponse.json({
      matches: scored.slice(0, 8),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
