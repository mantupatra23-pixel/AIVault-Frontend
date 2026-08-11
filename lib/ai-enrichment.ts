import { NormalizedTool, FAQItem } from "./tool-normalizer";

/**
 * Derives contextual fallback values ONLY when database columns are null/empty.
 * Does NOT overwrite existing DB values.
 */
export function enrichMissingToolFields(tool: NormalizedTool): NormalizedTool {
  const enriched = { ...tool };

  // 1. Enrich `whoShouldUse` if missing
  if (!enriched.whoShouldUse) {
    const cat = enriched.category.toLowerCase();
    if (cat.includes("code") || cat.includes("dev") || cat.includes("cli")) {
      enriched.whoShouldUse = `${enriched.name} is designed for software engineers, DevOps specialists, and technical teams automating terminal and code workflows.`;
    } else if (cat.includes("publish") || cat.includes("blog") || cat.includes("content")) {
      enriched.whoShouldUse = `${enriched.name} is built for independent creators, newsletter writers, media teams, and bloggers building subscription platforms.`;
    } else {
      enriched.whoShouldUse = `${enriched.name} is suited for professionals, creators, and teams operating within the ${enriched.category} sector.`;
    }
  }

  // 2. Enrich `howToUse` if missing
  if (!enriched.howToUse || enriched.howToUse.length === 0) {
    const cat = enriched.category.toLowerCase();
    if (cat.includes("code") || cat.includes("cli")) {
      enriched.howToUse = [
        `Install or access ${enriched.name} via your developer environment or terminal.`,
        `Set up API keys or environment configuration parameters.`,
        `Execute CLI commands or call API endpoints directly in your project.`,
        `Inspect terminal output logs and deploy to production.`
      ];
    } else if (cat.includes("publish") || cat.includes("blog")) {
      enriched.howToUse = [
        `Create an account or deploy ${enriched.name} on your server.`,
        `Configure site branding, custom domain, and membership settings.`,
        `Draft, format, and organize posts or newsletter broadcasts.`,
        `Publish content and manage your subscriber growth.`
      ];
    } else {
      enriched.howToUse = [
        `Navigate to the official site via the link on this page.`,
        `Set up or authenticate your account credentials.`,
        `Configure workspace parameters according to your requirements.`,
        `Execute tasks and export or integrate generated outputs.`
      ];
    }
  }

  // 3. Enrich `faqs` if missing
  if (!enriched.faqs || enriched.faqs.length === 0) {
    enriched.faqs = [
      {
        q: `What primary function does ${enriched.name} serve?`,
        a: `${enriched.name} operates in the ${enriched.category} domain to assist users with domain-specific workflows.`
      },
      {
        q: `What is ${enriched.name}'s pricing model?`,
        a: enriched.pricingDetails
          ? `${enriched.name} is offered under: ${enriched.pricingDetails}`
          : `Pricing details can be verified on ${enriched.name}'s official portal.`
      },
      {
        q: `Who is ${enriched.name} best suited for?`,
        a: enriched.whoShouldUse
      }
    ];
  }

  return enriched;
}
