import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://aivault.pp.ua";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/login", "/signup"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
