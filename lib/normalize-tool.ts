import type { Tool } from "./tool-types";
import {
  getAiVaultScore,
  normalizeUserRating,
} from "./utils/score";

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const result = value.trim();

  return result.length > 0 ? result : null;
}

function cleanId(
  value: unknown,
): string | number | null {
  if (typeof value === "string") {
    const result = value.trim();

    return result.length > 0 ? result : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  return null;
}

function cleanArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is string | number =>
          typeof item === "string" ||
          typeof item === "number",
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
 * Generate a slug only when the source does not
 * already contain a production slug.
 *
 * Existing slugs are NEVER changed here.
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

export function normalizeSlug(
  value: unknown,
): string {
  return slugify(String(value ?? ""));
}

/**
 * Normalize raw database/API tool data.
 *
 * IMPORTANT:
 * - Existing ID is preserved.
 * - Existing slug is preserved.
 * - No fake score is generated.
 * - rating remains a USER rating.
 * - AI Vault Score remains 0-100.
 * - Arrays are safely normalized.
 * - Missing factual data stays missing.
 */
export function normalizeTool(
  input: Record<string, unknown>,
): Tool {
  const id = cleanId(input.id);

  const name =
    cleanString(input.name) ??
    cleanString(input.title) ??
    "Unnamed AI Tool";

  /*
   * Production slug protection.
   *
   * If slug already exists, use it exactly as supplied.
   * We only generate a slug for records that genuinely
   * have no slug.
   */
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

  /*
   * CANONICAL AI VAULT SCORE.
   *
   * Priority:
   * score
   * -> neural_score
   * -> ai_vault_score
   *
   * rating is deliberately NOT included.
   */
  const score = getAiVaultScore(input);

  /*
   * User rating is a completely separate concept.
   *
   * Valid range: 0-5.
   */
  const rating = normalizeUserRating(
    input.rating,
  );

  /*
   * Preserve the raw neural score independently.
   *
   * If no neural_score exists, keep it null.
   * Do NOT copy score into neural_score because
   * that would create fake source data.
   */
  const neuralScore =
    input.neural_score !== undefined &&
    input.neural_score !== null
      ? getAiVaultScore({
          score: input.neural_score,
        })
      : null;

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

    platforms: cleanArray(
      input.platforms,
    ),

    features: cleanArray(
      input.features,
    ),

    use_cases: cleanArray(
      input.use_cases,
    ),

    integrations: cleanArray(
      input.integrations,
    ),

    limitations: cleanArray(
      input.limitations,
    ),

    /*
     * AI Vault Score = 0-100.
     */
    score,

    /*
     * neural_score stays separate.
     */
    neural_score: neuralScore,

    /*
     * User rating = 0-5.
     */
    rating,
  } as Tool;
}
