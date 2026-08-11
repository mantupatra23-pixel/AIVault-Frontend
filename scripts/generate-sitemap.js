const fs = require('fs');
const path = require('path');

const CANONICAL_SITE_URL = "https://aivault.pp.ua";

// Static pages
const staticPages = [
  "",
  "/about",
  "/contact",
  "/privacy",
  "/terms"
];

// Fallback slugs if DB connection is unavailable during build
const FALLBACK_SLUGS = [
  "liso", "ghost", "freesolo-flash", "hotspot-meter", "fedica-2", "prosed", 
  "pushary", "fluree-ai", "reignat", "harnessrouter", "kodhau", "photobomb", 
  "bitfield", "benchmark", "nylas-cli", "diffsmith", "molmoact-2"
];

async function generateSitemap() {
  let toolSlugs = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (supabaseUrl && supabaseKey) {
    try {
      const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/ai_tools?select=slug&slug=not.is.null`;
      const response = await fetch(endpoint, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Range: "0-1999"
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          toolSlugs = data
            .map(t => typeof t.slug === 'string' ? t.slug.trim().toLowerCase().replace(/^\/+|\/+$/g, '') : '')
            .filter(Boolean);
        }
      }
    } catch (err) {
      console.warn("[SITEMAP_BUILD_WARN] Could not fetch tools from DB. Using fallback list.", err);
    }
  }

  if (toolSlugs.length === 0) {
    toolSlugs = FALLBACK_SLUGS;
  }

  // Deduplicate
  const uniqueSlugs = Array.from(new Set(toolSlugs));

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Write static pages
  staticPages.forEach(page => {
    xml += `  <url>\n    <loc>${CANONICAL_SITE_URL}${page}</loc>\n  </url>\n`;
  });

  // Write tool pages
  uniqueSlugs.forEach(slug => {
    xml += `  <url>\n    <loc>${CANONICAL_SITE_URL}/tool/${slug}</loc>\n  </url>\n`;
  });

  xml += `</urlset>\n`;

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
  console.log(`[SITEMAP_GEN_SUCCESS] Wrote static public/sitemap.xml with ${staticPages.length + uniqueSlugs.length} URLs.`);
}

generateSitemap();
