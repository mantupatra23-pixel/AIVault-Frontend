/* =========================================================
   AI VAULT — TOOL INTELLIGENCE
   Layer 1 + Layer 2 foundation
========================================================= */

export type ToolPlatform =
  | "web"
  | "windows"
  | "macos"
  | "linux"
  | "android"
  | "ios"
  | "api"
  | "browser"
  | "extension"
  | string;

export interface ToolIntelligenceInput {
  id?: string | number | null;

  name?: string | null;
  slug?: string | null;

  description?: string | null;
  short_description?: string | null;
  overview?: string | null;

  features?: string[] | string | null;
  feature_list?: string[] | string | null;

  use_cases?: string[] | string | null;
  useCases?: string[] | string | null;

  pricing?: string | null;
  price?: string | null;
  pricing_model?: string | null;
  pricingModel?: string | null;

  platforms?: string[] | string | null;
  operating_system?: string | null;
  os?: string | null;

  website?: string | null;
  website_url?: string | null;
  official_url?: string | null;
  official_website?: string | null;
  officialWebsite?: string | null;

  category?: string | null;
  categories?: string[] | string | null;

  deployment?: string | null;
  license?: string | null;

  integrations?: string[] | string | null;
  limitations?: string[] | string | null;

  logo?: string | null;
  logo_url?: string | null;
  image?: string | null;
  image_url?: string | null;
  icon_url?: string | null;

  score?: number | string | null;
  ai_vault_score?: number | string | null;

  [key: string]: unknown;
}

export interface ToolQualityResult {
  score: number;
  grade: string;
  label: string;
  strengths: string[];
  missing: string[];
}

export interface DuplicateMatch {
  type: "exact" | "near";
  confidence: number;
  reason: string;
  toolSlug?: string;
  toolName?: string;
}

/* =========================================================
   RELATED TOOL TYPES
========================================================= */

export interface RelatedToolResult
  extends ToolIntelligenceInput {
  _related_score?: number;
  _match_reasons?: string[];
}

export interface RelatedToolResponse {
  tool: {
    slug: string;
    name: string;
  };
  results: RelatedToolResult[];
  count: number;
}

/* =========================================================
   BASIC HELPERS
========================================================= */

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n;|]/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function uniqueStrings(
  values: string[],
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleanValue = value.trim();

    if (!cleanValue) continue;

    const key = normalizeText(cleanValue);

    if (!key || seen.has(key)) continue;

    seen.add(key);
    result.push(cleanValue);
  }

  return result;
}

/* =========================================================
   WEBSITE
========================================================= */

