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
  pricing_details?: any;
  website_url?: string | null;
  affiliate_url?: string | null;
  image_url?: string | null;
  logo_url?: string | null;
  youtube_id?: string | null;
  score?: number | null;
  rating?: number | null;
  features_pros?: FormattedListItem[] | null;
  limitations_cons?: FormattedListItem[] | null;
  pros_cons?: any;
  who_should_use?: any;
  how_to_use?: string[] | null;
  tags?: string[] | null;
  faqs?: FAQItem[] | null;
  seo_title?: string | null;
  seo_description?: string | null;
  created_at?: string;
}

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
      const parsed = JSON.parse(textInput) as Record<string, any>;
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

  return {
    who_should_use: `${name} is designed for professionals, developers, and teams seeking efficient ${category.toLowerCase()} solutions.`,
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
