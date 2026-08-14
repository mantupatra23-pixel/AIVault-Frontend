import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SITE_URL = "https://aivault.pp.ua";

export type ToolRecord = {
  id?: string | number | null;
  slug?: string | null;
  name?: string | null;

  description?: string | null;
  short_description?: string | null;
  overview?: string | null;

  category?: string | null;

  pricing?: string | null;
  pricing_model?: string | null;

  score?: number | string | null;
  ai_vault_score?: number | string | null;
  rating?: number | string | null;

  logo_url?: string | null;
  logo?: string | null;
  image_url?: string | null;
  icon_url?: string | null;

  website_url?: string | null;
  official_url?: string | null;
  url?: string | null;

  features?: unknown;
  key_features?: unknown;

  use_cases?: unknown;

  limitations?: unknown;
  cons?: unknown;

  integrations?: unknown;

  operating_system?: string | null;
  os?: string | null;

  deployment?: string | null;
  license?: string | null;

  faqs?: unknown;
  faq?: unknown;

  [key: string]: unknown;
};

export function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(url, key);
}

/* =========================================================
   TEXT
========================================================= */

export function clean(value: unknown): string {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value).trim();
  }

  return "";
}

export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/*
 * IMPORTANT:
 * This is ONLY for auditing / comparison.
 * It must NEVER replace the canonical database slug.
 */
export function normalizedSlug(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCanonicalSlug(tool: ToolRecord): string {
  return clean(tool.slug);
}

export function getToolName(tool: ToolRecord): string {
  return clean(tool.name) || "AI Tool";
}

export function getToolCategory(tool: ToolRecord): string {
  return clean(tool.category) || "AI Tools";
}

/* =========================================================
   PRICING
========================================================= */

export type PricingValue =
  | "Free"
  | "Freemium"
  | "Paid"
  | "Free Trial"
  | "Contact Sales"
  | "Open Source"
  | "Enterprise"
  | "Unknown";

export function normalizePricing(
  value: unknown
): PricingValue {
  const raw = clean(value);

  if (!raw) return "Unknown";

  const v = raw.toLowerCase();

  if (v.includes("freemium")) {
    return "Freemium";
  }

  if (
    v === "free" ||
    v.includes("free plan") ||
    v.includes("free to use")
  ) {
    return "Free";
  }

  if (
    v.includes("free trial") ||
    v.includes("trial")
  ) {
    return "Free Trial";
  }

  if (
    v.includes("contact sales") ||
    v.includes("contact us")
  ) {
    return "Contact Sales";
  }

  if (
    v.includes("open source") ||
    v.includes("opensource")
  ) {
    return "Open Source";
  }

  if (v.includes("enterprise")) {
    return "Enterprise";
  }

  if (
    v.includes("paid") ||
    v.includes("subscription") ||
    v.includes("pro")
  ) {
    return "Paid";
  }

  return "Unknown";
}

/* =========================================================
   ARRAY / JSON
========================================================= */

export function parseArray(
  value: unknown
): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        if (
          item &&
          typeof item === "object"
        ) {
          const obj =
            item as Record<string, unknown>;

          return (
            clean(obj.name) ||
            clean(obj.title) ||
            clean(obj.text) ||
            clean(obj.value)
          );
        }

        return "";
      })
      .filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  const text = value.trim();

  if (!text) return [];

  try {
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed)) {
      return parseArray(parsed);
    }
  } catch {
    // normal text
  }

  return text
    .split(/\r?\n|;/)
    .map((item) =>
      item
        .replace(/^[-•*]\s*/, "")
        .replace(/^\d+[.)]\s*/, "")
        .trim()
    )
    .filter(Boolean);
}

/* =========================================================
   CONTENT
========================================================= */

const GENERIC_PATTERNS = [
  /senior seo/i,
  /visora ai/i,
  /professional review/i,
  /our analysis reveals/i,
  /ever-evolving landscape/i,
  /cutting-edge/i,
  /powerful features/i,
  /user-friendly interface/i,
  /excellent option/i,
  /streamline workflows/i,
  /enhance overall efficiency/i,
  /valuable tool/i,
  /robust tool/i,
  /wide range of users/i,
  /make informed decisions/i,
  /designed to help users/i,
  /pricing 2026/i,
  /best .* alternatives/i,
];

