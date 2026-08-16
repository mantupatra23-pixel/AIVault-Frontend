// scripts/generate-sitemap.mjs
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const DOMAIN = "https://www.aivault.pp.ua";

async function generate() {
  console.log("Generating static public/sitemap.xml and public/robots.txt...");

  let toolSlugs = [];

  try {
    if (SUPABASE_URL && SUPABASE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data, error } = await supabase
        .from("ai_tools")
        .select("slug, updated_at, created_at")
        .not("slug", "is", null)
        .neq("affiliate_status", "pending_submission")
        .limit(2000);

      if (!error && data) {
        toolSlugs = data;
      }
    }
  } catch (e) {
    console.error("Supabase fetch warning:", e.message);
  }

  const staticPages = [
    { loc: `${DOMAIN}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${DOMAIN}/matcher`, priority: "0.9", changefreq: "weekly" },
    { loc: `${DOMAIN}/compare`, priority: "0.8", changefreq: "weekly" },
    { loc: `${DOMAIN}/submit`, priority: "0.7", changefreq: "monthly" },
    { loc: `${DOMAIN}/vault`, priority: "0.6", changefreq: "weekly" },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  staticPages.forEach((p) => {
    xml += `  <url>\n`;
    xml += `    <loc>${p.loc}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
    xml += `    <priority>${p.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  toolSlugs.forEach((t) => {
    const lastmod = t.updated_at || t.created_at || new Date().toISOString();
    xml += `  <url>\n`;
    xml += `    <loc>${DOMAIN}/tool/${encodeURIComponent(String(t.slug))}</loc>\n`;
    xml += `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  // Programmatic Top Comparison SEO Routes
  for (let i = 0; i < Math.min(toolSlugs.length - 1, 60); i += 2) {
    const s1 = encodeURIComponent(String(toolSlugs[i].slug));
    const s2 = encodeURIComponent(String(toolSlugs[i + 1].slug));
    xml += `  <url>\n`;
    xml += `    <loc>${DOMAIN}/vs/${s1}-vs-${s2}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.85</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;

  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), xml, "utf-8");
  console.log(`✓ public/sitemap.xml generated with ${staticPages.length + toolSlugs.length} URLs.`);

  const robotsTxt = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${DOMAIN}/sitemap.xml\n`;
  fs.writeFileSync(path.join(publicDir, "robots.txt"), robotsTxt, "utf-8");
  console.log("✓ public/robots.txt created.");
}

generate();
