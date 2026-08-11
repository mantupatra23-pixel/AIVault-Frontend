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
  license?: string | null;
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
      // Non-blocking
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

  if (slug === "ghost") {
    return {
      category: "Marketing / Publishing",
      pricing_model: "Open Source / Managed SaaS",
      description: "Ghost is an open-source, independent publishing platform designed for professional publishers, blogs, memberships, and email newsletters.",
      who_should_use: "Independent publishers, digital magazines, professional bloggers, newsletter creators, and media organizations.",
      whoShouldUse: "Independent publishers, digital magazines, professional bloggers, newsletter creators, and media organizations.",
      features_pros: [
        { title: "Open-Source Publishing Platform", description: "Fully independent publishing engine with total data ownership." },
        { title: "Built-In Membership & Subscriptions", description: "Native support for free and recurring paid member subscriptions with zero platform transaction fees." },
        { title: "Native Newsletter Publishing", description: "Delivers email newsletters directly to member lists upon post publication without third-party plugins." },
        { title: "Strong Editorial Experience", description: "Markdown and card-based rich media editor designed for distraction-free writing." },
        { title: "Self-Hosting Flexibility", description: "Can be self-hosted on Ubuntu/Debian servers or deployed on managed Ghost(Pro) hosting." }
      ],
      limitations_cons: [
        { title: "Self-Hosting Maintenance", description: "Self-hosted instances require Linux server management and system administration knowledge." },
        { title: "Advanced Customization Requirements", description: "Custom theme modifications require knowledge of Handlebars templates." },
        { title: "Email Delivery Setup", description: "Native newsletter dispatches on self-hosted builds require configuring a third-party transactional mail service like Mailgun." }
      ],
      how_to_use: [
        "Choose Ghost(Pro) managed cloud hosting or install the open-source software on a Ubuntu Linux server",
        "Configure publication settings, custom domain records, and site branding",
        "Set up member subscription tiers and connect Stripe for paid membership billing",
        "Create and publish articles with options to send them as email newsletters",
        "Manage integrations and custom Handlebars design themes"
      ],
      use_cases: [
        "Subscription Newsletters",
        "Digital Magazines",
        "Membership Websites",
        "Independent Publishing",
        "Paid Content"
      ],
      integrations: ["Stripe", "Zapier", "Unsplash", "Disqus", "Mailgun"],
      pricing_details: "Ghost open-source software is free to self-host. Ghost(Pro) offers fully managed cloud hosting starting at $9/month billed annually.",
      tags: ["CMS", "Blogging", "Publishing", "Newsletters", "Open Source"],
      faqs: [
        { q: "What is Ghost used for?", a: "Ghost is a dedicated publishing platform built for modern blogs, online publications, and subscription email newsletters." },
        { q: "Is Ghost free?", a: "The core Ghost software is 100% free open-source software to self-host. Ghost(Pro) is a paid managed hosting service." },
        { q: "Can Ghost be self-hosted?", a: "Yes, Ghost can be self-hosted on Linux servers using Node.js and MySQL." },
        { q: "Does Ghost support newsletters?", a: "Yes, Ghost natively dispatches email newsletters directly to registered subscribers." },
        { q: "Does Ghost support memberships?", a: "Yes, Ghost includes native member management for free and paid membership tiers." },
        { q: "What is Ghost(Pro)?", a: "Ghost(Pro) is the official fully managed cloud hosting service provided directly by the Ghost Foundation." }
      ],
      operating_system: "Web / Linux (Node.js & MySQL)",
      deployment: "Self-Hosted / Managed SaaS",
      license: "MIT Open Source",
      seo_title: "Ghost Review, Features, Pricing & Guide | AI Vault",
      seo_description: "Discover Ghost publishing features, native newsletter capabilities, self-hosting details, and pricing on AI Vault."
    };
  }

  if (slug === "nylas-cli") {
    return {
      category: "Developer Tools",
      pricing_model: "Free / Open Source Utility",
      description: "Nylas CLI is a developer-first command-line interface for testing, managing, and interacting with Nylas Communications APIs directly from terminal sessions.",
      who_should_use: "Backend developers, API integration engineers, and software engineering teams connecting Email, Calendar, or Contacts APIs.",
      whoShouldUse: "Backend developers, API integration engineers, and software engineering teams connecting Email, Calendar, or Contacts APIs.",
      features_pros: [
        { title: "Terminal API Testing", description: "Inspect and execute queries for Email, Calendar, and Contacts APIs directly from command lines." },
        { title: "Local Webhook Tunneling", description: "Generate local forwarding tunnels to capture and test incoming API webhook events during active development." },
        { title: "OAuth Grant Inspection", description: "Manage test account authentication grants, access tokens, and API credentials via CLI commands." },
        { title: "Rapid Integration Workflow", description: "Accelerates local debugging of Nylas integration code before production deployment." }
      ],
      limitations_cons: [
        { title: "Developer-Focused Tooling", description: "Requires familiarity with command-line interfaces and API development concepts." },
        { title: "Nylas Account Requirement", description: "Requires an active Nylas developer account and client credentials for API operations." },
        { title: "Platform Dependency", description: "All API operations depend on the availability of the underlying Nylas Communications platform." }
      ],
      how_to_use: [
        "Install Nylas CLI via Homebrew (`brew install nylas/nylas-cli/nylas`) or npm",
        "Authenticate using your Nylas developer account credentials (`nylas login`)",
        "Configure required API and application scope settings",
        "Use CLI commands and local tunnels (`nylas tunnels create`) to test API or webhook workflows"
      ],
      use_cases: [
        "API Debugging",
        "Webhook Testing",
        "Email API Testing",
        "Calendar API Testing",
        "OAuth Testing"
      ],
      integrations: ["Nylas API", "Node.js", "Terminal", "Webhooks"],
      pricing_details: "Nylas CLI is free open-source software. Usage of underlying Nylas platform APIs follows standard Nylas platform pricing plans.",
      tags: ["Developer Tools", "CLI", "Email API", "Calendar API", "Webhooks"],
      faqs: [
        { q: "What is Nylas CLI?", a: "Nylas CLI is a command-line tool built to accelerate development, local testing, and debugging with Nylas Communications APIs." },
        { q: "How do I install Nylas CLI?", a: "You can install it using Homebrew on macOS/Linux (`brew install nylas/nylas-cli/nylas`) or via npm." },
        { q: "Can Nylas CLI test webhooks locally?", a: "Yes, Nylas CLI includes built-in tunneling commands to forward live webhooks to your local dev environment." },
        { q: "Which Nylas APIs can I work with?", a: "It supports Email, Calendar, Contacts, and OAuth Grant management APIs." },
        { q: "Does Nylas CLI require a Nylas account?", a: "Yes, an active Nylas developer account is required to authenticate and interact with API endpoints." },
        { q: "Is Nylas CLI free?", a: "Yes, the CLI utility itself is completely free to install and run." }
      ],
      operating_system: "macOS / Linux / Windows (Node.js)",
      deployment: "Local CLI / Developer Tooling",
      license: "MIT Open Source",
      seo_title: "Nylas CLI Review, Commands & Developer Setup | AI Vault",
      seo_description: "Discover Nylas CLI features, terminal commands, webhook tunneling, and developer setup instructions on AI Vault."
    };
  }

  return {};
}
