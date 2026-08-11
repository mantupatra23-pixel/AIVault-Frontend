import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ToolRecord {
  slug: string;
  created_at?: string;
}

/**
 * Clean and normalize database slugs.
 * Example: " /ChatGPT/ " => "chatgpt"
 */
function normalizeSlug(rawSlug: any): string {
  if (!rawSlug || typeof rawSlug !== "string") return "";

  let clean = rawSlug.trim();

  // Remove leading and trailing slashes
  clean = clean.replace(/^\/+|\/+$/g, "");

  // Convert to lowercase and trim remaining whitespace
  clean = clean.toLowerCase().trim();

  return clean;
}

async function fetchToolsFromSupabase(): Promise<ToolRecord[]> {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  // SERVER-ONLY: Strictly require SUPABASE_SERVICE_ROLE_KEY. No fallback to anon key.
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "[SITEMAP_ERROR] Missing required server environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)."
    );
    return [];
  }

  // Request ONLY slug and created_at to avoid invalid column (updated_at) errors
  const endpoint = `${supabaseUrl.replace(
    /\/$/,
    ""
  )}/rest/v1/ai_tools?select=slug,created_at&slug=not.is.null`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        // Request up to 2000 rows without hitting default REST limit caps
        Range: "0-1999",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[SITEMAP_FETCH_FAILED] Status: ${response.status} ${response.statusText} Body: ${errorBody}`
      );
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error("[SITEMAP_ERROR] Supabase response is not an array.");
      return [];
    }

    if (data.length === 0) {
      console.error(
        "[SITEMAP_ERROR] 0 AI tools returned. Check SUPABASE_SERVICE_ROLE_KEY and RLS/database permissions."
      );
      return [];
    }

    console.log(
      `[SITEMAP_SUCCESS] Successfully fetched ${data.length} tool records from Supabase.`
    );
    return data;
  } catch (error) {
    console.error("[SITEMAP_EXCEPTION] Unhandled fetch exception:", error);
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

  const tools = await fetchToolsFromSupabase();

  if (tools.length === 0) {
    return staticRoutes;
  }

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
      url: `${SITE_URL}/tool/${cleanSlug}`,
      ...(isValidDate ? { lastModified: createdDate } : {}),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Combine static and tool routes
  const combined = [...staticRoutes, ...toolRoutes];

  // Deduplicate entries by final URL to guarantee zero duplicated <loc> items
  const seenUrls = new Set<string>();
  const uniqueSitemap: MetadataRoute.Sitemap = [];

  for (const route of combined) {
    if (seenUrls.has(route.url)) continue;
    seenUrls.add(route.url);
    uniqueSitemap.push(route);
  }

  return uniqueSitemap;
}
