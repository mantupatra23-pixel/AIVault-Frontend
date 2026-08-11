import { NormalizedTool, FAQItem, FormattedListItem } from "./tool-normalizer";

export function enrichMissingToolFields(tool: NormalizedTool): NormalizedTool {
  const enriched: NormalizedTool = { ...tool };

  const name = enriched.name || "Tool";
  const category = enriched.category || "Software";

  // 1. Enrich whoShouldUse / who_should_use
  if (!enriched.whoShouldUse && !enriched.who_should_use) {
    const defaultWho = `${name} is designed for professionals, developers, and teams seeking efficient ${category.toLowerCase()} solutions.`;
    enriched.whoShouldUse = defaultWho;
    enriched.who_should_use = defaultWho;
  } else if (!enriched.whoShouldUse && enriched.who_should_use) {
    enriched.whoShouldUse = enriched.who_should_use;
  } else if (!enriched.who_should_use && enriched.whoShouldUse) {
    enriched.who_should_use = enriched.whoShouldUse;
  }

  // 2. Enrich Description
  if (!enriched.description) {
    enriched.description = `${name} is a high-performance ${category.toLowerCase()} platform engineered to streamline workflows and boost productivity.`;
  }

  // 3. Enrich Features & Pros
  if (!enriched.features_pros || enriched.features_pros.length === 0) {
    const defaultPros: FormattedListItem[] = [
      {
        title: "Automated Workflow Optimization",
        description: `Streamlines complex ${category.toLowerCase()} operations efficiently.`,
      },
      {
        title: "Intuitive Interface",
        description: "User-friendly dashboard for fast deployment and setup.",
      },
    ];
    enriched.features_pros = defaultPros;
    enriched.featuresPros = defaultPros;
  }

  // 4. Enrich Limitations & Cons
  if (!enriched.limitations_cons || enriched.limitations_cons.length === 0) {
    const defaultCons: FormattedListItem[] = [
      {
        title: "Internet Connection Required",
        description: "Requires active cloud connectivity for full real-time capabilities.",
      },
    ];
    enriched.limitations_cons = defaultCons;
    enriched.limitationsCons = defaultCons;
  }

  // 5. Enrich FAQs
  if (!enriched.faqs || enriched.faqs.length === 0) {
    const defaultFaqs: FAQItem[] = [
      {
        q: `What is ${name} used for?`,
        a: `${name} is an advanced software platform specializing in ${category.toLowerCase()} capabilities.`,
      },
      {
        q: `What pricing model does ${name} offer?`,
        a: `${name} operates under a ${enriched.pricing || "Freemium"} plan model.`,
      },
    ];
    enriched.faqs = defaultFaqs;
  }

  return enriched;
}
