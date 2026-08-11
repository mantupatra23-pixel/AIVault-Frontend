import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ToolRecord {
  slug: string;
  updated_at?: string;
  created_at?: string;
}

async function fetchAllToolsFromDatabase(): Promise<ToolRecord[]> {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "[SITEMAP_CRITICAL_ERROR] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
    );
    return [];
  }

  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/ai_tools?select=slug,updated_at,created_at&slug=not.is.null`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        // Force Supabase to return up to 2000 rows without hitting default 1000 limit caps
        Range: "0-1999",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[SITEMAP_FETCH_FAILED] Status: ${response.status} ${response.statusText} - Body: ${errorBody}`
      );
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error("[SITEMAP_INVALID_DATA_TYPE] Returned payload is not an array:", data);
      return [];
    }

    console.log(`[SITEMAP_SUCCESS] Successfully fetched ${data.length} tool records from Supabase.`);
    return data;
  } catch (error) {
    console.error("[SITEMAP_FETCH_EXCEPTION] Unhandled network or execution error:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const tools = await fetchAllToolsFromDatabase();

  if (tools.length === 0) {
    console.warn("[SITEMAP_WARNING] No tool records loaded. Returning static routes only.");
    return staticRoutes;
  }

  const seenSlugs = new Set<string>();
  const toolRoutes: MetadataRoute.Sitemap = [];

  for (const tool of tools) {
    if (!tool.slug || typeof tool.slug !== "string") continue;

    const cleanSlug = tool.slug.trim().toLowerCase();
    if (!cleanSlug || seenSlugs.has(cleanSlug)) continue;

    seenSlugs.add(cleanSlug);

    toolRoutes.push({
      url: `${SITE_URL}/tool/${cleanSlug}`,
      lastModified: tool.updated_at
        ? new Date(tool.updated_at)
        : tool.created_at
        ? new Date(tool.created_at)
        : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return [...staticRoutes, ...toolRoutes];
}
