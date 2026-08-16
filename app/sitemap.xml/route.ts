// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const BASE_URL = "https://www.aivault.pp.ua";

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: tools } = await supabase
      .from("ai_tools")
      .select("slug, created_at, updated_at")
      .not("slug", "is", null)
      .neq("affiliate_status", "pending_submission")
      .limit(1000);

    const staticRoutes = [
      { url: `${BASE_URL}`, changefreq: "daily", priority: "1.0" },
      { url: `${BASE_URL}/matcher`, changefreq: "weekly", priority: "0.9" },
      { url: `${BASE_URL}/compare`, changefreq: "weekly", priority: "0.8" },
      { url: `${BASE_URL}/submit`, changefreq: "monthly", priority: "0.7" },
      { url: `${BASE_URL}/vault`, changefreq: "weekly", priority: "0.6" },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    staticRoutes.forEach((route) => {
      xml += `  <url>\n`;
      xml += `    <loc>${route.url}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    if (tools && tools.length > 0) {
      tools.forEach((tool) => {
        const lastmod =
          tool.updated_at || tool.created_at || new Date().toISOString();
        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}/tool/${encodeURIComponent(tool.slug)}</loc>\n`;
        xml += `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      });
    }

    xml += `</urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch {
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new NextResponse(fallbackXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  }
}
