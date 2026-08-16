// app/sitemap.ts
import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.aivault.pp.ua";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
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
  const currentDate = new Date();

  // 1. Static Core Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/compare`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/submit`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/vault`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // 2. Category Pages
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${SITE_URL}/?cat=${cat}`,
    lastModified: currentDate,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  // 3. Dynamic Tool Pages from Supabase
  let toolRoutes: MetadataRoute.Sitemap = [];

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data: tools } = await supabase
        .from("ai_tools")
        .select("slug, updated_at")
        .not("slug", "is", null)
        .order("name", { ascending: true });

      if (tools && tools.length > 0) {
        toolRoutes = tools.map((t) => ({
          url: `${SITE_URL}/tool/${encodeURIComponent(String(t.slug).trim())}`,
          lastModified: t.updated_at ? new Date(t.updated_at) : currentDate,
          changeFrequency: "weekly",
          priority: 0.8,
        }));
      }
    } catch (e) {
      console.error("Supabase sitemap error:", e);
    }
  }

  return [...staticRoutes, ...categoryRoutes, ...toolRoutes];
}
