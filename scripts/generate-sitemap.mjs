// scripts/generate-sitemap.mjs
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Robust multi-path env loader
function loadEnv() {
  const envFiles = [".env.local", ".env", ".env.production", "../.env.local", "../.env"];
  for (const file of envFiles) {
    const envPath = path.join(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const idx = trimmed.indexOf("=");
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
      console.log(`Loaded environment from ${file}`);
    }
  }
}

loadEnv();

const SITE_URL = "https://www.aivault.pp.ua";
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://tctovtckukoxcvvwtvwy.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

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
  console.log("Generating static public/sitemap.xml from Supabase...");
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
        .not("slug", "is", null)
        .limit(2000);

      if (error) {
        console.error("Supabase query error:", error.message);
      } else if (tools && tools.length > 0) {
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
  } else {
    console.warn("WARNING: Supabase credentials not found in env. Make sure NEXT_PUBLIC_SUPABASE_ANON_KEY exists in .env.local");
  }

  const allUrls = [
    ...staticUrls.map(
      (u) =>
        `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    ),
    ...categoryUrls.map(
      (u) =>
        `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    ),
    ...toolUrls.map(
      (u) =>
        `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    ),
  ].join("\n");

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allUrls}\n</urlset>`;

  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, "sitemap.xml");
  fs.writeFileSync(outputPath, xmlContent.trim(), "utf-8");

  const total = staticUrls.length + categoryUrls.length + toolUrls.length;
  console.log(`✓ Generated static sitemap with ${total} URLs (${toolUrls.length} AI Tools) at public/sitemap.xml`);
}

run();