export function getToolWebsite(
  tool: ToolIntelligenceInput,
): string | null {
  const website =
    tool.official_website ||
    tool.officialWebsite ||
    tool.official_url ||
    tool.website_url ||
    tool.website;

  if (!website) return null;

  const value = clean(website);

  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

/* =========================================================
   FEATURES
========================================================= */

export function getToolFeatures(
  tool: ToolIntelligenceInput,
): string[] {
  return uniqueStrings(
    asArray(
      tool.features ??
        tool.feature_list,
    ),
  );
}

/* =========================================================
   USE CASES
========================================================= */

export function getToolUseCases(
  tool: ToolIntelligenceInput,
): string[] {
  return uniqueStrings(
    asArray(
      tool.use_cases ??
        tool.useCases,
    ),
  );
}

/* =========================================================
   PLATFORMS
========================================================= */

export function getToolPlatforms(
  tool: ToolIntelligenceInput,
): string[] {
  const explicitPlatforms = asArray(
    tool.platforms,
  );

  const operatingSystem =
    clean(
      tool.operating_system,
    ) ||
    clean(tool.os);

  const values = [
    ...explicitPlatforms,
    ...(operatingSystem
      ? [operatingSystem]
      : []),
  ];

  return uniqueStrings(values);
}

/* =========================================================
   INTEGRATIONS
========================================================= */

export function getToolIntegrations(
  tool: ToolIntelligenceInput,
): string[] {
  return uniqueStrings(
    asArray(tool.integrations),
  );
}

/* =========================================================
   LIMITATIONS
========================================================= */

export function getToolLimitations(
  tool: ToolIntelligenceInput,
): string[] {
  return uniqueStrings(
    asArray(tool.limitations),
  );
}

/* =========================================================
   CATEGORY
========================================================= */

export function getToolCategory(
  tool: ToolIntelligenceInput,
): string | null {
  const category = clean(
    tool.category,
  );

  if (category) {
    return category;
  }

  const categories = uniqueStrings(
    asArray(tool.categories),
  );

  return categories[0] ?? null;
}

/* =========================================================
   PRICING
========================================================= */

export function getToolPricing(
  tool: ToolIntelligenceInput,
): string | null {
  const value =
    clean(tool.pricing) ||
    clean(tool.price) ||
    clean(tool.pricing_model) ||
    clean(tool.pricingModel);

  return value || null;
}

/* =========================================================
   LOGO
========================================================= */

export function getToolLogo(
  tool: ToolIntelligenceInput,
): string | null {
  const value =
    clean(tool.logo_url) ||
    clean(tool.logo) ||
    clean(tool.image_url) ||
    clean(tool.image) ||
    clean(tool.icon_url);

  return value || null;
}

/* =========================================================
   QUALITY SCORE
========================================================= */

export function calculateToolQuality(
  tool: ToolIntelligenceInput,
): ToolQualityResult {
  let score = 0;

  const strengths: string[] = [];
  const missing: string[] = [];

  const name = clean(tool.name);

  const description =
    clean(tool.description) ||
    clean(tool.short_description) ||
    clean(tool.overview);

  const features =
    getToolFeatures(tool);

  const useCases =
    getToolUseCases(tool);

  const platforms =
    getToolPlatforms(tool);

  const website =
    getToolWebsite(tool);

  const integrations =
    getToolIntegrations(tool);

  const category =
    getToolCategory(tool);

  const pricing =
    getToolPricing(tool);

  /* -------------------------------------------------------
     NAME — 10
  ------------------------------------------------------- */

  if (name.length >= 2) {
    score += 10;
    strengths.push("Tool name");
  } else {
    missing.push("Tool name");
  }

  /* -------------------------------------------------------
     DESCRIPTION — 15
  ------------------------------------------------------- */

  if (description.length >= 180) {
    score += 15;
    strengths.push("Detailed overview");
  } else if (description.length >= 80) {
    score += 12;
    strengths.push("Useful overview");
  } else if (description.length >= 40) {
    score += 7;
    strengths.push("Basic overview");
  } else {
    missing.push("Detailed description");
  }

  /* -------------------------------------------------------
     FEATURES — 15
  ------------------------------------------------------- */

  if (features.length >= 5) {
    score += 15;
    strengths.push("Rich feature information");
  } else if (features.length >= 3) {
    score += 12;
    strengths.push("Feature information");
  } else if (features.length >= 1) {
    score += 6;
    strengths.push("Basic feature information");
  } else {
    missing.push("Features");
  }

  /* -------------------------------------------------------
     USE CASES — 15
  ------------------------------------------------------- */

  if (useCases.length >= 4) {
    score += 15;
    strengths.push("Detailed use cases");
  } else if (useCases.length >= 2) {
    score += 11;
    strengths.push("Use-case information");
  } else if (useCases.length === 1) {
    score += 6;
    strengths.push("Basic use case");
  } else {
    missing.push("Use cases");
  }

  /* -------------------------------------------------------
     PRICING — 10
  ------------------------------------------------------- */

  if (pricing) {
    score += 10;
    strengths.push("Pricing information");
  } else {
    missing.push("Pricing");
  }

  /* -------------------------------------------------------
     PLATFORMS — 10
  ------------------------------------------------------- */

  if (platforms.length > 0) {
    score += 10;
    strengths.push("Platform information");
  } else {
    missing.push("Platforms");
  }

  /* -------------------------------------------------------
     OFFICIAL WEBSITE — 10
  ------------------------------------------------------- */

  if (website) {
    score += 10;
    strengths.push("Official website");
  } else {
    missing.push("Official website");
  }

  /* -------------------------------------------------------
     CATEGORY — 5
  ------------------------------------------------------- */

  if (category) {
    score += 5;
    strengths.push("Category classification");
  } else {
    missing.push("Category");
  }

  /* -------------------------------------------------------
     INTEGRATIONS — 5
  ------------------------------------------------------- */

  if (integrations.length > 0) {
    score += 5;
    strengths.push("Integration information");
  } else {
    missing.push("Integrations");
  }

  /*
   * Keep score deterministic and capped.
   */
  const finalScore = Math.max(
    0,
    Math.min(100, score),
  );

  let grade = "D";
  let label = "Needs improvement";

  if (finalScore >= 90) {
    grade = "A+";
    label = "Excellent";
  } else if (finalScore >= 80) {
    grade = "A";
    label = "Very good";
  } else if (finalScore >= 70) {
    grade = "B";
    label = "Good";
  } else if (finalScore >= 60) {
    grade = "C";
    label = "Fair";
  }

  return {
    score: finalScore,
    grade,
    label,
    strengths,
    missing,
  };
}

/* =========================================================
   DUPLICATE DETECTOR
========================================================= */

export function detectDuplicate(
  current: ToolIntelligenceInput,
  candidates: ToolIntelligenceInput[],
): DuplicateMatch | null {
  const currentName =
    normalize(
      clean(current.name),
    );

  const currentSlug =
    normalize(
      clean(current.slug),
    );

  const currentWebsite =
    normalize(
      getToolWebsite(current) ?? "",
    );

  if (
    !currentName &&
    !currentSlug &&
    !currentWebsite
  ) {
    return null;
  }

  for (const candidate of candidates) {
    if (
      current.slug &&
      candidate.slug &&
      current.slug === candidate.slug
    ) {
      continue;
    }

    const candidateName =
      normalize(
        clean(candidate.name),
      );

    const candidateSlug =
      normalize(
        clean(candidate.slug),
      );

    const candidateWebsite =
      normalize(
        getToolWebsite(candidate) ?? "",
      );

    if (
      currentWebsite &&
      candidateWebsite &&
      currentWebsite === candidateWebsite
    ) {
      return {
        type: "exact",
        confidence: 100,
        reason: "Same official website",
        toolSlug:
          candidate.slug ??
          undefined,
        toolName:
          candidate.name ??
          undefined,
      };
    }

    if (
      currentName &&
      candidateName &&
      currentName === candidateName
    ) {
      return {
        type: "exact",
        confidence: 98,
        reason: "Same normalized tool name",
        toolSlug:
          candidate.slug ??
          undefined,
        toolName:
          candidate.name ??
          undefined,
      };
    }

    if (
      currentSlug &&
      candidateSlug &&
      currentSlug === candidateSlug
    ) {
      return {
        type: "exact",
        confidence: 98,
        reason: "Same tool slug",
        toolSlug:
          candidate.slug ??
          undefined,
        toolName:
          candidate.name ??
          undefined,
      };
    }

    if (
      currentName &&
      candidateName &&
      (
        candidateName.includes(
          currentName,
        ) ||
        currentName.includes(
          candidateName,
        )
      )
    ) {
      return {
        type: "near",
        confidence: 90,
        reason:
          "Very similar normalized tool name",
        toolSlug:
          candidate.slug ??
          undefined,
        toolName:
          candidate.name ??
          undefined,
      };
    }
  }

  return null;
}

/* =========================================================
   LAYER 2 — RELATED TOOL SCORING
========================================================= */

function tokenSet(
  values: string[],
): Set<string> {
  const result = new Set<string>();

  for (const value of values) {
    const normalized =
      normalizeText(value);

    for (
      const token of normalized.split(" ")
    ) {
      if (token.length >= 3) {
        result.add(token);
      }
    }
  }

  return result;
}

function overlapCount(
  a: Set<string>,
  b: Set<string>,
): number {
  let count = 0;

  for (const value of a) {
    if (b.has(value)) {
      count++;
    }
  }

  return count;
}

/**
 * Deterministic related-tool score.
 *
 * Maximum:
 *
 * Category          35
 * Use cases         25
 * Features          20
 * Platforms         10
 * Pricing            5
 * Description        5
 *
 * Total              100
 */
export function calculateRelatedScore(
  source: ToolIntelligenceInput,
  candidate: ToolIntelligenceInput,
): {
  score: number;
  reasons: string[];
} {
  let score = 0;

  const reasons: string[] = [];

  const sourceCategory =
    normalizeText(
      getToolCategory(source) ?? "",
    );

  const candidateCategory =
    normalizeText(
      getToolCategory(candidate) ?? "",
    );

  if (
    sourceCategory &&
    candidateCategory &&
    sourceCategory === candidateCategory
  ) {
    score += 35;
    reasons.push("Same category");
  }

  const sourceUseCases =
    tokenSet(
      getToolUseCases(source),
    );

  const candidateUseCases =
    tokenSet(
      getToolUseCases(candidate),
    );

  const useCaseOverlap =
    overlapCount(
      sourceUseCases,
      candidateUseCases,
    );

  if (useCaseOverlap > 0) {
    const points = Math.min(
      25,
      useCaseOverlap * 6,
    );

    score += points;
    reasons.push(
      `${useCaseOverlap} shared use case${
        useCaseOverlap === 1
          ? ""
          : "s"
      }`,
    );
  }

  const sourceFeatures =
    tokenSet(
      getToolFeatures(source),
    );

  const candidateFeatures =
    tokenSet(
      getToolFeatures(candidate),
    );

  const featureOverlap =
    overlapCount(
      sourceFeatures,
      candidateFeatures,
    );

  if (featureOverlap > 0) {
    const points = Math.min(
      20,
      featureOverlap * 4,
    );

    score += points;
    reasons.push(
      `${featureOverlap} shared capability${
        featureOverlap === 1
          ? ""
          : "ies"
      }`,
    );
  }

  const sourcePlatforms =
    new Set(
      getToolPlatforms(source).map(
        normalizeText,
      ),
    );

  const candidatePlatforms =
    new Set(
      getToolPlatforms(candidate).map(
        normalizeText,
      ),
    );

  const platformOverlap =
    overlapCount(
      sourcePlatforms,
      candidatePlatforms,
    );

  if (platformOverlap > 0) {
    const points = Math.min(
      10,
      platformOverlap * 5,
    );

    score += points;
    reasons.push("Platform overlap");
  }

  const sourcePricing =
    normalizeText(
      getToolPricing(source) ?? "",
    );

  const candidatePricing =
    normalizeText(
      getToolPricing(candidate) ?? "",
    );

  if (
    sourcePricing &&
    candidatePricing &&
    sourcePricing === candidatePricing
  ) {
    score += 5;
    reasons.push("Similar pricing model");
  }

  const sourceDescription =
    tokenSet([
      clean(source.description),
    ]);

  const candidateDescription =
    tokenSet([
      clean(candidate.description),
    ]);

  const descriptionOverlap =
    overlapCount(
      sourceDescription,
      candidateDescription,
    );

  if (descriptionOverlap > 0) {
    score += 5;
    reasons.push(
      "Related description terms",
    );
  }

  return {
    score: Math.min(100, score),
    reasons,
  };
}

/* =========================================================
   LAYER 2 — RANK RELATED TOOLS
========================================================= */

export function rankRelatedTools(
  source: ToolIntelligenceInput,
  candidates: ToolIntelligenceInput[],
  limit = 5,
): RelatedToolResult[] {
  const sourceSlug =
    normalize(
      clean(source.slug),
    );

  const seen = new Set<string>();

  const ranked: RelatedToolResult[] =
    [];

  for (const candidate of candidates) {
    const candidateSlug =
      clean(candidate.slug);

    const normalizedCandidateSlug =
      normalize(candidateSlug);

    /*
     * Never recommend current tool.
     */
    if (
      !normalizedCandidateSlug ||
      normalizedCandidateSlug ===
        sourceSlug
    ) {
      continue;
    }

    /*
     * Never duplicate candidates.
     */
    if (
      seen.has(
        normalizedCandidateSlug,
      )
    ) {
      continue;
    }

    seen.add(
      normalizedCandidateSlug,
    );

    const result =
      calculateRelatedScore(
        source,
        candidate,
      );

    /*
     * No meaningful relationship.
     */
    if (result.score <= 0) {
      continue;
    }

    ranked.push({
      ...candidate,
      _related_score:
        result.score,
      _match_reasons:
        result.reasons,
    });
  }

  ranked.sort(
    (a, b) => {
      const scoreDifference =
        (b._related_score ?? 0) -
        (a._related_score ?? 0);

      if (
        scoreDifference !== 0
      ) {
        return scoreDifference;
      }

      return clean(
        a.name,
      ).localeCompare(
        clean(b.name),
      );
    },
  );

  return ranked.slice(
    0,
    Math.max(1, limit),
  );
}
