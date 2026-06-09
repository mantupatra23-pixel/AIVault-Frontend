import { MetadataRoute } from 'next';
import toolsData from '@/data/tools.json';

// 🟢 strict dynamic server behavior configuration for Vercel
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const URL = "https://aivault.pp.ua";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    let toolsSlugs: string[] = [];

    if (Array.isArray(toolsData)) {
      toolsSlugs = toolsData.map((tool: any) => tool.slug).filter(Boolean);
    }

    const dynamicRoutes = toolsSlugs.map((slug) => ({
      url: `${URL}/tool/${slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...dynamicRoutes];
    
  } catch (error) {
    console.error("NextJS Sitemap Runtime Pipeline Error:", error);
    return staticRoutes;
  }
}
