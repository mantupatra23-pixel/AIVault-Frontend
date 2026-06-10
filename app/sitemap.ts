import { MetadataRoute } from 'next';
import path from 'path';

// Vercel deployment ko strictly static cache bypass karne par force karega
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const URL = "https://aivault.pp.ua";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static Core Main Pages
  const staticRoutes = [
    {
      url: `${URL}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${URL}/about`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${URL}/contact`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  try {
    // 2. SAFE INLINE DATA FETCHING
    // TypeScript module aur tsconfig errors ko bypass karne ke liye standard inline require block
    const jsonPath = path.join(process.cwd(), 'data', 'tools.json');
    const toolsData = require(jsonPath);

    let toolsSlugs: string[] = [];

    if (toolsData && Array.isArray(toolsData)) {
      toolsSlugs = toolsData.map((tool: any) => tool.slug).filter(Boolean);
    }

    // Dynamic 280+ tools mapping loop
    const dynamicRoutes = toolsSlugs.map((slug) => ({
      url: `${URL}/tool/${slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...dynamicRoutes];
    
  } catch (error) {
    console.error("Critical error inside sitemap generation engine:", error);
    return staticRoutes;
  }
}
