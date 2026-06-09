import { MetadataRoute } from 'next';

// 🟢 OFFICIAL CUSTOM DOMAIN
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
    // 2. SAARE TOOLS KI DYNAMIC ARRAY LIST
    // Bhai, aapke jitne bhi main 280+ tools hain aur aage aane wale tools honge, unke names bas is list mein comma (,) laga kar jodte jana.
    // Yeh pure Next.js production serverless build ko super-fast aur compatible rakhta hai.
    const toolsSlugs = [
      'ghost', 
      'text-repeater', 
      'qr-generator',
      // Naye tools ke folder-slugs yahan niche add karte jao:
    ];

    const dynamicRoutes = toolsSlugs.map((slug) => ({
      url: `${URL}/tool/${slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...dynamicRoutes];
    
  } catch (error) {
    console.error("NextJS Dynamic Sitemap Pipeline Error:", error);
    return staticRoutes;
  }
}
