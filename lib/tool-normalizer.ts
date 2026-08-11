import { DatabaseToolRecord, NormalizedTool, FormattedListItem, FAQItem } from "@/types/tool";

export function sanitizeUrl(url: unknown): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return null;
}

export function extractYouTubeId(urlStr: string | null, idStr: string | null): string | null {
  if (idStr && idStr.trim().length === 11) return idStr.trim();
  if (!urlStr) return null;

  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlStr.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  } catch {
    return null;
  }
}

export function normalizeScore(rawScore: number | null, rawNeural: number | null, rawRating: number | null): number | null {
  const val = Number(rawScore || rawNeural || rawRating);
  if (isNaN(val) || val <= 0) return null;
  if (val > 10 && val <= 100) return Number((val / 10).toFixed(1));
  if (val <= 10) return Number(val.toFixed(1));
  return 8.5;
}

export function parseProsConsColumn(input: unknown): { pros: FormattedListItem[]; cons: FormattedListItem[] } {
  if (!input) return { pros: [], cons: [] };

  const cleanLines = (lines: string[]): FormattedListItem[] => {
    return lines
      .map((line) => line.replace(/^\d+\.\s*/, "").replace(/^[•\*\-\s]+/, "").trim())
      .filter(Boolean)
      .map((cleanLine) => {
        if (cleanLine.includes(":") || cleanLine.includes(" - ")) {
          const parts = cleanLine.split(/:(.+)| - (.+)/).filter(Boolean);
          if (parts.length >= 2) {
            return { title: parts[0].trim(), description: parts.slice(1).join(" ").trim() };
          }
        }
        return { description: cleanLine };
      });
  };

  if (typeof input === "object" && input !== null && !Array.isArray(input)) {
    const obj = input as Record<string, unknown>;
    const pros = Array.isArray(obj.pros) ? obj.pros.map(String) : obj.pros ? [String(obj.pros)] : [];
    const cons = Array.isArray(obj.cons) ? obj.cons.map(String) : obj.cons ? [String(obj.cons)] : [];
    return { pros: cleanLines(pros), cons: cleanLines(cons) };
  }

  let textInput = "";
  if (Array.isArray(input)) {
    textInput = input.map(String).join("\n");
  } else if (typeof input === "string") {
    textInput = input.trim();
  }

  if (textInput.startsWith("{") && textInput.endsWith("}")) {
    try {
      const parsed = JSON.parse(textInput) as Record<string, unknown>;
      if (parsed.pros || parsed.cons) {
        return parseProsConsColumn(parsed);
      }
    } catch {
      // Fallback
    }
  }

  if (/Cons:|CONS:|Limitations:/i.test(textInput)) {
    const parts = textInput.split(/Cons:|CONS:|Limitations:/i);
    const prosText = parts[0].replace(/Pros:|PROS:|Features:/i, "").trim();
    const consText = parts.slice(1).join("\n").trim();

    return {
      pros: cleanLines(prosText.split(/\n|•|\*/)),
      cons: cleanLines(consText.split(/\n|•|\*/)),
    };
  }

  return {
    pros: cleanLines(textInput.split(/\n|•|\*/)),
    cons: [],
  };
}

/**
 * Generates factual, tool-specific fallback data ONLY when database fields are NULL.
 */
