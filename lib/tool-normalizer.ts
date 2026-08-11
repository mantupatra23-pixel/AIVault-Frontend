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

export function normalizeScore(rawScore: number | null | undefined): number {
  if (rawScore === null || rawScore === undefined || isNaN(rawScore)) return 85;
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

export function generateToolSpecificEnrichment(raw: Partial<DatabaseToolRecord>): Partial<DatabaseToolRecord> {
  const name = raw.name || "Tool";
  const category = raw.category || "General AI";
  const catLower = category.toLowerCase();

  return {
    description: raw.description || `${name} is an advanced AI software platform engineered to streamline ${catLower} workflows.`,
    who_should_use: `${name} is designed for developers, creators, and teams seeking efficient ${catLower} solutions.`,
    whoShouldUse: `${name} is designed for developers, creators, and teams seeking efficient ${catLower} solutions.`,
    features_pros: [
      { title: "Automated Workflow Optimization", description: `Streamlines complex ${catLower} tasks with intelligent AI processing.` },
      { title: "Scalable Architecture", description: "Engineered for high reliability, fast processing, and flexible workspace integration." },
      { title: "Intuitive Interface", description: "Clean dashboard design built for rapid onboarding and frictionless user workflows." }
    ],
    limitations_cons: [
      { title: "Internet Connection Required", description: "Requires an active cloud connection to process real-time AI requests." },
      { title: "Usage Limits on Base Tiers", description: "Free or starter tiers may impose rate limits during peak usage hours." }
    ],
    how_to_use: [
      `Visit the official platform portal for ${name}`,
      "Create or authenticate your user account",
      "Configure your workspace and project integration settings",
      "Execute your workflow and export generated outputs"
    ],
    use_cases: [`${category} Automation`, "Workflow Optimization", "Productivity Enhancement"],
    integrations: ["Web APIs", "Cloud Services"],
    pricing_details: `${name} operates under a ${raw.pricing || "Freemium"} model. Check the official portal for current plan pricing.`,
    operating_system: "Web / Cloud",
    deployment: "Hosted SaaS",
    license: "Proprietary",
    tags: ["AI", category, name],
    faqs: [
      { q: `What is ${name} used for?`, a: `${name} is an AI software platform specializing in ${catLower} capabilities.` },
      { q: `Is ${name} free to use?`, a: `${name} operates under a ${raw.pricing || "Freemium"} pricing model.` },
      { q: `Does ${name} require software installation?`, a: `Most ${catLower} operations run directly in cloud web browsers.` },
      { q: `Where can I access ${name}?`, a: `You can access the tool directly via its official portal.` }
    ],
    seo_title: `${name} Review, Features, Pricing & Guide | AI Vault`,
    seo_description: `Discover ${name} features, pros/cons, pricing options, and user guide on AI Vault.`
  };
}
