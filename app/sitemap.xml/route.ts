import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel platform ko strictly dynamic generation response header bhejane par force karega
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const URL = "https://aivault.pp.ua";

export async function GET() {
  // 1. Core Application Baseline URLs
  const staticRoutes = [
    { url: `${URL}`, changefreq: 'daily', priority: '1.0' },
    { url: `${URL}/about`, changefreq: 'monthly', priority: '0.5' },
    { url: `${URL}/contact`, changefreq: 'monthly', priority: '0.5' },
  ];

  let toolsSlugs: { slug: string; created_at: string | null }[] = [];

  // 2. Direct Supabase Stream Fetching
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: tools } = await supabase
        .from("ai_tools")
        .select("slug, created_at");

      if (tools && Array.isArray(tools)) {
        toolsSlugs = tools;
      }
    }
  } catch (error) {
    console.error("Sitemap compilation dynamic fetch backup bypass:", error);
  }

  // 3. Generating Pure XML String Content Block
  let xmlItems = '';

  // Adding core application pages
  staticRoutes.forEach((route) => {
    xmlItems += `
    <url>
      <loc>${route.url}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>${route.changefreq}</changefreq>
      <priority>${route.priority}</priority>
    </url>`;
  });

  // Adding 280+ to 370+ active database tools dynamically
  toolsSlugs.forEach((tool) => {
    const lastModDate = tool.created_at ? new Date(tool.created_at).toISOString() : new Date().toISOString();
    xmlItems += `
    <url>
      <loc>${URL}/tool/${tool.slug}</loc>
      <lastmod>${lastModDate}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`;
  });

  // Strict valid sitemaps xml protocol layout schema wrapper
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${xmlItems}
  </urlset>`.trim();

  // 4. Forceful Native XML Document Engine Stream Response
  return new NextResponse(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    },
  });
}
