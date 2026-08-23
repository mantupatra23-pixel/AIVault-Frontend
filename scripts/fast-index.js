// scripts/fast-index.js
const { createClient } = require("@supabase/supabase-js");

const BASE_URL = "https://www.aivault.pp.ua";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
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

async function runFastIndexing() {
  console.log("⚡ Fetching all tool routes for search engine indexing...");

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: tools, error } = await supabase
    .from("ai_tools")
    .select("slug")
    .not("slug", "is", null);

  if (error || !tools) {
    console.error("Failed to fetch tool slugs:", error);
    return;
  }

  // 1. Build Full URL List
  const urlList = [
    `${BASE_URL}`,
    `${BASE_URL}/compare`,
    `${BASE_URL}/vault`,
    ...CATEGORIES.map((cat) => `${BASE_URL}/category/${cat}`),
    ...tools.map((t) => `${BASE_URL}/tool/${t.slug}`),
  ];

  console.log(`📡 Total URLs ready for submission: ${urlList.length}`);

  // 2. Submit to IndexNow API (Bing / Seznam / IndexNow network)
  try {
    const indexNowPayload = {
      host: "www.aivault.pp.ua",
      key: "aivault_fast_indexer",
      keyLocation: `https://www.aivault.pp.ua/aivault_fast_indexer.txt`,
      urlList: urlList.slice(0, 1000),
    };

    const res = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(indexNowPayload),
    });

    console.log(`✅ IndexNow Batch Status: ${res.status}`);
  } catch (err) {
    console.error("IndexNow submission failed:", err.message);
  }

  // 3. Googlebot Ping Trigger
  try {
    const sitemapPingUrl = `https://www.google.com/ping?sitemap=https://www.aivault.pp.ua/sitemap.xml`;
    const googleRes = await fetch(sitemapPingUrl);
    console.log(`🚀 Google Sitemap Ping Triggered: Status ${googleRes.status}`);
  } catch (err) {
    console.log("Google ping notice:", err.message);
  }

  console.log("\n🎉 Indexing submission completed successfully!");
}

runFastIndexing();
