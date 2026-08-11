const { createClient } = require("@supabase/supabase-js");

// Require service role or anon keys from environment
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""
).trim();

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL: Missing Supabase environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Blacklist regex filter to purge legacy analyst boilerplate
const BLACKLIST = [
  /As a Senior SEO &? AI Analyst( for Visora AI)?\.*/gi,
  /Our Professional Review:?\.*/gi,
  /I have conducted (a|an) (in-depth|thorough) analysis\.*/gi,
  /I conducted (a|an) (in-depth|thorough) analysis\.*/gi,
  /Visora AI network intelligence identifies\.*/gi,
  /AI Vault network intelligence identifies\.*/gi,
  /Our analysis aims to provide\.*/gi,
  /Our research shows\.*/gi,
  /empowering users to make informed decisions\.*/gi,
  /expected to remain competitive\.*/gi,
  /Pricing 2026/gi,
  /provides software functionality for .* workflows/gi,
];

function sanitizeString(str, toolName = "") {
  if (!str || typeof str !== "string") return "";

  let cleaned = str;
  BLACKLIST.forEach((pattern) => {
    cleaned = cleaned.replace(pattern, "");
  });

  if (toolName) {
    const yearRegex = new RegExp(`${toolName} Pricing 2026`, "gi");
    cleaned = cleaned.replace(yearRegex, `${toolName} Pricing`);
  }

  cleaned = cleaned.replace(/^[\s,.:;—–-]+/, "").trim();
  return cleaned;
}

// Tool-specific factual overrides for key tools
const KNOWN_OVERRIDES = {
  ghost: {
    description:
      "Ghost is an open-source, independent publishing platform designed for professional creators, bloggers, newsletters, and online publications. Built on Node.js, Ghost provides modern tools for subscription management, content creation, native newsletter delivery, custom themes, and membership monetization.",
    pricing: "Paid / Open Source (Self-hosted is free; managed Ghost(Pro) starts at $9/mo)",
    official_url: "https://ghost.org",
    pros: [
      "Native email newsletter distribution and audience subscriptions",
      "Fast Node.js performance with custom handlebars themes",
      "Built-in membership and payment integration via Stripe",
      "Full REST and GraphQL APIs for headless publishing"
    ],
    cons: [
      "Requires technical server setup if self-hosting",
      "Plugin ecosystem is smaller compared to traditional CMS platforms like WordPress"
    ]
  },
  "nylas-cli": {
    description:
      "Nylas CLI is a developer command-line interface provided by Nylas to manage email, calendar, and contacts integration. It allows software engineers to inspect API endpoints, test OAuth workflows, manage Nylas application keys, and debug communications data directly from the terminal.",
    pricing: "Freemium / Usage-based API tiers",
    official_url: "https://www.nylas.com",
    pros: [
      "Accelerates local testing of email and calendar integrations",
      "Direct API key management and application environment switching",
      "Structured CLI outputs for debugging communication webhooks"
    ],
    cons: [
      "Requires a Nylas developer account and API credentials",
      "Designed specifically for technical developers rather than non-technical users"
    ]
  }
};

async function migrateDatabaseContent() {
  console.log("[MIGRATION_START] Querying database records...");

  const { data: tools, error } = await supabase
    .from("ai_tools")
    .select("id, slug, name, description, pros, cons, pricing");

  if (error) {
    console.error("[DB_ERROR]", error.message);
    process.exit(1);
  }

  console.log(`[MIGRATION_PROGRESS] Found ${tools.length} tool records. Processing...`);

  let updatedCount = 0;

  for (const tool of tools) {
    if (!tool.slug) continue;

    const lowerSlug = tool.slug.toLowerCase().trim();
    let updates = {};

    // Check if tool has explicit manual override
    if (KNOWN_OVERRIDES[lowerSlug]) {
      const override = KNOWN_OVERRIDES[lowerSlug];
      updates = {
        description: override.description,
        pricing: override.pricing,
        website_url: override.official_url,
        pros: override.pros,
        cons: override.cons,
      };
    } else {
      // General sanitization pass
      const cleanDesc = sanitizeString(tool.description, tool.name);
      if (cleanDesc !== tool.description) {
        updates.description = cleanDesc || `${tool.name} is a specialized software tool designed for technical and digital workflows.`;
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateErr } = await supabase
        .from("ai_tools")
        .update(updates)
        .eq("id", tool.id);

      if (updateErr) {
        console.error(`[UPDATE_FAILED] slug=${tool.slug}:`, updateErr.message);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`[MIGRATION_SUCCESS] Updated ${updatedCount} tool database records in Supabase!`);
}

migrateDatabaseContent();
