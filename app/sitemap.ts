import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

// Vercel deployment ko strictly cache-bypass aur dynamic data update karne par force karega
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const URL = "https://aivault.pp.ua";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static Application Pages
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
    // 2. Safe Runtime JSON Reading Layer
    const jsonPath = path.join(process.cwd(), 'data', 'tools.json');
    let toolsSlugs: string[] = [];

    if (fs.existsSync(jsonPath)) {
      const fileContent = fs.readFileSync(jsonPath, 'utf-8');
      const toolsData = JSON.parse(fileContent);

      if (Array.isArray(toolsData)) {
        toolsSlugs = toolsData.map((tool: any) => tool.slug).filter(Boolean);
      }
    }

    // 3. Mapping 280+ tools dynamically
    const dynamicRoutes = toolsSlugs.map((slug) => ({
      url: `${URL}/tool/${slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...dynamicRoutes];
    
  } catch (error) {
    console.error("NextJS Core Sitemap Pipeline Error:", error);
    return staticRoutes;
  }
}
