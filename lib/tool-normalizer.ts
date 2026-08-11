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
  long_description?: string | null;
  pricing?: string | null;
  pricing_model?: string | null;
  pricing_details?: unknown;
  pricingDetails?: unknown;
  pricing_plans?: unknown;
  website_url?: string | null;
  websiteUrl?: string | null;
  affiliate_url?: string | null;
  affiliateUrl?: string | null;
  pricing_url?: string | null;
  documentation_url?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  logo_url?: string | null;
  logoUrl?: string | null;
  youtube_id?: string | null;
  youtube_url?: string | null;
  youtubeId?: string | null;
  score?: number | null;
  rating?: number | null;
  features_pros?: FormattedListItem[] | null;
  featuresPros?: FormattedListItem[] | null;
  limitations_cons?: FormattedListItem[] | null;
  limitationsCons?: FormattedListItem[] | null;
  pros_cons?: unknown;
  who_should_use?: string | string[] | null;
  whoShouldUse?: string | string[] | null;
  how_to_use?: string[] | null;
  howToUse?: string[] | null;
  use_cases?: string[] | null;
  integrations?: string[] | null;
  platforms?: string[] | null;
  operating_system?: string | null;
  deployment?: string | null;
  tags?: string[] | null;
  faqs?: FAQItem[] | null;
  seo_title?: string | null;
  seoTitle?: string | null;
  seo_description?: string | null;
  seoDescription?: string | null;
  created_at?: string;
  createdAt?: string;
}

export type NormalizedTool = DatabaseToolRecord;

export function sanitizeUrl(url: unknown): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return null;
}

export function extractYouTubeId(urlOrId: string | null | undefined): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
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
  return null;
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
      // Non-blocking fallback
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

