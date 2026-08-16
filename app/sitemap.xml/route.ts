// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";
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

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const currentDate = new Date().toISOString();

  const staticPages = [
    { loc: `${SITE_URL}`, priority: "1.0", changefreq: "daily" },
    { loc: `${SITE_URL}/compare`, priority: "0.9", changefreq: "daily" },
    { loc: `${SITE_URL}/submit`, priority: "0.8", changefreq: "weekly" },
    { loc: `${SITE_URL}/vault`, priority: "0.7", changefreq: "weekly" },
  ];

  const categoryPages = CATEGORIES.map((cat) => ({
    loc: `${SITE_URL}/?cat=${encodeURIComponent(cat)}`,
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
        .not("slug", "is", null)
        .order("name", { ascending: true })
        .limit(1000);

      if (tools && tools.length > 0) {
        toolPages = tools.map((t) => ({
          loc: `${SITE_URL}/tool/${encodeURIComponent(String(t.slug))}`,
          lastmod: t.updated_at ? new Date(t.updated_at).toISOString() : currentDate,
          priority: "0.80",
          changefreq: "weekly",
        }));
      }
    } catch (e) {
      console.error("Sitemap fetch error:", e);
    }
  }

  const allEntries = [
    ...staticPages.map(
      (p) => `<url><loc>${escapeXml(p.loc)}</loc><lastmod>${currentDate}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
    ),
    ...categoryPages.map(
      (c) => `<url><loc>${escapeXml(c.loc)}</loc><lastmod>${currentDate}</lastmod><changefreq>${c.changefreq}</changefreq><priority>${c.priority}</priority></url>`
    ),
    ...toolPages.map(
      (t) => `<url><loc>${escapeXml(t.loc)}</loc><lastmod>${t.lastmod}</lastmod><changefreq>${t.changefreq}</changefreq><priority>${t.priority}</priority></url>`
    ),
  ].join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${allEntries}</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate",
    },
  });
}
