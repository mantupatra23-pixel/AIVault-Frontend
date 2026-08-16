// app/sitemap.ts
import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.aivault.pp.ua";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const CATEGORIES = [
  "productivity",
  "marketing",
  "coding",
  "chatbot",
  "image",
  "writing",
  "audio",
  "video",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/compare`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/vault`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Canonical Category routes
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${SITE_URL}/?cat=${cat}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.85,
  }));

  // Canonical Dynamic Tool URLs
  let toolRoutes: MetadataRoute.Sitemap = [];

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data: tools } = await supabase
        .from("ai_tools")
        .select("slug, updated_at")
        .not("slug", "is", null);

      if (tools && tools.length > 0) {
        toolRoutes = tools.map((tool) => ({
          url: `${SITE_URL}/tool/${encodeURIComponent(tool.slug)}`,
          lastModified: tool.updated_at ? new Date(tool.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        }));
      }
    } catch (err) {
      console.error("Sitemap generation error:", err);
    }
  }

  return [...staticRoutes, ...categoryRoutes, ...toolRoutes];
}
