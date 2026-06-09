import { MetadataRoute } from 'next';

// 🟢 HAMARA NAYA OFFICIAL CUSTOM DOMAIN
const URL = "https://aivault.pp.ua";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static Routes (Jo routes hamesha same rehte hain)
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
    // Agar aapka koi external database ya dynamic tools data list API hai, toh tools fetch karne ka logic yahan aayega.
    // Udaharan ke liye agar aapke paas static array ya slug list hai:
    const toolsSlugs = ['ghost', 'text-repeater', 'qr-generator']; // Aapke baaki tools ke slugs yahan dynamic array se bhi aa sakte hain

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
