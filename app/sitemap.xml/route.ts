import { NextResponse } from 'next/server';
import toolsData from '@/data/tools.json';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const URL = "https://aivault.pp.ua";

export async function GET() {
  // 1. Static Routes Collection
  const staticRoutes = [
    { url: `${URL}`, changefreq: 'daily', priority: '1.0' },
    { url: `${URL}/about`, changefreq: 'monthly', priority: '0.5' },
    { url: `${URL}/contact`, changefreq: 'monthly', priority: '0.5' },
  ];

  let toolsSlugs: string[] = [];

  // 2. Safe parsing from data/tools.json
  try {
    if (toolsData && Array.isArray(toolsData)) {
      toolsSlugs = toolsData.map((tool: any) => tool.slug).filter(Boolean);
    }
  } catch (e) {
    console.error("Error reading tools.json inside sitemap route:", e);
  }

  // 3. XML String Generation Logic
  let xmlItems = '';

  // Add static pages to XML string
  staticRoutes.forEach((route) => {
    xmlItems += `
    <url>
      <loc>${route.url}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>${route.changefreq}</changefreq>
      <priority>${route.priority}</priority>
    </url>`;
  });

  // Add all 280+ tools dynamically to XML string
  toolsSlugs.forEach((slug) => {
    xmlItems += `
    <url>
      <loc>${URL}/tool/${slug}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`;
  });

  // Full XML Structure wrapper
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${xmlItems}
  </urlset>`;

  // 4. Return Raw Response with STRIKT XML Content-Type
  return new NextResponse(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    },
  });
}
