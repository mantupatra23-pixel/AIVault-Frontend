import { NormalizedTool, FAQItem } from "./tool-normalizer";

export function enrichMissingToolFields(tool: NormalizedTool): NormalizedTool {
  const enriched = { ...tool };

  const name = enriched.name || "Tool";
  const category = enriched.category || "Software";

  if (!enriched.whoShouldUse && !enriched.who_should_use) {
    const defaultWho = `${name} is designed for professionals, developers, and teams looking for scalable ${category.toLowerCase()} solutions.`;
    enriched.whoShouldUse = defaultWho;
    enriched.who_should_use = defaultWho;
  }

  if (!enriched.description) {
    enriched.description = `${name} is a high-performance ${category.toLowerCase()} platform engineered to streamline workflows and boost productivity.`;
  }

  return enriched;
}
