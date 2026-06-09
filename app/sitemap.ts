import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

// 🟢 HAMARA NAYA OFFICIAL CUSTOM DOMAIN
const URL = "https://aivault.pp.ua";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static Pages (Jo main main pages hain)
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
    // 2. AUTOMATIC TOOLS FETCH LOGIC
    // Yeh line aapke 'app/tool' ya jahan bhi tools ke folders hain, wahan se saare names auto-read kar legi
    const toolsDirectory = path.join(process.cwd(), 'app', 'tool'); 
    
    let toolsSlugs: string[] = [];
    
    if (fs.existsSync(toolsDirectory)) {
      toolsSlugs = fs.readdirSync(toolsDirectory).filter((file) => {
        // Sirf folders ko pick karega, files ko nahi
        return fs.statSync(path.join(toolsDirectory, file)).isDirectory();
      });
    }

    // Saare 280+ tools ke liye automatic URLs generate honge
    const dynamicRoutes = toolsSlugs.map((slug) => ({
      url: `${URL}/tool/${slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Static aur Dynamic dono ko merge karke return karega
    return [...staticRoutes, ...dynamicRoutes];
    
  } catch (error) {
    console.error("Sitemap dynamic generation error:", error);
    return staticRoutes;
  }
}
