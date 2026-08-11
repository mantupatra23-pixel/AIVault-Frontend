export interface FormattedListItem {
  title?: string;
  description: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface DatabaseToolRecord {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  description?: string | null;
  pricing?: string | null;
  pricing_details?: unknown;
  pricingDetails?: unknown;
  website_url?: string | null;
  websiteUrl?: string | null;
  affiliate_url?: string | null;
  affiliateUrl?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  logo_url?: string | null;
  logoUrl?: string | null;
  youtube_id?: string | null;
  youtubeId?: string | null;
  score?: number | null;
  rating?: number | null;
  features_pros?: FormattedListItem[] | null;
  featuresPros?: FormattedListItem[] | null;
  limitations_cons?: FormattedListItem[] | null;
  limitationsCons?: FormattedListItem[] | null;
  pros_cons?: unknown;
  prosCons?: unknown;
  who_should_use?: string | string[] | null;
  whoShouldUse?: string | string[] | null;
  how_to_use?: string[] | null;
  howToUse?: string[] | null;
  tags?: string[] | null;
  faqs?: FAQItem[] | null;
  seo_title?: string | null;
  seoTitle?: string | null;
  seo_description?: string | null;
  seoDescription?: string | null;
  created_at?: string;
  createdAt?: string;
}

// Canonical NormalizedTool interface used across the entire platform
export type NormalizedTool = DatabaseToolRecord;

export function sanitizeUrl(url: unknown): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return null;
}

export function extractYouTubeId(urlStr: string | null | undefined): string | null {
  if (!urlStr) return null;
  const trimmed = urlStr.trim();
  if (trimmed.length === 11 && !trimmed.includes("/")) return trimmed;

  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = trimmed.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  } catch {
    return null;
  }
}

export function normalizeScore(rawScore: number | null | undefined): number | null {
  if (rawScore === null || rawScore === undefined || isNaN(rawScore)) return null;
  const val = Number(rawScore);
  if (val > 10 && val <= 100) return Math.round(val);
  if (val <= 10 && val > 0) return Math.round(val * 10);
  return 85;
}

