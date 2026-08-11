import { NormalizedTool, FAQItem, generateToolSpecificEnrichment } from "./tool-normalizer";

export function enrichMissingToolFields(tool: NormalizedTool): NormalizedTool {
  const generated = generateToolSpecificEnrichment(tool);

  const name = tool.name || "Tool";
  const category = tool.category || "Software";

  // Verified database values ALWAYS take priority over generated fallbacks
  const whoUse =
    tool.who_should_use ||
    tool.whoShouldUse ||
    generated.who_should_use ||
    generated.whoShouldUse ||
    `${name} is designed for developers, creators, and teams seeking efficient ${category.toLowerCase()} solutions.`;

  const faqsList: FAQItem[] =
    Array.isArray(tool.faqs) && tool.faqs.length > 0
      ? tool.faqs
      : (generated.faqs || [
          {
            q: `What is ${name} used for?`,
            a: `${name} is a platform specializing in ${category.toLowerCase()} capabilities.`,
          },
          {
            q: `What pricing model does ${name} offer?`,
            a: `${name} operates under a ${tool.pricing || "Freemium"} model.`,
          },
        ]);

  return {
    ...generated,
    ...tool,
    description: tool.description || tool.long_description || generated.description,
    features_pros: (Array.isArray(tool.features_pros) && tool.features_pros.length > 0) ? tool.features_pros : generated.features_pros,
    limitations_cons: (Array.isArray(tool.limitations_cons) && tool.limitations_cons.length > 0) ? tool.limitations_cons : generated.limitations_cons,
    who_should_use: whoUse,
    whoShouldUse: whoUse,
    how_to_use: (Array.isArray(tool.how_to_use) && tool.how_to_use.length > 0) ? tool.how_to_use : generated.how_to_use,
    use_cases: (Array.isArray(tool.use_cases) && tool.use_cases.length > 0) ? tool.use_cases : generated.use_cases,
    integrations: (Array.isArray(tool.integrations) && tool.integrations.length > 0) ? tool.integrations : generated.integrations,
    pricing_details: tool.pricing_details || generated.pricing_details,
    tags: (Array.isArray(tool.tags) && tool.tags.length > 0) ? tool.tags : generated.tags,
    faqs: faqsList,
    seo_title: tool.seo_title || generated.seo_title,
    seo_description: tool.seo_description || generated.seo_description,
  };
}
