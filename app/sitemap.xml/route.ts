import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Vercel deployment ko strictly route parameters update karne par force karega
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const URL = "https://aivault.pp.ua";

export async function GET() {
  // 1. Static Core Main Pages Links
  const staticRoutes = [
    { url: `${URL}`, changefreq: 'daily', priority: '1.0' },
    { url: `${URL}/about`, changefreq: 'monthly', priority: '0.5' },
    { url: `${URL}/contact`, changefreq: 'monthly', priority: '0.5' },
  ];

  let toolsSlugs: string[] = [];

  // 2. Safe File-System Parsing (No compiler options required!)
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'tools.json');
    if (fs.existsSync(jsonPath)) {
      const fileContent = fs.readFileSync(jsonPath, 'utf-8');
      const toolsData = JSON.parse(fileContent);
      
      if (Array.isArray(toolsData)) {
        toolsSlugs = toolsData.map((tool: any) => tool.slug).filter(Boolean);
      }
    }
  } catch (error) {
    console.error("Critical internal error reading tools.json file:", error);
  }

  // 3. XML Construction String Template
  let xmlItems = '';

  // Static loop inject
  staticRoutes.forEach((route) => {
    xmlItems += `
    <url>
      <loc>${route.url}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>${route.changefreq}</changefreq>
      <priority>${route.priority}</priority>
    </url>`;
  });

  // Dynamic 280+ tools tools loop auto generation
  toolsSlugs.forEach((slug) => {
    xmlItems += `
    <url>
      <loc>${URL}/tool/${slug}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`;
  });

  // Full XML Structural Wrap Setup
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${xmlItems}
  </urlset>`;

  // 4. Return Absolute Response with Tight XML Content Type Headers
  return new NextResponse(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    },
  });
}
