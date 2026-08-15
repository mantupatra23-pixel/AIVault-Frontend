import type { Tool } from "./tool-types";

/**
 * Safely convert unknown values into a non-empty string.
 * Objects, arrays, numbers, booleans, etc. are rejected.
 */
function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const result = value.trim();

  return result.length > 0 ? result : null;
}

/**
 * Safely normalize an ID.
 *
 * Tool.id accepts:
 *   string | number | null
 *
 * Database/API data can sometimes contain:
 *   {}
 *   []
 *   boolean
 *   undefined
 *
 * Those values must never reach the Tool type.
 */
function cleanId(value: unknown): string | number | null {
  if (typeof value === "string") {
    const result = value.trim();
    return result.length > 0 ? result : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  return null;
}

/**
 * Safely normalize arrays into string arrays.
 */
function cleanArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is string | number =>
          typeof item === "string" || typeof item === "number",
      )
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * Convert a value into a valid 0–100 AI Vault score.
 *
 * Priority is handled by normalizeTool:
 *   score -> neural_score -> rating
 *
 * Supports:
 *   85
 *   "85"
 *   8.5/10
 *   "85/100"
 *   "85/10"
 *
 * Everything invalid becomes null.
 */
function cleanScore(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;

    if (value >= 0 && value <= 10) {
      return Math.round(value * 10);
    }

    if (value >= 0 && value <= 100) {
      return Math.round(value);
    }

    return null;
  }

  if (typeof value !== "string") return null;

  const raw = value.trim();

  if (!raw) return null;

  const slashMatch = raw.match(
    /^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/,
  );

  if (slashMatch) {
    const numerator = Number(slashMatch[1]);
    const denominator = Number(slashMatch[2]);

    if (
      !Number.isFinite(numerator) ||
      !Number.isFinite(denominator) ||
      denominator <= 0
    ) {
      return null;
    }

    const normalized = (numerator / denominator) * 100;

    if (normalized < 0 || normalized > 100) {
      return null;
    }

    return Math.round(normalized);
  }

  const numeric = Number(raw);

  if (!Number.isFinite(numeric)) return null;

  if (numeric >= 0 && numeric <= 10) {
    return Math.round(numeric * 10);
  }

  if (numeric >= 0 && numeric <= 100) {
    return Math.round(numeric);
  }

  return null;
}

/**
 * Normalize a slug into the canonical AI Vault URL format.
 */
function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Public slug normalizer.
 */
export function normalizeSlug(value: unknown): string {
  return slugify(String(value ?? ""));
}

/**
 * Normalize any raw tool/database object into the application's Tool shape.
 *
 * Important:
 * - Never trust raw database values.
 * - Never pass {} as id.
 * - Never pass malformed scores.
 * - Keep all score values on a 0–100 scale.
 * - Keep canonical slug generation consistent.
 */
export function normalizeTool(
  input: Record<string, unknown>,
): Tool {
  const id = cleanId(input.id);

  const name =
    cleanString(input.name) ??
    cleanString(input.title) ??
    "Unnamed AI Tool";

  const explicitSlug =
    cleanString(input.slug) ??
    cleanString(input.canonical_slug);

  const slug =
    explicitSlug ??
    slugify(name);

  const description =
    cleanString(input.description) ??
    cleanString(input.short_description) ??
    "";

  const overview =
    cleanString(input.overview) ??
    cleanString(input.description) ??
    description;

  const category =
    cleanString(input.category) ??
    cleanString(input.category_name) ??
    "Other";

  const pricing =
    cleanString(input.pricing) ??
    cleanString(input.pricing_model) ??
    "Not specified";

  const pricingModel =
    cleanString(input.pricing_model) ??
    cleanString(input.pricing) ??
    "Not specified";

  const website =
    cleanString(input.website) ??
    cleanString(input.official_website) ??
    cleanString(input.url);

  const officialWebsite =
    cleanString(input.official_website) ??
    cleanString(input.website) ??
    cleanString(input.url);

  const logo =
    cleanString(input.logo) ??
    cleanString(input.logo_url) ??
    cleanString(input.image_url);

  const logoUrl =
    cleanString(input.logo_url) ??
    cleanString(input.logo) ??
    cleanString(input.image_url);

  /**
   * Score priority:
   *
   * 1. score
   * 2. neural_score
   * 3. rating
   *
   * All output is normalized to 0–100.
   */
  const score =
    cleanScore(input.score) ??
    cleanScore(input.neural_score) ??
    cleanScore(input.rating);

  const neuralScore =
    cleanScore(input.neural_score) ??
    score;

  const rating =
    cleanScore(input.rating) ??
    score;

  return {
    id,
    name,
    slug,

    description,
    overview,

    category,

    pricing,
    pricing_model: pricingModel,

    website,
    official_website: officialWebsite,

    logo,
    logo_url: logoUrl,

    platforms: cleanArray(input.platforms),

    features: cleanArray(input.features),

    use_cases: cleanArray(input.use_cases),

    integrations: cleanArray(input.integrations),

    limitations: cleanArray(input.limitations),

    score,
    neural_score: neuralScore,
    rating,
  };
}
