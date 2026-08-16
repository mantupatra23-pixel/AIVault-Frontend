// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Cache for 1 hour for high performance

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

export async function GET(req: Request) {
  // Automatically detect exact host (www or non-www)
  const host = req.headers.get("host") || "www.aivault.pp.ua";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const staticPages = [
    { loc: `${baseUrl}`, priority: "1.0", changefreq: "daily" },
    { loc: `${baseUrl}/compare`, priority: "0.9", changefreq: "daily" },
    { loc: `${baseUrl}/submit`, priority: "0.8", changefreq: "weekly" },
    { loc: `${baseUrl}/vault`, priority: "0.7", changefreq: "weekly" },
  ];

  const categoryPages = CATEGORIES.map((cat) => ({
    loc: `${baseUrl}/?cat=${cat}`,
    priority: "0.85",
    changefreq: "daily",
  }));

  let toolPages: { loc: string; lastmod: string; priority: string; changefreq: string }[] = [];

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data: tools } = await supabase
        .from("ai_tools")
        .select("slug, updated_at")
        .not("slug", "is", null);

      if (tools && tools.length > 0) {
        toolPages = tools.map((t) => ({
          loc: `${baseUrl}/tool/${encodeURIComponent(t.slug)}`,
          lastmod: t.updated_at ? new Date(t.updated_at).toISOString() : new Date().toISOString(),
          priority: "0.80",
          changefreq: "weekly",
        }));
      }
    } catch (e) {
      console.error("Sitemap XML generation error:", e);
    }
  }

  const currentDate = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (p) => `  <url>
    <loc>${p.loc}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
${categoryPages
  .map(
    (c) => `  <url>
    <loc>${c.loc}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${c.changefreq}</changefreq>
    <priority>${c.priority}</priority>
  </url>`
  )
  .join("\n")}
${toolPages
  .map(
    (t) => `  <url>
    <loc>${t.loc}</loc>
    <lastmod>${t.lastmod}</lastmod>
    <changefreq>${t.changefreq}</changefreq>
    <priority>${t.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new NextResponse(xml.trim(), {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
