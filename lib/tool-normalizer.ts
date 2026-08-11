import { SITE_URL } from "@/lib/site-url";

export interface FormattedListItem {
  title?: string;
  description: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface NormalizedTool {
  id: string;
  name: string;
  slug: string;
  category: string;
  pricingModel: "Free" | "Freemium" | "Paid" | "Open Source" | "Free Trial" | "Contact Sales";
  pricingDetails: string | null;
  description: string;
  shortDescription: string;
  pros: FormattedListItem[];
  cons: FormattedListItem[];
  whoShouldUse: string | null;
  howToUse: string[] | null;
  faqs: FAQItem[] | null;
  tags: string[];
  editorialScore: number | null;
  officialUrl: string;
  affiliateUrl: string | null;
  youtubeVideoId: string | null;
  seoTitle: string;
  seoDescription: string;
  dataSources: {
    overview: "database" | "verified" | "ai_generated";
    prosCons: "database" | "verified" | "ai_generated";
    metadata: "database" | "verified" | "ai_generated";
  };
}

/**
 * Validates HTTP/HTTPS URLs to prevent XSS/javascript: injection
 */
export function sanitizeUrl(url: any): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return null;
}

/**
 * Extracts YouTube Video ID from YouTube URLs
 */
export function extractYouTubeId(urlStr: any): string | null {
  const url = sanitizeUrl(urlStr);
  if (!url) return null;

  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  } catch {
    return null;
  }
}

/**
 * Safely parses any text/JSON format inside `pros_cons`
 */
export function parseProsConsColumn(input: any): { pros: FormattedListItem[]; cons: FormattedListItem[] } {
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

  // Case A: Structured JS Object
  if (typeof input === "object" && input !== null && !Array.isArray(input)) {
    const pros = Array.isArray(input.pros) ? input.pros : input.pros ? [String(input.pros)] : [];
    const cons = Array.isArray(input.cons) ? input.cons : input.cons ? [String(input.cons)] : [];
    return { pros: cleanLines(pros), cons: cleanLines(cons) };
  }

  let textInput = "";
  if (Array.isArray(input)) {
    textInput = input.join("\n");
  } else if (typeof input === "string") {
    textInput = input.trim();
  }

  // Case B: Serialized JSON
  if (textInput.startsWith("{") && textInput.endsWith("}")) {
    try {
      const parsed = JSON.parse(textInput);
      if (parsed.pros || parsed.cons) {
        return parseProsConsColumn(parsed);
      }
    } catch {
      // Fallback to text parsing
    }
  }

  // Case C: Newline/Header Split ("Pros:" and "Cons:")
  if (/Cons:|CONS:/i.test(textInput)) {
    const parts = textInput.split(/Cons:|CONS:/i);
    const prosText = parts[0].replace(/Pros:|PROS:/i, "").trim();
    const consText = parts.slice(1).join("\n").trim();

    return {
      pros: cleanLines(prosText.split(/\n|•|\*/)),
      cons: cleanLines(consText.split(/\n|•|\*/)),
    };
  }

  // Case D: Single List
  return {
    pros: cleanLines(textInput.split(/\n|•|\*/)),
    cons: [],
  };
}

/**
 * Standardize Pricing Model Enums
 */
function normalizePricingModel(rawPricing?: string): "Free" | "Freemium" | "Paid" | "Open Source" | "Free Trial" | "Contact Sales" {
  if (!rawPricing) return "Paid";
  const p = rawPricing.toLowerCase();
  if (p.includes("open source")) return "Open Source";
  if (p.includes("freemium")) return "Freemium";
  if (p.includes("free trial")) return "Free Trial";
  if (p.includes("free") && !p.includes("paid")) return "Free";
  if (p.includes("contact") || p.includes("enterprise")) return "Contact Sales";
  return "Paid";
}

/**
 * Central Tool Normalizer Component
 */
export function normalizeTool(raw: any): NormalizedTool {
  if (!raw || typeof raw !== "object") {
    throw new Error("[NORMALIZER_ERROR] Invalid raw tool object");
  }

  const name = String(raw.name || "Software Tool").trim();
  const slug = String(raw.slug || "").trim().toLowerCase();
  const category = String(raw.category || "Software & AI").trim();

  // Parse Pros & Cons from `pros_cons` or legacy columns
  const { pros, cons } = parseProsConsColumn(raw.pros_cons || raw.pros || raw.cons);

  // Description prioritization
  const description = String(
    raw.description || raw.seo_description || raw.meta_description || ""
  ).trim();

  const shortDescription = description
    ? description.slice(0, 160).replace(/(<([^>]+)>)/gi, "") + (description.length > 160 ? "..." : "")
    : `${name} is a software platform designed for ${category} operations.`;

  // Parse URLs
  const officialUrl = sanitizeUrl(raw.website_url || raw.official_url || raw.url) || "#";
  const affiliateUrl = sanitizeUrl(raw.affiliate_url || raw.sponsored_url);
  const youtubeVideoId = extractYouTubeId(raw.youtube_url || raw.video_url || raw.youtube_id);

  // Parse Tags
  let tags: string[] = [category, "AI", "Software"];
  if (Array.isArray(raw.tags)) {
    tags = raw.tags.map((t: any) => String(t).trim()).filter(Boolean);
  } else if (typeof raw.tags === "string") {
    tags = raw.tags.split(",").map((t) => t.trim()).filter(Boolean);
  }

  // Parse FAQs
  let faqs: FAQItem[] | null = null;
  if (Array.isArray(raw.faqs) && raw.faqs.length > 0) {
    faqs = raw.faqs.map((f: any) => ({
      q: String(f.q || f.question || "").trim(),
      a: String(f.a || f.answer || "").trim(),
    })).filter((f: FAQItem) => f.q && f.a);
  }

  // Score handling (0 - 10)
  const rawScore = Number(raw.score || raw.neural_score || raw.rating);
  const editorialScore = !isNaN(rawScore) && rawScore > 0 ? Number(rawScore.toFixed(1)) : null;

  return {
    id: String(raw.id || slug),
    name,
    slug,
    category,
    pricingModel: normalizePricingModel(raw.pricing),
    pricingDetails: raw.pricing ? String(raw.pricing).trim() : null,
    description: description || `${name} provides specialized capabilities in the ${category} domain.`,
    shortDescription,
    pros,
    cons,
    whoShouldUse: raw.who_should_use ? String(raw.who_should_use).trim() : null,
    howToUse: Array.isArray(raw.how_to_use) ? raw.how_to_use.map(String) : null,
    faqs,
    tags: Array.from(new Set(tags)),
    editorialScore,
    officialUrl,
    affiliateUrl,
    youtubeVideoId,
    seoTitle: raw.meta_title || `${name} — Features, Pricing & Alternatives | AI Vault`,
    seoDescription: raw.meta_description || shortDescription,
    dataSources: {
      overview: raw.description ? "database" : "ai_generated",
      prosCons: pros.length > 0 || cons.length > 0 ? "database" : "ai_generated",
      metadata: "database",
    },
  };
}
