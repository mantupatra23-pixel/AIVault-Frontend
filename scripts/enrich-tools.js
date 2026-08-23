// scripts/enrich-tools.js
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Specific feature bank for programmatic enrichment
const CATEGORY_FEATURES = {
  coding: [
    "Context-aware code completion and automated refactoring",
    "Multi-language syntax debugging and unit test generation",
    "Autonomous CI/CD pipeline integration and security scanning",
  ],
  marketing: [
    "Multi-channel campaign analytics and automated ad copy generation",
    "Audience segmentation and high-conversion funnel optimization",
    "Programmatic SEO content scaling and keyword intent tracking",
  ],
  chatbot: [
    "Low-latency autonomous dialogue agents with custom RAG knowledge",
    "Omnichannel messaging deployment across Web, Slack, and WhatsApp",
    "Structured intent classification and contextual memory retention",
  ],
  productivity: [
    "Real-time meeting transcription and automated action item extraction",
    "Cross-app workflow automation with zero-code trigger sequences",
    "Intelligent document summarization and semantic file search",
  ],
  writing: [
    "Long-form editorial drafting with tone and brand voice matching",
    "Built-in grammar refinement and anti-AI detection formatting",
    "Structured outline generation and automatic citation embedding",
  ],
  image: [
    "High-resolution neural rendering with precise prompt prompt-weights",
    "Layered inpainting, outpainting, and background replacement",
    "Batch generation with custom style-presets and aspect ratios",
  ],
  audio: [
    "Studio-grade neural voice synthesis with human emotion inflection",
    "Automated noise suppression and multi-track audio mastering",
    "Real-time voice cloning and multi-language speech translation",
  ],
};

function generateUniqueDescription(name, category, pricing) {
  const cat = (category || "productivity").toLowerCase().trim();
  const features = CATEGORY_FEATURES[cat] || CATEGORY_FEATURES.productivity;
  
  const f1 = features[0];
  const f2 = features[1];
  const priceTier = pricing || "Freemium";

  return `${name} is a specialized ${cat} automation platform built to streamline professional workflows. Key capabilities include ${f1.toLowerCase()} alongside ${f2.toLowerCase()}. Designed for modern developers and digital teams operating on a ${priceTier.toLowerCase()} license.`;
}

async function enrichTools() {
  console.log("Fetching tools needing content enrichment...");

  const { data: tools, error } = await supabase
    .from("ai_tools")
    .select("id, name, slug, category, pricing_model, pricing, description, overview")
    .limit(1000);

  if (error || !tools) {
    console.error("Fetch error:", error);
    return;
  }

  console.log(`Analyzing ${tools.length} tools...`);
  let updatedCount = 0;

  for (const tool of tools) {
    const rawDesc = tool.overview || tool.description || "";
    
    // Agar generic template mila toh update karo
    const isGeneric =
      rawDesc.includes("enterprise-grade AI solution designed for high-performance") ||
      rawDesc.length < 50;

    if (isGeneric) {
      const enrichedDesc = generateUniqueDescription(
        tool.name,
        tool.category,
        tool.pricing_model || tool.pricing
      );

      const { error: updateErr } = await supabase
        .from("ai_tools")
        .update({
          overview: enrichedDesc,
          description: enrichedDesc,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tool.id);

      if (!updateErr) {
        updatedCount++;
        process.stdout.write(`\rEnriched: ${updatedCount} tools`);
      }
    }
  }

  console.log(`\nSuccess! Updated ${updatedCount} tools with unique SEO content.`);
}

enrichTools();
