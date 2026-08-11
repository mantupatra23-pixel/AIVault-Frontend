import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/_admin/"],
    },
    sitemap: "https://aivault.pp.ua/sitemap.xml",
  };
}
