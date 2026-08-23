const { google } = require("googleapis");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://www.aivault.pp.ua";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const KEY_PATH = path.join(process.cwd(), "service_account.json");

if (!fs.existsSync(KEY_PATH)) {
  console.error("❌ 'service_account.json' file nahi mili! Root folder me check karein.");
  process.exit(1);
}

const keyFile = JSON.parse(fs.readFileSync(KEY_PATH, "utf8"));

const jwtClient = new google.auth.JWT(
  keyFile.client_email,
  null,
  keyFile.private_key,
  ["https://www.googleapis.com/auth/indexing"],
  null
);

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

async function submitUrlToGoogle(indexing, url) {
  try {
    const res = await indexing.urlNotifications.publish({
      requestBody: {
        url: url,
        type: "URL_UPDATED",
      },
    });
    return { success: true, status: res.status, url };
  } catch (err) {
    return { success: false, error: err.message, url };
  }
}

async function startGoogleBatchIndexing() {
  console.log("🔐 Google Indexing API authorization running...");
  await jwtClient.authorize();
  const indexing = google.indexing({ version: "v3", auth: jwtClient });

  console.log("📦 Supabase se 830+ tools fetch ho rahe hain...");
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: tools, error } = await supabase
    .from("ai_tools")
    .select("slug")
    .not("slug", "is", null);

  if (error || !tools) {
    console.error("Fetch error:", error);
    return;
  }

  const allUrls = [
    `${BASE_URL}`,
    `${BASE_URL}/compare`,
    `${BASE_URL}/vault`,
    ...CATEGORIES.map((cat) => `${BASE_URL}/category/${cat}`),
    ...tools.map((t) => `${BASE_URL}/tool/${t.slug}`),
  ];

  console.log(`🚀 Total ${allUrls.length} URLs Googlebot ko bheje ja rahe hain...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < allUrls.length; i++) {
    const url = allUrls[i];
    const result = await submitUrlToGoogle(indexing, url);

    if (result.success) {
      successCount++;
      console.log(`[${i + 1}/${allUrls.length}] ✅ Indexed: ${url}`);
    } else {
      failCount++;
      console.log(`[${i + 1}/${allUrls.length}] ❌ Failed: ${url} (${result.error})`);
      if (result.error && result.error.includes("Quota exceeded")) {
        console.log("\n⚠️ Daily Google quota hit (200 URLs/day). Baaki kal execute karein!");
        break;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  console.log(`\n🎉 Completed! ${successCount} URLs submitted to Googlebot.`);
}

startGoogleBatchIndexing();