export function parseProsConsColumn(input: unknown): { pros: FormattedListItem[]; cons: FormattedListItem[] } {
  if (!input) return { pros: [], cons: [] };

  const cleanLines = (lines: string[]): FormattedListItem[] => {
    return lines
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean)
      .map((cleanLine) => {
        if (cleanLine.includes(":") || cleanLine.includes("-")) {
          const parts = cleanLine.split(/:(.+)|-(.+)/);
          if (parts.length >= 2 && parts[1]) {
            return { title: parts[0].trim(), description: parts[1].trim() };
          }
        }
        return { description: cleanLine };
      });
  };

  if (typeof input === "object" && input !== null && !Array.isArray(input)) {
    const obj = input as Record<string, unknown>;
    const pros = Array.isArray(obj.pros) ? (obj.pros as string[]) : [];
    const cons = Array.isArray(obj.cons) ? (obj.cons as string[]) : [];
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

export function generateToolSpecificEnrichment(raw: Partial<DatabaseToolRecord>): Partial<DatabaseToolRecord> {
  const slug = (raw.slug || "").toLowerCase().trim();
  const name = raw.name || "Tool";
  const category = raw.category || "Software";

  if (slug === "ghost") {
    return {
      description: "Ghost is an open-source, independent publishing platform for professional creators, bloggers, and media businesses.",
      features_pros: [
        { title: "Native Newsletter Distribution", description: "Built-in email newsletter delivery directly integrated with content publishing." },
        { title: "Membership Monetization", description: "Native support for free and paid member subscriptions with zero platform fees." },
        { title: "Modern Publishing Editor", description: "Distraction-free Markdown and card-based rich media editing experience." },
        { title: "Custom Handlebars Themes", description: "Full design control with extensible custom theme development engine." },
        { title: "Headless Content APIs", description: "REST and GraphQL APIs to use Ghost as a headless CMS for any frontend stack." },
      ],
      limitations_cons: [
        { title: "Technical Self-Hosting", description: "Self-hosted instances require Server/Linux system administration skills." },
        { title: "Plugin Ecosystem", description: "Fewer marketplace plugins compared to traditional CMS platforms like WordPress." },
      ],
      who_should_use: "Independent publishers, bloggers, newsletter creators, and media organizations.",
      whoShouldUse: "Independent publishers, bloggers, newsletter creators, and media organizations.",
      how_to_use: [
        "Create a Ghost publication on managed Ghost Pro or setup a self-hosted instance",
        "Configure custom domain settings, publication design, and branding options",
        "Draft and format articles or newsletter broadcasts inside the editor",
        "Establish free and paid subscription membership tiers",
        "Publish posts directly to the web and send newsletter issues to subscribers"
      ],
      pricing_details: {
        model: "Paid / Open Source",
        note: "Ghost open-source software is free to self-host. Managed Ghost Pro hosting plans start with scalable tiers based on member size."
      },
      tags: ["CMS", "Blogging", "Publishing", "Newsletters", "Open Source"],
      faqs: [
        { q: "What is Ghost used for?", a: "Ghost is a publishing platform designed for modern online blogs, magazines, and subscription newsletters." },
        { q: "Is Ghost free or paid?", a: "The software is 100% open-source and free to self-host. Ghost Pro offers fully managed paid cloud hosting." },
        { q: "Does Ghost support native email newsletters?", a: "Yes, Ghost natively sends email newsletters directly to member lists without third-party email plugins." }
      ],
      seo_title: "Ghost Review, Pricing, Features & Alternatives | AI Vault",
      seo_description: "Discover Ghost features, pricing details, pros/cons, and publishing capabilities on AI Vault.",
    };
  }

  if (slug === "nylas-cli") {
    return {
      description: "Nylas CLI is a developer-first command-line interface for testing, managing, and interacting with Nylas Communications APIs directly from your terminal.",
      features_pros: [
        { title: "Terminal-Native API Access", description: "Interact with Email, Calendar, and Contacts APIs directly from local CLI sessions." },
        { title: "Webhook Testing & Tunnels", description: "Local tunnel generation to test incoming API webhooks during development." },
        { title: "OAuth Authentication Management", description: "Streamlined authentication grants and access token management for test accounts." },
      ],
      limitations_cons: [
        { title: "Command Line Only", description: "Requires familiarity with terminal commands and API development." },
        { title: "Requires Nylas Account", description: "Requires an active Nylas developer account and API credentials." },
      ],
      who_should_use: "Backend developers, API engineers, and software teams integrating Nylas communication features.",
      whoShouldUse: "Backend developers, API engineers, and software teams integrating Nylas communication features.",
      how_to_use: [
        "Install Nylas CLI via npm or brew in your terminal",
        "Authenticate with your Nylas developer credentials (`nylas login`)",
        "Configure local application scopes and API keys",
        "Test email, calendar, and webhook triggers directly from CLI scripts"
      ],
      pricing_details: {
        model: "Free / Developer Utility",
        note: "Nylas CLI is free open-source software. Usage of underlying Nylas APIs follows standard Nylas platform developer tiers."
      },
      tags: ["Developer Tools", "CLI", "Email API", "Calendar API", "Webhooks"],
      faqs: [
        { q: "What is Nylas CLI?", a: "Nylas CLI is a terminal utility designed to accelerate development and debugging with Nylas Communications APIs." },
        { q: "Is Nylas CLI free to use?", a: "Yes, the CLI tool is free for developer workflow testing." }
      ],
      seo_title: "Nylas CLI Review, Features & Developer Guide | AI Vault",
      seo_description: "Discover Nylas CLI features, developer usage steps, and API testing capabilities on AI Vault.",
    };
  }

  const defaultWho = `${name} is designed for professionals, developers, and teams seeking efficient ${category.toLowerCase()} solutions.`;

  return {
    who_should_use: defaultWho,
    whoShouldUse: defaultWho,
    how_to_use: [
      `Visit the official platform portal for ${name}`,
      "Create or authenticate your account credentials",
      "Configure project workspace settings for your team",
      "Execute your workflow and export or integrate results"
    ],
    pricing_details: {
      model: raw.pricing || "Freemium",
      note: `${name} is listed under a ${raw.pricing || "Freemium"} model.`
    },
    tags: [category.toLowerCase(), name.toLowerCase(), "Software", "AI Tools"],
    faqs: [
      { q: `What is ${name} used for?`, a: `${name} is a software platform specializing in ${category.toLowerCase()} capabilities.` },
      { q: `What pricing model does ${name} offer?`, a: `${name} operates under a ${raw.pricing || "Freemium"} plan model.` }
    ],
    seo_title: `${name} Review, Pricing, Features & Alternatives | AI Vault`,
    seo_description: `Discover ${name} features, pricing options, pros/cons, and alternative tools on AI Vault.`,
  };
}
