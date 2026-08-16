// app/sitemap.ts
import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const BASE_URL = "https://www.aivault.pp.ua";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/matcher`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/vault`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return staticRoutes;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: tools } = await supabase
      .from("ai_tools")
      .select("slug, updated_at, created_at")
      .not("slug", "is", null)
      .neq("affiliate_status", "pending_submission")
      .limit(1000);

    if (!tools || tools.length === 0) {
      return staticRoutes;
    }

    const dynamicRoutes: MetadataRoute.Sitemap = tools.map((t) => ({
      url: `${BASE_URL}/tool/${encodeURIComponent(String(t.slug))}`,
      lastModified: t.updated_at || t.created_at || new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...dynamicRoutes];
  } catch {
    return staticRoutes;
  }
}
