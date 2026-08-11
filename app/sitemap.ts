import { MetadataRoute } from "next";
import { FALLBACK_TOOL_SLUGS } from "@/lib/sitemap-fallback";

// Force static prerendering with 24-hour background revalidation
export const revalidate = 86400;

const CANONICAL_SITE_URL = "https://aivault.pp.ua";

interface ToolRecord {
  slug: string;
  created_at?: string;
}

function normalizeSlug(rawSlug: any): string {
  if (!rawSlug || typeof rawSlug !== "string") return "";
  let clean = rawSlug.trim();
  clean = clean.replace(/^\/+|\/+$/g, "");
  return clean.toLowerCase().trim();
}

async function fetchAllToolSlugs(): Promise<ToolRecord[]> {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  const keyToUse = serviceRoleKey || anonKey;

  if (!supabaseUrl || !keyToUse) {
    console.warn("[SITEMAP_WARN] Missing Supabase credentials. Utilizing static fallback list.");
    return FALLBACK_TOOL_SLUGS.map((slug) => ({ slug }));
  }

  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/ai_tools?select=slug,created_at&slug=not.is.null`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: keyToUse,
        Authorization: `Bearer ${keyToUse}`,
        "Content-Type": "application/json",
        Range: "0-1999",
      },
      signal: controller.signal,
      next: { revalidate: 86400 },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[SITEMAP_WARN] Supabase REST status ${response.status}. Using fallback slugs.`);
      return FALLBACK_TOOL_SLUGS.map((slug) => ({ slug }));
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.warn("[SITEMAP_WARN] Database query returned empty. Utilizing fallback list.");
      return FALLBACK_TOOL_SLUGS.map((slug) => ({ slug }));
    }

    return data;
  } catch (err) {
    console.warn("[SITEMAP_WARN] Error fetching tools. Utilizing fallback list.", err);
    return FALLBACK_TOOL_SLUGS.map((slug) => ({ slug }));
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${CANONICAL_SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${CANONICAL_SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${CANONICAL_SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${CANONICAL_SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${CANONICAL_SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const tools = await fetchAllToolSlugs();

  const seenSlugs = new Set<string>();
  const toolRoutes: MetadataRoute.Sitemap = [];

  for (const tool of tools) {
    const cleanSlug = normalizeSlug(tool.slug);

    if (!cleanSlug || seenSlugs.has(cleanSlug)) {
      continue;
    }

    seenSlugs.add(cleanSlug);

    const createdDate = tool.created_at ? new Date(tool.created_at) : null;
    const isValidDate = createdDate && !isNaN(createdDate.getTime());

    toolRoutes.push({
      url: `${CANONICAL_SITE_URL}/tool/${cleanSlug}`,
      ...(isValidDate ? { lastModified: createdDate } : {}),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  const combined = [...staticRoutes, ...toolRoutes];
  const seenUrls = new Set<string>();
  const uniqueSitemap: MetadataRoute.Sitemap = [];

  for (const route of combined) {
    if (seenUrls.has(route.url)) continue;
    seenUrls.add(route.url);
    uniqueSitemap.push(route);
  }

  return uniqueSitemap;
}
