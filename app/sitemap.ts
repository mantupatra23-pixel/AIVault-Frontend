import { MetadataRoute } from 'next';

// 🟢 HAMARA NAYA OFFICIAL CUSTOM DOMAIN
const URL = "https://aivault.pp.ua";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Main Pages Links
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
    // 2. YAHAN AAPKE SAARE TOOLS KE NAMES (SLUGS) AA JAYENGE
    // Bhai, aapke jitne bhi main tools hain (jaise ghost, text-repeater, qr-generator), unke folder names is list mein comma laga kar daal do:
    const toolsSlugs = [
      'ghost', 
      'text-repeater', 
      'qr-generator',
      // Aapke jo bhi baki naye 10-10 tools hain, unke naam bas yahan list mein niche add karte jana
    ];

    const dynamicRoutes = toolsSlugs.map((slug) => ({
      url: `${URL}/tool/${slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...dynamicRoutes];
    
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return staticRoutes;
  }
}
