// lib/api/catalog.ts
import { createClient } from "@/lib/supabase/server";
import { getToolScore } from "@/lib/score";
import { cleanAiContent } from "@/lib/content-quality";

export type ToolRecord = {
  id?: string | number | null;
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  short_description?: string | null;
  overview?: string | null;
  category?: string | null;
  pricing?: string | null;
  pricing_model?: string | null;
  score?: number | string | null;
  ai_vault_score?: number | string | null;
  neural_score?: number | string | null;
  rating?: number | string | null;
  logo_url?: string | null;
  logo?: string | null;
  image_url?: string | null;
  website_url?: string | null;
  website?: string | null;
  is_verified?: boolean;
  verified?: boolean;
  created_at?: string | null;
  [key: string]: unknown;
};

export async function fetchAllTools(): Promise<ToolRecord[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ai_tools")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("[FETCH_TOOLS_ERROR]", error);
      return [];
    }

    return (data ?? []) as ToolRecord[];
  } catch (err) {
    console.error("[CATALOG_FETCH_EXCEPTION]", err);
    return [];
  }
}

export function filterTools(
  tools: ToolRecord[],
  opts: {
    category?: string;
    pricing?: string;
    search?: string;
    sortBy?: "score" | "name" | "newest";
  }
): ToolRecord[] {
  let result = [...tools];

  // 1. Category Filter
  if (opts.category && opts.category.toLowerCase() !== "all") {
    result = result.filter(
      (t) => (t.category || "").toLowerCase() === opts.category?.toLowerCase()
    );
  }

  // 2. Pricing Filter
  if (opts.pricing && opts.pricing.toLowerCase() !== "all") {
    const target = opts.pricing.toLowerCase();
    result = result.filter((t) => {
      const p = (t.pricing_model || t.pricing || "").toLowerCase();
      if (target === "free") return p.includes("free") && !p.includes("freemium");
      if (target === "freemium") return p.includes("freemium");
      if (target === "paid") return p.includes("paid") || p.includes("sub");
      return true;
    });
  }

  // 3. Search Query
  if (opts.search) {
    const q = opts.search.toLowerCase().trim();
    result = result.filter((t) => {
      const name = (t.name || "").toLowerCase();
      const desc = (t.description || t.overview || "").toLowerCase();
      const cat = (t.category || "").toLowerCase();
      return name.includes(q) || desc.includes(q) || cat.includes(q);
    });
  }

  // 4. Sorting
  if (opts.sortBy === "score") {
    result.sort((a, b) => (getToolScore(b) ?? 0) - (getToolScore(a) ?? 0));
  } else if (opts.sortBy === "newest") {
    result.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  } else {
    result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }

  return result;
}

export function getFeaturedTools(tools: ToolRecord[], limit = 6): ToolRecord[] {
  return [...tools]
    .filter((t) => (getToolScore(t) ?? 0) >= 88)
    .sort((a, b) => (getToolScore(b) ?? 0) - (getToolScore(a) ?? 0))
    .slice(0, limit);
}
