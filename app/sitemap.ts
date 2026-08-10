import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://aivault.pp.ua";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
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

  if (!supabaseUrl || !supabaseAnonKey) {
    return staticRoutes;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: tools, error } = await supabase
      .from("ai_tools")
      .select("slug, updated_at, created_at, is_published")
      .eq("is_published", true)
      .not("slug", "is", null);

    if (error || !tools) {
      return staticRoutes;
    }

    const toolRoutes: MetadataRoute.Sitemap = tools
      .filter((tool) => tool.slug && typeof tool.slug === "string" && tool.slug.trim() !== "")
      .map((tool) => ({
        url: `${BASE_URL}/tool/${tool.slug.trim()}`,
        lastModified: tool.updated_at ? new Date(tool.updated_at) : tool.created_at ? new Date(tool.created_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    return [...staticRoutes, ...toolRoutes];
  } catch (err) {
    return staticRoutes;
  }
}
