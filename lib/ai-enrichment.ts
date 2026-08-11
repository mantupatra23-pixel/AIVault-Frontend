import { NormalizedTool, FAQItem } from "./tool-normalizer";

export function enrichMissingToolFields(tool: NormalizedTool): NormalizedTool {
  const enriched = { ...tool };

  if (!enriched.whoShouldUse) {
    enriched.whoShouldUse = `${enriched.name} is designed for professionals and teams operating in the ${enriched.category} space.`;
  }

  if (!enriched.howToUse || enriched.howToUse.length === 0) {
    enriched.howToUse = [
      `Visit the official platform portal for ${enriched.name}.`,
      "Create or authenticate your account credentials.",
      "Configure project workspace settings for your task.",
      "Execute your workflow and export or integrate generated outputs."
    ];
  }

  if (!enriched.faqs || enriched.faqs.length === 0) {
    enriched.faqs = [
      {
        q: `What is ${enriched.name} used for?`,
        a: enriched.description || `${enriched.name} provides software functionality for ${enriched.category} operations.`
      },
      {
        q: `What pricing model does ${enriched.name} offer?`,
        a: `${enriched.name} is listed under a ${enriched.pricingModel} model.`
      }
    ];
  }

  return enriched;
}
