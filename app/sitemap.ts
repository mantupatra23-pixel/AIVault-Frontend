import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  // Read environment variables directly
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !supabaseKey) {
    console.error("[SITEMAP_CRITICAL] Missing Supabase environment variables!");
    return staticRoutes;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Query all rows directly without arbitrary filters
    const { data: tools, error } = await supabase
      .from("ai_tools")
      .select("slug, updated_at, created_at")
      .not("slug", "is", null);

    if (error) {
      console.error("[SITEMAP_DB_ERROR]", error.message, error.code);
      return staticRoutes;
    }

    if (!tools || tools.length === 0) {
      console.error("[SITEMAP_EMPTY] ai_tools returned 0 rows");
      return staticRoutes;
    }

    const seenSlugs = new Set<string>();
    const toolRoutes: MetadataRoute.Sitemap = [];

    for (const t of tools) {
      if (!t.slug || typeof t.slug !== "string") continue;

      const cleanSlug = t.slug.trim().toLowerCase();
      if (!cleanSlug || seenSlugs.has(cleanSlug)) continue;

      seenSlugs.add(cleanSlug);

      toolRoutes.push({
        url: `${SITE_URL}/tool/${cleanSlug}`,
        lastModified: t.updated_at
          ? new Date(t.updated_at)
          : t.created_at
          ? new Date(t.created_at)
          : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    console.log(`[SITEMAP_SUCCESS] Generated ${toolRoutes.length} tool routes`);
    return [...staticRoutes, ...toolRoutes];
  } catch (err) {
    console.error("[SITEMAP_EXCEPTION]", err);
    return staticRoutes;
  }
}
