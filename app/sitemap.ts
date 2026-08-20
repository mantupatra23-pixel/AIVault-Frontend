// app/sitemap.ts
import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Har 1 ghante me auto-refresh hoga taaki daily 10 naye tools auto-index ho sakein

const BASE_URL = "https://www.aivault.pp.ua";

interface ToolRecord {
  slug: string;
  category?: string | null;
  score?: number | string | null;
  updated_at?: string;
  created_at?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static Core Application Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return staticRoutes;
  }

  try {
    // 5000 tools tak direct serverless REST fetch (bina SDK mismatch ke)
    const fetchUrl = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/ai_tools?select=slug,category,score,updated_at,created_at&slug=not.is.null&order=score.desc.nullslast&limit=5000`;

    const res = await fetch(fetchUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return staticRoutes;
    }

    const tools: ToolRecord[] = await res.json();

    if (!Array.isArray(tools) || tools.length === 0) {
      return staticRoutes;
    }

    const seenSlugs = new Set<string>();
    const validTools: ToolRecord[] = [];
    const toolRoutes: MetadataRoute.Sitemap = [];

    // 2. Individual Tool Dossier Routes (/tool/[slug])
    for (const t of tools) {
      if (!t.slug || typeof t.slug !== "string") continue;
      const cleanSlug = t.slug.trim().toLowerCase();

      if (!cleanSlug || seenSlugs.has(cleanSlug)) continue;
      seenSlugs.add(cleanSlug);

      validTools.push({ ...t, slug: cleanSlug });

      toolRoutes.push({
        url: `${BASE_URL}/tool/${cleanSlug}`,
        lastModified: t.updated_at
          ? new Date(t.updated_at)
          : t.created_at
          ? new Date(t.created_at)
          : new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    // 3. Dynamic Programmatic Comparison Pairs (/compare/[toolA]-vs-[toolB])
    // Top 40 highest score tools ke 780+ high-traffic keyword pairs create karta hai
    const comparisonRoutes: MetadataRoute.Sitemap = [];
    const topPairTools = validTools.slice(0, 40);

    for (let i = 0; i < topPairTools.length; i++) {
      for (let j = i + 1; j < topPairTools.length; j++) {
        const slugA = topPairTools[i].slug;
        const slugB = topPairTools[j].slug;

        if (slugA && slugB) {
          comparisonRoutes.push({
            url: `${BASE_URL}/compare/${slugA}-vs-${slugB}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.75,
          });
        }
      }
    }

    return [...staticRoutes, ...toolRoutes, ...comparisonRoutes];
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return staticRoutes;
  }
}
