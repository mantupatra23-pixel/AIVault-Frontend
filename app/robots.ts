import type { MetadataRoute } from "next";

const SITE_URL = "https://aivault.pp.ua";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
        ],
      },
    ],

    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
