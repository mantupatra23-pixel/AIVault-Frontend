// app/sitemap.ts
import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://aivault.pp.ua";

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: tools } = await supabase
    .from("ai_tools")
    .select("slug, name, updated_at, created_at");

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/find`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/vault`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const categories = [
    "marketing",
    "productivity",
    "chatbot",
    "coding",
    "image",
    "writing",
    "audio",
    "video",
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const toolRoutes: MetadataRoute.Sitemap = (tools || []).map((t) => {
    const slug = t.slug || t.name || "";
    return {
      url: `${baseUrl}/tool/${encodeURIComponent(slug)}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    };
  });

  return [...staticRoutes, ...categoryRoutes, ...toolRoutes];
}
