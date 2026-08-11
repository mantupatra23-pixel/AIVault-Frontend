import { NormalizedTool, FAQItem, FormattedListItem } from "./tool-normalizer";

/**
 * Deterministically enriches missing tool fields using category & description metadata.
 * Does NOT overwrite valid database entries.
 */
export function enrichMissingToolFields(tool: NormalizedTool): NormalizedTool {
  const enriched = { ...tool };

  // 1. Enrich `whoShouldUse`
  if (!enriched.whoShouldUse) {
    const cat = enriched.category.toLowerCase();
    const name = enriched.name;
    if (cat.includes("code") || cat.includes("dev") || cat.includes("cli")) {
      enriched.whoShouldUse = `${name} is best suited for software developers, DevOps engineers, and technical teams looking to streamline build, terminal, or API workflows.`;
    } else if (cat.includes("publish") || cat.includes("blog") || cat.includes("cms") || cat.includes("content")) {
      enriched.whoShouldUse = `${name} is designed for independent creators, bloggers, media organizations, and newsletter publishers building a digital audience and membership site.`;
    } else if (cat.includes("design") || cat.includes("video") || cat.includes("image") || cat.includes("media")) {
      enriched.whoShouldUse = `${name} is intended for digital artists, designers, video editors, and content marketers generating media assets.`;
    } else {
      enriched.whoShouldUse = `${name} is suited for professionals, creators, and growth teams managing digital operations in the ${enriched.category} field.`;
    }
  }

  // 2. Enrich `howToUse`
  if (!enriched.howToUse || enriched.howToUse.length === 0) {
    const cat = enriched.category.toLowerCase();
    const name = enriched.name;
    if (cat.includes("code") || cat.includes("dev") || cat.includes("cli")) {
      enriched.howToUse = [
        `Install or access ${name} via your developer environment, package manager, or command-line interface.`,
        `Configure environment variables and authenticate API credentials as required.`,
        `Execute CLI commands or call SDK libraries directly within your codebase.`,
        `Inspect terminal logs, verify build outputs, and deploy to your project environment.`
      ];
    } else if (cat.includes("publish") || cat.includes("blog") || cat.includes("cms")) {
      enriched.howToUse = [
        `Set up your ${name} instance via cloud hosting or self-hosted deployment.`,
        `Configure your domain, site branding, custom themes, and membership subscription settings.`,
        `Draft, format, and organize your posts or newsletter broadcasts using the content editor.`,
        `Publish articles directly to the web and manage your email subscriber list.`
      ];
    } else {
      enriched.howToUse = [
        `Access the official ${name} platform using the link provided on this page.`,
        `Sign up or authenticate your user account on the portal.`,
        `Configure project parameters and workspace settings for your task.`,
        `Execute your workflow and export or integrate generated results.`
      ];
    }
  }

  // 3. Enrich `faqs`
  if (!enriched.faqs || enriched.faqs.length === 0) {
    enriched.faqs = [
      {
        q: `What primary function does ${enriched.name} serve?`,
        a: `${enriched.name} is a platform built for ${enriched.category} workflows, assisting users with domain-specific automation.`
      },
      {
        q: `What is ${enriched.name}'s pricing structure?`,
        a: enriched.pricingDetails
          ? `${enriched.name} is offered under a ${enriched.pricingModel} model: ${enriched.pricingDetails}`
          : `Pricing details vary. Check the official website for current plans and tier limits.`
      },
      {
        q: `Who should use ${enriched.name}?`,
        a: enriched.whoShouldUse
      }
    ];
  }

  // 4. Enrich `pros` if completely empty
  if (enriched.pros.length === 0) {
    enriched.pros = [
      { description: `Specialized tooling for ${enriched.category} workflows.` },
      { description: `Streamlined platform interface for individual and team deployment.` }
    ];
  }

  return enriched;
}
