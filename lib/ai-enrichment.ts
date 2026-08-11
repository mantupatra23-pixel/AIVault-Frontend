import { NormalizedTool, generateToolSpecificEnrichment } from "./tool-normalizer";

export function enrichMissingToolFields(tool: NormalizedTool): NormalizedTool {
  const generated = generateToolSpecificEnrichment(tool);

  const whoUse =
    tool.who_should_use ||
    tool.whoShouldUse ||
    generated.who_should_use ||
    generated.whoShouldUse ||
    null;

  return {
    ...generated,
    ...tool,
    description: tool.description || tool.long_description || generated.description || null,
    features_pros: (Array.isArray(tool.features_pros) && tool.features_pros.length > 0) ? tool.features_pros : (generated.features_pros || null),
    limitations_cons: (Array.isArray(tool.limitations_cons) && tool.limitations_cons.length > 0) ? tool.limitations_cons : (generated.limitations_cons || null),
    who_should_use: whoUse,
    whoShouldUse: whoUse,
    how_to_use: (Array.isArray(tool.how_to_use) && tool.how_to_use.length > 0) ? tool.how_to_use : (generated.how_to_use || null),
    use_cases: (Array.isArray(tool.use_cases) && tool.use_cases.length > 0) ? tool.use_cases : (generated.use_cases || null),
    integrations: (Array.isArray(tool.integrations) && tool.integrations.length > 0) ? tool.integrations : (generated.integrations || null),
    pricing_details: tool.pricing_details || generated.pricing_details || null,
    tags: (Array.isArray(tool.tags) && tool.tags.length > 0) ? tool.tags : (generated.tags || null),
    faqs: (Array.isArray(tool.faqs) && tool.faqs.length > 0) ? tool.faqs : (generated.faqs || null),
    seo_title: tool.seo_title || generated.seo_title || null,
    seo_description: tool.seo_description || generated.seo_description || null,
  };
}