export function genericPhraseCount(
  text: string
): number {
  return GENERIC_PATTERNS.filter((pattern) =>
    pattern.test(text)
  ).length;
}

export function hasGenericContent(
  text: string
): boolean {
  return genericPhraseCount(text) > 0;
}

export function cleanCanonicalText(
  value: unknown
): string {
  let text = clean(value);

  if (!text) return "";

  /*
   * Remove known template language only.
   * Do not invent replacement facts.
   */
  text = text.replace(
    /As a Senior SEO & AI Analyst for Visora AI,?\s*/gi,
    ""
  );

  text = text.replace(
    /In this professional review,?\s*/gi,
    ""
  );

  text = text.replace(
    /Our professional review aims to provide an in-depth analysis of the tool,?\s*/gi,
    ""
  );

  return text
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function getDescription(
  tool: ToolRecord
): string {
  return (
    cleanCanonicalText(tool.description) ||
    cleanCanonicalText(tool.short_description) ||
    cleanCanonicalText(tool.overview)
  );
}

export function getOverview(
  tool: ToolRecord
): string {
  return (
    cleanCanonicalText(tool.overview) ||
    getDescription(tool)
  );
}

export function getFeatures(
  tool: ToolRecord
): string[] {
  return parseArray(
    tool.key_features
  ).length
    ? parseArray(tool.key_features)
    : parseArray(tool.features);
}

export function getUseCases(
  tool: ToolRecord
): string[] {
  return parseArray(tool.use_cases);
}

export function getLimitations(
  tool: ToolRecord
): string[] {
  return parseArray(
    tool.limitations
  ).length
    ? parseArray(tool.limitations)
    : parseArray(tool.cons);
}

export function getIntegrations(
  tool: ToolRecord
): string[] {
  return parseArray(tool.integrations);
}

/* =========================================================
   URL
========================================================= */

export function getWebsiteUrl(
  tool: ToolRecord
): string | null {
  const value =
    clean(tool.website_url) ||
    clean(tool.official_url) ||
    clean(tool.url);

  if (!value) return null;

  if (!/^https?:\/\//i.test(value)) {
    return null;
  }

  return value;
}

export function toolUrl(
  tool: ToolRecord
): string {
  const slug = getCanonicalSlug(tool);

  if (!slug) {
    return SITE_URL;
  }

  return `${SITE_URL}/tool/${encodeURIComponent(
    slug
  )}`;
}

/* =========================================================
   AI VAULT SCORE
========================================================= */

function scoreCompleteness(
  value: unknown,
  max: number
): number {
  return clean(value) ? max : 0;
}

function scoreArray(
  value: unknown,
  max: number
): number {
  return parseArray(value).length
    ? max
    : 0;
}

/*
 * Deterministic score.
 *
 * This is NOT a user rating.
 * It measures catalog-data quality.
 */
export function calculateAiVaultScore(
  tool: ToolRecord
): number {
  const description =
    getDescription(tool);

  const features =
    getFeatures(tool);

  const useCases =
    getUseCases(tool);

  const integrations =
    getIntegrations(tool);

  let score = 0;

  // Description / data completeness
  if (description.length >= 120) {
    score += 20;
  } else if (description.length >= 60) {
    score += 12;
  } else if (description.length > 0) {
    score += 6;
  }

  // Content uniqueness
  if (
    description &&
    !hasGenericContent(description)
  ) {
    score += 15;
  }

  // Features
  if (features.length >= 5) {
    score += 15;
  } else if (features.length >= 2) {
    score += 10;
  } else if (features.length === 1) {
    score += 5;
  }

  // Use cases
  if (useCases.length >= 3) {
    score += 10;
  } else if (useCases.length > 0) {
    score += 6;
  }

  // Pricing
  if (
    normalizePricing(
      tool.pricing_model ||
        tool.pricing
    ) !== "Unknown"
  ) {
    score += 10;
  }

  // Platform
  if (
    clean(tool.operating_system) ||
    clean(tool.os) ||
    clean(tool.deployment)
  ) {
    score += 10;
  }

  // Integrations
  if (integrations.length) {
    score += 5;
  }

  // Verified external rating only if present.
  const rating = Number(
    tool.rating
  );

  if (
    Number.isFinite(rating) &&
    rating > 0
  ) {
    score += 10;
  }

  // Freshness is intentionally not fabricated.
  // No points without a real freshness field.

  return Math.max(
    0,
    Math.min(100, Math.round(score))
  );
}

export function getAiVaultScore(
  tool: ToolRecord
): number {
  return calculateAiVaultScore(tool);
}

/* =========================================================
   SEO
========================================================= */

export function getSeoTitle(
  tool: ToolRecord
): string {
  const name = getToolName(tool);
  const category =
    getToolCategory(tool);

  return `${name} — Features, Pricing, Use Cases & Alternatives | AI Vault`;
}

export function getSeoDescription(
  tool: ToolRecord
): string {
  const name = getToolName(tool);
  const category =
    getToolCategory(tool);

  const description =
    getDescription(tool);

  const short =
    description.length > 110
      ? `${description.slice(0, 107)}...`
      : description;

  if (short) {
    return `${short} Explore verified ${category.toLowerCase()} information, pricing, features and alternatives on AI Vault.`;
  }

  return `Explore ${name}, a ${category.toLowerCase()} tool. View verified information, pricing, features, use cases and alternatives on AI Vault.`;
}

/* =========================================================
   DATABASE
========================================================= */

export async function getToolBySlug(
  slug: string
): Promise<ToolRecord | null> {
  const supabase =
    getSupabase();

  const canonicalSlug =
    safeDecode(slug);

  if (!canonicalSlug) {
    return null;
  }

  /*
   * CRITICAL:
   * Exact canonical slug lookup only.
   */
  const { data, error } =
    await supabase
      .from("ai_tools")
      .select("*")
      .eq("slug", canonicalSlug)
      .maybeSingle();

  if (error) {
    console.error(
      "[AI_VAULT_TOOL_LOOKUP]",
      error
    );

    throw new Error(
      error.message
    );
  }

  return data
    ? (data as ToolRecord)
    : null;
}

export async function getToolCount(): Promise<number> {
  const supabase =
    getSupabase();

  const { count, error } =
    await supabase
      .from("ai_tools")
      .select("id", {
        count: "exact",
        head: true,
      });

  if (error) {
    throw new Error(
      error.message
    );
  }

  return count || 0;
}

export async function getCategoryCount(
  category: string
): Promise<number> {
  const supabase =
    getSupabase();

  const { count, error } =
    await supabase
      .from("ai_tools")
      .select("id", {
        count: "exact",
        head: true,
      })
      .ilike(
        "category",
        category
      );

  if (error) {
    throw new Error(
      error.message
    );
  }

  return count || 0;
}

/* =========================================================
   CATEGORY SEO
========================================================= */

const CATEGORY_COPY: Record<
  string,
  string
> = {
  productivity:
    "Explore productivity software for task management, workflow automation, organization, note-taking and everyday work efficiency.",

  marketing:
    "Explore marketing platforms for SEO, content creation, advertising, analytics, lead generation and campaign workflows.",

  chatbot:
    "Explore chatbot and conversational AI software for customer support, assistants, knowledge access and automated conversations.",

  coding:
    "Explore developer and coding tools for software development, debugging, code generation, testing and engineering workflows.",

  image:
    "Explore image and visual AI tools for generation, editing, design, enhancement and creative production.",

  writing:
    "Explore writing software for drafting, editing, rewriting, research assistance, content production and communication.",

  audio:
    "Explore audio tools for speech, transcription, voice generation, sound editing and audio production.",

  video:
    "Explore video tools for generation, editing, production, subtitles, animation and video workflows.",
};

export function getCategoryDescription(
  category: string
): string {
  const key =
    normalizedSlug(category);

  return (
    CATEGORY_COPY[key] ||
    `Explore verified ${category} software and tools, with practical information about their capabilities, pricing and use cases.`
  );
}
