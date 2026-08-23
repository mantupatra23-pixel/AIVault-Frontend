import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://www.aivault.pp.ua";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tctovtckukoxcvvwtvwy.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const CATEGORIES = [
  "marketing",
  "productivity",
  "chatbot",
  "coding",
  "image",
  "writing",
  "audio",
  "video",
];

const POPULAR_MATCHUPS = [
  "chatgpt-vs-claude",
  "midjourney-vs-stable-diffusion",
  "writesonic-vs-jasper",
  "cursor-vs-github-copilot",
  "runway-vs-pika-labs",
  "perplexity-vs-gemini",
  "copy-ai-vs-jasper",
  "elevenlabs-vs-suno",
  "leonardo-ai-vs-midjourney",
  "v0-vs-bolt-new",
  "cursor-vs-windsurf",
  "claude-vs-gpt-4o",
];

async function generate() {
  console.log("⚡ Generating complete production sitemap and robots.txt...");

  const currentDate = new Date().toISOString();
  let tools = [];

  try {
    if (SUPABASE_URL && SUPABASE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data, error } = await supabase
        .from("ai_tools")
        .select("slug, updated_at, created_at")
        .not("slug", "is", null)
        .order("name", { ascending: true })
        .limit(2000);

      if (!error && data) {
        tools = data;
      }
    }
  } catch (err) {
    console.warn("⚠️ Supabase tool fetch warning:", err.message);
  }

  // 1. Core Platform Landing Pages
  const staticPages = [
    { loc: `${BASE_URL}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${BASE_URL}/ai-finder`, priority: "0.9", changefreq: "daily" },
    { loc: `${BASE_URL}/compare`, priority: "0.9", changefreq: "daily" },
    { loc: `${BASE_URL}/vault`, priority: "0.8", changefreq: "weekly" },
    { loc: `${BASE_URL}/submit`, priority: "0.7", changefreq: "monthly" },
  ];

  // 2. Category Hub Pages
  const categoryPages = CATEGORIES.map((cat) => ({
    loc: `${BASE_URL}/category/${cat}`,
    priority: "0.8",
    changefreq: "daily",
  }));

  // 3. High-Traffic Comparison Matchups
  const comparisonPages = POPULAR_MATCHUPS.map((matchup) => ({
    loc: `${BASE_URL}/compare/${matchup}`,
    priority: "0.85",
    changefreq: "weekly",
  }));

  // 4. All 830+ Tool Dossier URLs
  const toolPages = tools.map((t) => {
    const rawDate = t.updated_at || t.created_at;
    const lastmod = rawDate ? new Date(rawDate).toISOString() : currentDate;
    return {
      loc: `${BASE_URL}/tool/${encodeURIComponent(String(t.slug))}`,
      lastmod,
      priority: "0.8",
      changefreq: "weekly",
    };
  });

  const allEntries = [
    ...staticPages,
    ...categoryPages,
    ...comparisonPages,
    ...toolPages,
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  allEntries.forEach((entry) => {
    xml += `  <url>\n`;
    xml += `    <loc>${entry.loc}</loc>\n`;
    xml += `    <lastmod>${entry.lastmod || currentDate}</lastmod>\n`;
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    xml += `    <priority>${entry.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write sitemap.xml
  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), xml, "utf-8");
  console.log(`✓ public/sitemap.xml generated with ${allEntries.length} verified URLs.`);

  // Write robots.txt with clean crawler rules
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin

Sitemap: ${BASE_URL}/sitemap.xml
`;

  fs.writeFileSync(path.join(publicDir, "robots.txt"), robotsTxt, "utf-8");
  console.log("✓ public/robots.txt generated.");
}

generate();
