import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel deployment ko strictly static cache bypass karne par force karega
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const URL = "https://aivault.pp.ua";

export async function GET() {
  // 1. Static Core Main Pages
  const staticRoutes = [
    { url: `${URL}`, changefreq: 'daily', priority: '1.0' },
    { url: `${URL}/about`, changefreq: 'monthly', priority: '0.5' },
    { url: `${URL}/contact`, changefreq: 'monthly', priority: '0.5' },
  ];

  let toolsSlugs: { slug: string; created_at: string | null }[] = [];

  // 2. Supabase Database Integration
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: tools } = await supabase
      .from("ai_tools")
      .select("slug, created_at");

    if (tools && Array.isArray(tools)) {
      toolsSlugs = tools;
    }
  } catch (error) {
    console.error("Critical error fetching supabase nodes for sitemap:", error);
  }

  // 3. Raw XML String Construction
  let xmlItems = '';

  // Static pages template loop inject
  staticRoutes.forEach((route) => {
    xmlItems += `
    <url>
      <loc>${route.url}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>${route.changefreq}</changefreq>
      <priority>${route.priority}</priority>
    </url>`;
  });

  // Dynamic 280+ tools tools loop template auto inject
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

  // Full Metadata Structure wrap
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${xmlItems}
  </urlset>`;

  // 4. Return Raw Response with Tight XML Content-Type
  return new NextResponse(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    },
  });
}
