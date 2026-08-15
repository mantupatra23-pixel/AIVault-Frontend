import type { Tool } from "./tool-types";

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const result = value.trim();

  return result.length > 0 ? result : null;
}

function cleanArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
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

export function normalizeSlug(value: unknown): string {
  return slugify(String(value ?? ""));
}

export function normalizeTool(input: Record<string, unknown>): Tool {
  const name =
    cleanString(input.name) ??
    cleanString(input.title) ??
    "Unnamed AI Tool";

  const explicitSlug =
    cleanString(input.slug) ??
    cleanString(input.canonical_slug);

  const slug = explicitSlug
    ? normalizeSlug(explicitSlug)
    : slugify(name);

  return {
    ...input,

    id: input.id ?? null,

    name,

    slug,

    description:
      cleanString(input.description) ??
      cleanString(input.short_description),

    overview:
      cleanString(input.overview) ??
      cleanString(input.description),

    category:
      cleanString(input.category) ??
      cleanString(input.category_name) ??
      "Other",

    pricing:
      cleanString(input.pricing) ??
      cleanString(input.pricing_model) ??
      "Not specified",

    pricing_model:
      cleanString(input.pricing_model) ??
      cleanString(input.pricing) ??
      "Not specified",

    website:
      cleanString(input.website) ??
      cleanString(input.official_website) ??
      cleanString(input.url),

    official_website:
      cleanString(input.official_website) ??
      cleanString(input.website) ??
      cleanString(input.url),

    logo:
      cleanString(input.logo) ??
      cleanString(input.logo_url) ??
      cleanString(input.image_url),

    logo_url:
      cleanString(input.logo_url) ??
      cleanString(input.logo) ??
      cleanString(input.image_url),

    platforms: cleanArray(input.platforms),

    features: cleanArray(input.features),

    use_cases: cleanArray(input.use_cases),

    integrations: cleanArray(input.integrations),

    limitations: cleanArray(input.limitations),
  };
}