export function generateToolSpecificEnrichment(raw: DatabaseToolRecord): Partial<DatabaseToolRecord> {
  const slug = (raw.slug || "").toLowerCase().trim();
  const name = raw.name || "Tool";
  const category = raw.category || "Software";

  // Factual Override for Ghost
  if (slug === "ghost") {
    return {
      description: "Ghost is an open-source, independent publishing platform built on Node.js designed for professional creators, bloggers, newsletters, and online publications. It provides modern tools for subscription management, native newsletter delivery, custom Handlebars themes, and Stripe membership monetization.",
      features_pros: [
        { title: "Native Newsletter Distribution", description: "In-house email newsletter broadcasting and subscription management without third-party plugins." },
        { title: "Membership Monetization", description: "Built-in audience membership support integrated directly with Stripe payments." },
        { title: "Modern Publishing Editor", description: "Clean, card-based rich text and Markdown writing interface." },
        { title: "Custom Handlebars Themes", description: "Flexible Handlebars theme architecture for total visual control." },
        { title: "Headless Content APIs", description: "Full REST and GraphQL APIs for custom Jamstack integrations." }
      ],
      limitations_cons: [
        { title: "Technical Self-Hosting", description: "Self-hosting requires server configuration and Node.js maintenance knowledge." },
        { title: "Plugin Ecosystem", description: "Smaller plugin ecosystem compared to traditional platforms like WordPress." }
      ],
      who_should_use: "Independent publishers, bloggers, newsletter creators, journalists, media teams, and businesses building subscription membership platforms.",
      how_to_use: [
        "Create a Ghost publication on managed Ghost(Pro) or deploy the open-source package on a Node.js server.",
        "Configure custom domain settings, publication branding, and Handlebars design themes.",
        "Draft and format articles or newsletter broadcasts using the dynamic card editor.",
        "Establish free and paid subscription membership tiers connected to Stripe.",
        "Publish posts directly to the web and send automated newsletter broadcasts to subscribers."
      ],
      pricing_details: {
        model: "Paid / Open Source",
        note: "Ghost open-source software is free to self-host. Managed Ghost(Pro) starts at $9/mo based on audience size."
      },
      tags: ["CMS", "Blogging", "Publishing", "Newsletter", "Membership", "Node.js"],
      faqs: [
        { q: "What is Ghost used for?", a: "Ghost is used for running blogs, publishing email newsletters, managing subscriber tiers, and monetizing digital publications." },
        { q: "Is Ghost free or paid?", a: "Ghost is open-source and free to self-host. Managed hosting via Ghost(Pro) is a paid service based on subscriber count." },
        { q: "Does Ghost support native email newsletters?", a: "Yes, Ghost includes native email newsletter distribution and audience analytics out of the box." }
      ],
      seo_title: "Ghost Review, Pricing, Features & Alternatives | AI Vault",
      seo_description: "Discover Ghost features, pricing, pros, cons, use cases and alternatives on AI Vault."
    };
  }

  // Factual Override for Cursor
  if (slug === "cursor") {
    return {
      features_pros: [
        { title: "Codebase Indexing", description: "Deep local repository indexing for project-wide AI context." },
        { title: "VS Code Compatibility", description: "Native fork of VS Code supporting all existing extensions and keybindings." },
        { title: "Inline AI Editing", description: "Instant code generation and refactoring via Cmd+K." }
      ],
      limitations_cons: [
        { title: "Account Required", description: "Requires a Cursor account for fast cloud AI queries." }
      ],
      who_should_use: "Software engineers, web developers, and technical teams seeking an AI-first IDE fork of VS Code.",
      how_to_use: [
        "Download and install Cursor on macOS, Windows, or Linux.",
        "Import your existing VS Code settings and extensions.",
        "Index your local codebase repository for AI context.",
        "Use Cmd+K or Cmd+I for inline code generation and refactoring."
      ],
      pricing_details: {
        model: "Freemium",
        note: "Offers a free tier with monthly AI query allowances and Pro tiers for unlimited fast usage."
      },
      tags: ["IDE", "Developer Tools", "AI Code Assistant", "VS Code Fork"],
      faqs: [
        { q: "Is Cursor a plugin or an IDE?", a: "Cursor is a standalone desktop IDE forked directly from Visual Studio Code." }
      ],
      seo_title: "Cursor IDE Review, Pricing, Features & Alternatives | AI Vault",
      seo_description: "Discover Cursor IDE features, pricing, pros, cons, use cases and alternatives on AI Vault."
    };
  }

  // Generic Contextual Fallbacks for Unverified Records
  return {
    who_should_use: `${name} is designed for professionals, creators, and technical teams operating in the ${category} space.`,
    how_to_use: [
      `Visit the official platform portal for ${name}.`,
      "Create or authenticate your account credentials.",
      "Configure project workspace settings for your task.",
      "Execute your workflow and export or integrate generated outputs."
    ],
    pricing_details: {
      model: raw.pricing || "Freemium",
      note: `${name} is listed under a ${raw.pricing || "Freemium"} model. Check the official website for current plans and tier limits.`
    },
    tags: [category, name, "Software", "AI Tools"].map((t) => t.trim()).filter(Boolean),
    faqs: [
      { q: `What is ${name} used for?`, a: (raw.description || `${name} provides software functionality for ${category} operations.`) },
      { q: `What pricing model does ${name} offer?`, a: `${name} is listed under a ${raw.pricing || "Freemium"} model. Check official portal for active plans.` }
    ],
    seo_title: `${name} Review, Pricing, Features & Alternatives | AI Vault`,
    seo_description: (raw.description || `Discover ${name} features, pricing, pros, cons, and alternatives on AI Vault.`).slice(0, 155)
  };
}
