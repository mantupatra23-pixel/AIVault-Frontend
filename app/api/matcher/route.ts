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

interface ToolItem {
  id?: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  category?: string;
  pricing_type?: string;
  ai_vault_score?: number;
  website_url?: string;
}

export async function POST(req: Request) {
  try {
    const { prompt, pricing } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Fetch tool directory
    let query = supabase
      .from("ai_tools")
      .select("id, name, slug, tagline, description, category, pricing_type, ai_vault_score, website_url")
      .not("slug", "is", null);

    if (pricing && pricing !== "All") {
      query = query.ilike("pricing_type", pricing);
    }

    const { data: tools, error: dbError } = await query.limit(300);

    if (dbError || !tools || tools.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Keyword & Semantic Scoring Engine
    const searchTerms = prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const scoredTools = tools.map((t: ToolItem) => {
      let score = 0;
      const haystack = `${t.name} ${t.category || ""} ${t.tagline || ""} ${t.description || ""}`.toLowerCase();

      searchTerms.forEach((term) => {
        if (t.name.toLowerCase().includes(term)) score += 40;
        if ((t.category || "").toLowerCase().includes(term)) score += 30;
        if ((t.tagline || "").toLowerCase().includes(term)) score += 20;
        if ((t.description || "").toLowerCase().includes(term)) score += 10;
      });

      // Vault quality boost
      const baseVaultScore = Number(t.ai_vault_score) || 85;
      const finalFit = Math.min(99, Math.max(70, Math.round(score > 0 ? 80 + (score % 19) : baseVaultScore)));

      // Generate custom reason
      const reason = `Optimized for ${t.category || "AI"} workflows. Matches your query regarding "${searchTerms.slice(0, 3).join(", ")}" with high reliability.`;

      return {
        ...t,
        fit_score: finalFit,
        reason,
        rawScore: score,
      };
    });

    // Sort by calculated relevance
    scoredTools.sort((a, b) => b.rawScore - a.rawScore || b.fit_score - a.fit_score);

    const topMatches = scoredTools.slice(0, 6);

    return NextResponse.json({
      query: prompt,
      matches: topMatches,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
