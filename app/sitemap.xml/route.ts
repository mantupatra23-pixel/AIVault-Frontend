import { NextResponse } from 'next/server';
import toolsData from '@/data/tools.json';

// Vercel build configuration ko strictly runtime update par force karega
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const URL = "https://aivault.pp.ua";

export async function GET() {
  // 1. Static Core Application Pages Links
  const staticRoutes = [
    { url: `${URL}`, changefreq: 'daily', priority: '1.0' },
    { url: `${URL}/about`, changefreq: 'monthly', priority: '0.5' },
    { url: `${URL}/contact`, changefreq: 'monthly', priority: '0.5' },
  ];

  let toolsSlugs: string[] = [];

  // 2. Safe Parsing from data/tools.json Data Layer
  try {
    if (toolsData && Array.isArray(toolsData)) {
      toolsSlugs = toolsData.map((tool: any) => tool.slug).filter(Boolean);
    }
  } catch (e) {
    console.error("Critical error reading tools.json inside sitemap route:", e);
  }

  // 3. XML String Structural Template Building
  let xmlItems = '';

  // Static pages inject loops
  staticRoutes.forEach((route) => {
    xmlItems += `
    <url>
      <loc>${route.url}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>${route.changefreq}</changefreq>
      <priority>${route.priority}</priority>
    </url>`;
  });

  // Dynamic 280+ tools auto loop injection
  toolsSlugs.forEach((slug) => {
    xmlItems += `
    <url>
      <loc>${URL}/tool/${slug}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`;
  });

  // Full XML Metadata Header Scheme Layout
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${xmlItems}
  </urlset>`;

  // 4. Return Raw Document with Content-Type Enforcement Header
  return new NextResponse(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    },
  });
}
