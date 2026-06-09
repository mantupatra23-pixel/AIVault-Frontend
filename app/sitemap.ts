import { MetadataRoute } from 'next';
import toolsData from '@/data/tools.json';

// Vercel deployment ko strictly route parameters update karne par force karega
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const URL = "https://aivault.pp.ua";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static Core Application Pages
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

    // Safe parsing data layer checker
    if (toolsData && Array.isArray(toolsData)) {
      toolsSlugs = toolsData.map((tool: any) => tool.slug).filter(Boolean);
    } else if (toolsData && typeof toolsData === 'object') {
      // Agar JSON backup structure object nesting array mein hai
      const dataArray = (toolsData as any).tools || Object.values(toolsData);
      if (Array.isArray(dataArray)) {
        toolsSlugs = dataArray.map((tool: any) => tool.slug).filter(Boolean);
      }
    }

    // Dynamic pages inject structure
    const dynamicRoutes = toolsSlugs.map((slug) => ({
      url: `${URL}/tool/${slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...dynamicRoutes];
    
  } catch (error) {
    console.error("Critical NextJS Sitemap Generator Exception:", error);
    return staticRoutes;
  }
}
