import { MetadataRoute } from 'next';
// 🟢 DIRECT JSON IMPORT (Bina kisi fs/path error ke tools data link karein)
import toolsData from '../data/tools.json';

// HAMARA OFFICIAL CUSTOM DOMAIN
const URL = "https://aivault.pp.ua";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static Core Pages Links
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

    // Agar tools.json ka data sahi se array mein hai, toh slugs extract karega
    if (Array.isArray(toolsData)) {
      toolsSlugs = toolsData.map((tool: any) => tool.slug).filter(Boolean);
    }

    // Saare 280+ tools ke liye automatic dynamic URLs generate honge
    const dynamicRoutes = toolsSlugs.map((slug) => ({
      url: `${URL}/tool/${slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...dynamicRoutes];
    
  } catch (error) {
    console.error("NextJS Sitemap JSON Import Error:", error);
    return staticRoutes;
  }
}