// Clean, factual enrichment lookup with NO generic fallback text
export function generateToolSpecificEnrichment(raw: Partial<DatabaseToolRecord>): Partial<DatabaseToolRecord> {
  const slug = (raw.slug || "").toLowerCase().trim();

  if (slug === "ghost") {
    return {
      description: "Ghost is an open-source, independent publishing platform designed for professional publishers, blogs, memberships, and email newsletters.",
      who_should_use: "Independent publishers, digital magazines, professional bloggers, newsletter creators, and media organizations.",
      whoShouldUse: "Independent publishers, digital magazines, professional bloggers, newsletter creators, and media organizations.",
      features_pros: [
        { title: "Native Newsletter Distribution", description: "Delivers email newsletters directly to member lists upon post publication without third-party email plugins." },
        { title: "Membership & Subscriptions", description: "Built-in support for free and recurring paid member subscriptions with zero platform transaction fees." },
        { title: "Modern Publishing Editor", description: "Card-based rich media and Markdown editor designed for distraction-free content creation." },
        { title: "Custom Handlebars Themes", description: "Extensible theme engine allowing complete front-end design customization." },
        { title: "Headless Content API", description: "REST and GraphQL Content/Admin APIs to power custom mobile apps or Jamstack frontends." },
      ],
      limitations_cons: [
        { title: "Self-Hosting Administration", description: "Self-hosted instances require Linux server management and system administration skills." },
        { title: "Smaller Plugin Directory", description: "Fewer pre-built marketplace extensions compared to traditional CMS platforms like WordPress." },
      ],
      how_to_use: [
        "Sign up for a managed Ghost(Pro) account or deploy the open-source software on a Ubuntu/Debian server",
        "Configure custom domain settings, publication branding, and member signup rules",
        "Create subscription access tiers and connect Stripe for membership payment processing",
        "Draft articles in the editor and select web publishing, email newsletter dispatch, or both",
        "Track subscriber growth, engagement metrics, and recurring revenue directly from the dashboard"
      ],
      use_cases: ["Subscription Newsletters", "Digital Magazines", "Personal Blogs", "Independent Publications"],
      integrations: ["Stripe", "Zapier", "Unsplash", "Disqus", "Analytics"],
      pricing_details: "Ghost open-source core software is 100% free to self-host. Ghost(Pro) offers fully managed cloud hosting starting at $9/month billed annually.",
      tags: ["CMS", "Blogging", "Publishing", "Newsletters", "Open Source"],
      faqs: [
        { q: "What is Ghost?", a: "Ghost is a dedicated publishing platform built specifically for blogging, online magazines, and subscription email newsletters." },
        { q: "Is Ghost free or paid?", a: "The core Ghost software is free open-source software for self-hosting. Ghost(Pro) provides paid managed hosting." },
        { q: "Does Ghost support email newsletters natively?", a: "Yes, Ghost includes built-in email newsletter delivery powered by Mailgun integration without extra plugins." },
        { q: "Can I self-host Ghost on my own server?", a: "Yes, Ghost can be installed on any Linux server (recommended: Ubuntu with Node.js and MySQL)." },
        { q: "What is Ghost(Pro)?", a: "Ghost(Pro) is the official fully managed cloud hosting service managed directly by the Ghost foundation." }
      ],
      seo_title: "Ghost Review, Features, Pricing & Guide | AI Vault",
      seo_description: "Discover Ghost publishing features, native newsletter capabilities, self-hosting details, and pricing on AI Vault.",
    };
  }

  if (slug === "nylas-cli") {
    return {
      description: "Nylas CLI is a developer-first command-line interface for testing, managing, and interacting with Nylas Communications APIs directly from terminal sessions.",
      who_should_use: "Backend developers, API integration engineers, and software engineering teams connecting Email, Calendar, or Contacts APIs.",
      whoShouldUse: "Backend developers, API integration engineers, and software engineering teams connecting Email, Calendar, or Contacts APIs.",
      features_pros: [
        { title: "Terminal API Testing", description: "Execute queries and inspect payloads for Email, Calendar, and Contacts APIs directly from local command lines." },
        { title: "Local Webhook Tunnels", description: "Generate local forwarding tunnels to capture and test incoming API webhook events during active development." },
        { title: "OAuth Grant Inspection", description: "Manage test account authentication grants, access tokens, and API credentials via terminal commands." },
      ],
      limitations_cons: [
        { title: "Requires Terminal Expertise", description: "Designed purely for command-line workflows and API developers." },
        { title: "Nylas Developer Account Dependency", description: "Requires an active Nylas developer account and client credentials." },
      ],
      how_to_use: [
        "Install the CLI globally via Homebrew (`brew install nylas/nylas-cli/nylas`) or npm",
        "Authenticate using your Nylas developer credentials (`nylas login`)",
        "Generate a local webhook tunnel using `nylas tunnels create` to inspect live webhook payloads",
        "Test email sending, calendar event creation, and grant retrieval from terminal scripts"
      ],
      use_cases: ["API Debugging", "Local Webhook Tunneling", "OAuth Grant Testing", "Email Sync Inspection"],
      integrations: ["Nylas API", "Node.js", "Terminal", "Webhooks"],
      pricing_details: "Nylas CLI is free open-source software. Usage of the underlying Nylas Communications platform follows standard Nylas API developer pricing tiers.",
      tags: ["Developer Tools", "CLI", "Email API", "Calendar API", "Webhooks"],
      faqs: [
        { q: "What is Nylas CLI?", a: "Nylas CLI is a terminal utility engineered to accelerate development, local testing, and debugging with Nylas Communications APIs." },
        { q: "How do I install Nylas CLI?", a: "You can install it using Homebrew on macOS/Linux (`brew install nylas/nylas-cli/nylas`) or via npm." },
        { q: "Does Nylas CLI support local webhook testing?", a: "Yes, the CLI includes native tunnel commands (`nylas tunnels create`) to forward live webhook events to your local dev server." },
        { q: "Does Nylas CLI work with all Nylas APIs?", a: "Yes, it supports testing and payload inspection for Email, Calendar, Contacts, and OAuth Grant management APIs." },
        { q: "Is Nylas CLI free?", a: "Yes, the CLI tool itself is completely free to install and run." }
      ],
      seo_title: "Nylas CLI Review, Commands & Developer Setup | AI Vault",
      seo_description: "Discover Nylas CLI features, terminal commands, webhook tunneling, and developer setup instructions on AI Vault.",
    };
  }

  // NO generic fallback text return for unlisted tools
  return {};
}
