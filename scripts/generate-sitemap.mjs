// scripts/generate-sitemap.mjs
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://www.aivault.pp.ua";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const CATEGORIES = [
  "productivity",
  "marketing",
  "coding",
  "chatbot",
  "image",
  "writing",
  "audio",
  "video",
];

function escapeXml(unsafe) {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function run() {
  console.log("Generating static public/sitemap.xml...");
  const today = new Date().toISOString().split("T")[0];

  const staticUrls = [
    { loc: `${SITE_URL}`, priority: "1.0", changefreq: "daily" },
    { loc: `${SITE_URL}/compare`, priority: "0.9", changefreq: "daily" },
    { loc: `${SITE_URL}/submit`, priority: "0.8", changefreq: "weekly" },
    { loc: `${SITE_URL}/vault`, priority: "0.7", changefreq: "weekly" },
  ];

  const categoryUrls = CATEGORIES.map((cat) => ({
    loc: `${SITE_URL}/?cat=${cat}`,
    priority: "0.85",
    changefreq: "daily",
  }));

  let toolUrls = [];

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data: tools, error } = await supabase
        .from("ai_tools")
        .select("slug, updated_at")
        .not("slug", "is", null);

      if (!error && tools && tools.length > 0) {
        toolUrls = tools.map((t) => ({
          loc: `${SITE_URL}/tool/${encodeURIComponent(String(t.slug).trim())}`,
          lastmod: t.updated_at ? String(t.updated_at).split("T")[0] : today,
          priority: "0.80",
          changefreq: "weekly",
        }));
      }
    } catch (err) {
      console.warn("Supabase fetch warning:", err);
    }
  }

  const allUrls = [
    ...staticUrls.map(
      (u) => `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    ),
    ...categoryUrls.map(
      (u) => `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    ),
    ...toolUrls.map(
      (u) => `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    ),
  ].join("\n");

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allUrls}\n</urlset>`;

  const outputPath = path.join(process.cwd(), "public", "sitemap.xml");
  fs.writeFileSync(outputPath, xmlContent.trim(), "utf-8");
  console.log(`✓ Generated static sitemap with ${staticUrls.length + categoryUrls.length + toolUrls.length} URLs at public/sitemap.xml`);
}

run();
