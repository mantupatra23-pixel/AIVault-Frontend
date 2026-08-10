import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}`, lastModified: new Date(), priority: 1.0 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), priority: 0.2 },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) return staticRoutes;

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: tools } = await supabase
      .from("ai_tools")
      .select("slug, updated_at, created_at")
      .not("slug", "is", null);

    if (!tools) return staticRoutes;

    const toolRoutes: MetadataRoute.Sitemap = tools
      .filter((t) => t.slug && typeof t.slug === "string" && t.slug.trim() !== "")
      .map((t) => ({
        url: `${SITE_URL}/tool/${t.slug.trim()}`,
        lastModified: t.updated_at ? new Date(t.updated_at) : new Date(t.created_at || Date.now()),
        priority: 0.8,
      }));

    return [...staticRoutes, ...toolRoutes];
  } catch (err) {
    return staticRoutes;
  }
}
