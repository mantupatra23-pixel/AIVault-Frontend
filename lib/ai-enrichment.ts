import { NormalizedTool, generateToolSpecificEnrichment } from "./tool-normalizer";

function sanitizeSEOContent(text: string | null | undefined): string | null {
  if (!text || typeof text !== "string") return null;

  const cleaned = text
    .replace(/As a Senior SEO & AI Analyst[^.]*\./gi, "")
    .replace(/In our professional review[^.]*\./gi, "")
    .replace(/Our analysis aims to[^.]*\./gi, "")
    .replace(/Our analysis shows that[^.]*\./gi, "")
    .replace(/Users can make informed decisions[^.]*\./gi, "")
    .replace(/Whether you're an individual or a team[^.]*\./gi, "")
    .replace(/In conclusion[^.]*\./gi, "")
    .replace(/Pricing 2026[^.]*\./gi, "")
    .replace(/Best \d+ Alternatives[^.]*\./gi, "")
    .trim();

  return cleaned.length > 0 ? cleaned : null;
}

export function enrichMissingToolFields(tool: NormalizedTool): NormalizedTool {
  const generated = generateToolSpecificEnrichment(tool);

  const cleanDescription = sanitizeSEOContent(tool.description || tool.long_description) || generated.description || null;

  const whoUse =
    tool.who_should_use ||
    tool.whoShouldUse ||
    generated.who_should_use ||
    generated.whoShouldUse ||
    null;

  return {
    ...generated,
    ...tool,
    description: cleanDescription,
    features_pros: (Array.isArray(tool.features_pros) && tool.features_pros.length > 0) ? tool.features_pros : (generated.features_pros || null),
    limitations_cons: (Array.isArray(tool.limitations_cons) && tool.limitations_cons.length > 0) ? tool.limitations_cons : (generated.limitations_cons || null),
    who_should_use: whoUse,
    whoShouldUse: whoUse,
    how_to_use: (Array.isArray(tool.how_to_use) && tool.how_to_use.length > 0) ? tool.how_to_use : (generated.how_to_use || null),
    use_cases: (Array.isArray(tool.use_cases) && tool.use_cases.length > 0) ? tool.use_cases : (generated.use_cases || null),
    integrations: (Array.isArray(tool.integrations) && tool.integrations.length > 0) ? tool.integrations : (generated.integrations || null),
    pricing_details: tool.pricing_details || generated.pricing_details || null,
    operating_system: tool.operating_system || generated.operating_system || null,
    deployment: tool.deployment || generated.deployment || null,
    license: tool.license || generated.license || null,
    tags: (Array.isArray(tool.tags) && tool.tags.length > 0) ? tool.tags : (generated.tags || null),
    faqs: (Array.isArray(tool.faqs) && tool.faqs.length > 0) ? tool.faqs : (generated.faqs || null),
    seo_title: tool.seo_title || generated.seo_title || null,
    seo_description: tool.seo_description || generated.seo_description || null,
  };
}
