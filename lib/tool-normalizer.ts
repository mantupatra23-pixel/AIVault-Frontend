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
export function sanitizeUrl(url: unknown): string | null {
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
export function extractYouTubeId(urlStr: unknown): string | null {
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

  // Case A: Structured JS Object
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

  // Case B: Serialized JSON
  if (textInput.startsWith("{") && textInput.endsWith("}")) {
    try {
      const parsed = JSON.parse(textInput) as Record<string, unknown>;
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
function normalizePricingModel(rawPricing?: unknown): "Free" | "Freemium" | "Paid" | "Open Source" | "Free Trial" | "Contact Sales" {
  if (!rawPricing || typeof rawPricing !== "string") return "Paid";
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
export function normalizeTool(raw: unknown): NormalizedTool {
  if (!raw || typeof raw !== "object") {
    throw new Error("[NORMALIZER_ERROR] Invalid raw tool object");
  }

  const tool = raw as Record<string, unknown>;

  const name = String(tool.name || "Software Tool").trim();
  const slug = String(tool.slug || "").trim().toLowerCase();
  const category = String(tool.category || "Software & AI").trim();

  // Parse Pros & Cons from `pros_cons` or legacy columns
  const { pros, cons } = parseProsConsColumn(tool.pros_cons || tool.pros || tool.cons);

  // Description prioritization
  const description = String(
    tool.description || tool.seo_description || tool.meta_description || ""
  ).trim();

  const shortDescription = description
    ? description.slice(0, 160).replace(/(<([^>]+)>)/gi, "") + (description.length > 160 ? "..." : "")
    : `${name} is a software platform designed for ${category} operations.`;

  // Parse URLs
  const officialUrl = sanitizeUrl(tool.website_url || tool.official_url || tool.url) || "#";
  const affiliateUrl = sanitizeUrl(tool.affiliate_url || tool.sponsored_url);
  const youtubeVideoId = extractYouTubeId(tool.youtube_url || tool.video_url || tool.youtube_id);

  // Strictly typed tags array parser (Fixes line 183 parameter type error)
  let tags: string[] = [category, "AI", "Software"];
  if (Array.isArray(tool.tags)) {
    tags = tool.tags.map((t: unknown) => String(t).trim()).filter(Boolean);
  } else if (typeof tool.tags === "string") {
    tags = tool.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
  }

  // Strictly typed FAQs parser
  let faqs: FAQItem[] | null = null;
  if (Array.isArray(tool.faqs) && tool.faqs.length > 0) {
    faqs = tool.faqs
      .map((f: unknown) => {
        if (f && typeof f === "object") {
          const item = f as Record<string, unknown>;
          return {
            q: String(item.q || item.question || "").trim(),
            a: String(item.a || item.answer || "").trim(),
          };
        }
        return { q: "", a: "" };
      })
      .filter((f: FAQItem) => f.q.length > 0 && f.a.length > 0);
  }

  // Score handling (0 - 10)
  const rawScore = Number(tool.score || tool.neural_score || tool.rating);
  const editorialScore = !isNaN(rawScore) && rawScore > 0 ? Number(rawScore.toFixed(1)) : null;

  return {
    id: String(tool.id || slug),
    name,
    slug,
    category,
    pricingModel: normalizePricingModel(tool.pricing),
    pricingDetails: tool.pricing ? String(tool.pricing).trim() : null,
    description: description || `${name} provides specialized capabilities in the ${category} domain.`,
    shortDescription,
    pros,
    cons,
    whoShouldUse: tool.who_should_use ? String(tool.who_should_use).trim() : null,
    howToUse: Array.isArray(tool.how_to_use) ? tool.how_to_use.map((item: unknown) => String(item)) : null,
    faqs,
    tags: Array.from(new Set(tags)),
    editorialScore,
    officialUrl,
    affiliateUrl,
    youtubeVideoId,
    seoTitle: typeof tool.meta_title === "string" ? tool.meta_title : `${name} — Features, Pricing & Alternatives | AI Vault`,
    seoDescription: typeof tool.meta_description === "string" ? tool.meta_description : shortDescription,
    dataSources: {
      overview: tool.description ? "database" : "ai_generated",
      prosCons: pros.length > 0 || cons.length > 0 ? "database" : "ai_generated",
      metadata: "database",
    },
  };
}
