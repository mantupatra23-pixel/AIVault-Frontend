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

  use_cases?: unknown;
  features?: unknown;
  limitations?: unknown;
  integrations?: unknown;

  operating_system?: unknown;
  deployment?: unknown;
  license?: unknown;

  website_url?: string | null;
  logo_url?: string | null;
  logo?: string | null;
  image_url?: string | null;
  icon_url?: string | null;

  rating?: number | string | null;

  [key: string]: unknown;
};

export function getCanonicalSlug(
  tool: ToolRecord
): string | null {
  if (
    typeof tool.slug !== "string" ||
    !tool.slug.trim()
  ) {
    return null;
  }

  return tool.slug.trim();
}

export function getToolHref(
  tool: ToolRecord
): string | null {
  const slug = getCanonicalSlug(tool);

  if (!slug) {
    return null;
  }

  /*
   * Existing canonical database slug is authoritative.
   *
   * Do not:
   * - slugify name
   * - lowercase it
   * - replace characters
   * - generate fallback slug
   */

  return `/tool/${slug}`;
}

export function getToolName(
  tool: ToolRecord
): string {
  return (
    typeof tool.name === "string" &&
    tool.name.trim()
      ? tool.name.trim()
      : "AI Tool"
  );
}

export function getToolDescription(
  tool: ToolRecord
): string {
  const candidates = [
    tool.description,
    tool.short_description,
    tool.overview,
  ];

  for (const value of candidates) {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return "Information about this tool is currently limited.";
}

export function getToolCategory(
  tool: ToolRecord
): string {
  return (
    typeof tool.category === "string" &&
    tool.category.trim()
      ? tool.category.trim()
      : "General"
  );
}

export function getToolPricing(
  tool: ToolRecord
): string {
  const value =
    typeof tool.pricing_model === "string" &&
    tool.pricing_model.trim()
      ? tool.pricing_model
      : typeof tool.pricing === "string" &&
        tool.pricing.trim()
      ? tool.pricing
      : "";

  return value.trim();
}

export function getToolScore(
  tool: ToolRecord
): number | null {
  const raw =
    tool.ai_vault_score ??
    tool.score;

  if (
    raw === null ||
    raw === undefined ||
    raw === ""
  ) {
    return null;
  }

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value)
    )
  );
}

export function displayScore(
  tool: ToolRecord
): string {
  const score = getToolScore(tool);

  return score === null
    ? "Not available"
    : `${score}/100`;
}
