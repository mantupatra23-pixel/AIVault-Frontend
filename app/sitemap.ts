import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

// 🟢 HAMARA NAYA OFFICIAL CUSTOM DOMAIN
const URL = "https://aivault.pp.ua";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static Core Pages
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
    // 2. AUTOMATIC JSON DATA READING LOGIC
    // Yeh code aapki data/tools.json file ka path dhoondhega
    const jsonPath = path.join(process.cwd(), 'data', 'tools.json');
    
    let toolsSlugs: string[] = [];

    if (fs.existsSync(jsonPath)) {
      const fileContent = fs.readFileSync(jsonPath, 'utf-8');
      const toolsData = JSON.parse(fileContent);

      // Agar toolsData ek array hai, toh usme se saare 'slug' nikal lega
      if (Array.isArray(toolsData)) {
        toolsSlugs = toolsData.map((tool: any) => tool.slug).filter(Boolean);
      }
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
    console.error("NextJS JSON Sitemap Pipeline Error:", error);
    return staticRoutes;
  }
}
