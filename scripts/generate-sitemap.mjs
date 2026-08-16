// scripts/generate-sitemap.mjs
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const envFiles = [".env.local", ".env", ".env.production"];
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

function cleanXml(str) {
  return String(str || "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function run() {
  const today = new Date().toISOString().split("T")[0];

  const staticUrls = [
    `${SITE_URL}/`,
    `${SITE_URL}/compare`,
    `${SITE_URL}/submit`,
    `${SITE_URL}/vault`,
  ];

  const categoryUrls = CATEGORIES.map((cat) => `${SITE_URL}/?cat=${cat}`);

  let toolUrls = [];

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data: tools, error } = await supabase
        .from("ai_tools")
        .select("slug, updated_at")
        .not("slug", "is", null);

      if (!error && tools && tools.length > 0) {
        toolUrls = tools
          .filter((t) => t.slug && String(t.slug).trim().length > 0)
          .map((t) => {
            const cleanSlug = encodeURIComponent(
              String(t.slug).trim().toLowerCase().replace(/[^a-z0-9-_]/g, "")
            );
            return `${SITE_URL}/tool/${cleanSlug}`;
          });
      }
    } catch (err) {
      console.warn("Supabase fetch error:", err);
    }
  }

  const allUrlsList = [...staticUrls, ...categoryUrls, ...toolUrls];

  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Generate Plain Text Sitemap (sitemap.txt)
  const txtContent = allUrlsList.join("\n");
  fs.writeFileSync(path.join(publicDir, "sitemap.txt"), txtContent, "utf8");

  // 2. Generate XML Sitemap (sitemap.xml)
  const xmlEntries = allUrlsList
    .map(
      (url) =>
        `  <url>\n    <loc>${cleanXml(url)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    )
    .join("\n");

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlEntries}\n</urlset>\n`;
  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), xmlContent, "utf8");

  console.log(`✓ Created public/sitemap.txt and public/sitemap.xml with ${allUrlsList.length} URLs`);
}

run();
