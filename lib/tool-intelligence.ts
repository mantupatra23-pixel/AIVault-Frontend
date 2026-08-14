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
  name?: string | null;
  slug?: string | null;
  description?: string | null;

  features?: string[] | null;
  use_cases?: string[] | null;
  useCases?: string[] | null;

  pricing?: string | null;
  pricing_model?: string | null;
  pricingModel?: string | null;

  platforms?: string[] | null;

  website?: string | null;
  official_website?: string | null;
  officialWebsite?: string | null;

  category?: string | null;
  categories?: string[] | null;

  logo?: string | null;
  image?: string | null;
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

function asArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

export function getToolWebsite(tool: ToolIntelligenceInput): string | null {
  const website =
    tool.official_website ||
    tool.officialWebsite ||
    tool.website;

  if (!website) return null;

  const value = website.trim();

  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

export function getToolUseCases(
  tool: ToolIntelligenceInput,
): string[] {
  return asArray(tool.use_cases ?? tool.useCases);
}

export function getToolFeatures(
  tool: ToolIntelligenceInput,
): string[] {
  return asArray(tool.features);
}

export function getToolPlatforms(
  tool: ToolIntelligenceInput,
): string[] {
  return asArray(tool.platforms);
}

export function calculateToolQuality(
  tool: ToolIntelligenceInput,
): ToolQualityResult {
  let score = 0;

  const strengths: string[] = [];
  const missing: string[] = [];

  const name = clean(tool.name);
  const description = clean(tool.description);
  const features = getToolFeatures(tool);
  const useCases = getToolUseCases(tool);
  const platforms = getToolPlatforms(tool);
  const website = getToolWebsite(tool);

  // Name — 10
  if (name.length >= 2) {
    score += 10;
    strengths.push("Tool name");
  } else {
    missing.push("Tool name");
  }

  // Description — 15
  if (description.length >= 120) {
    score += 15;
    strengths.push("Detailed overview");
  } else if (description.length >= 50) {
    score += 10;
    strengths.push("Tool overview");
  } else {
    missing.push("Detailed description");
  }

  // Features — 15
  if (features.length >= 5) {
    score += 15;
    strengths.push("Rich feature information");
  } else if (features.length >= 2) {
    score += 10;
    strengths.push("Feature information");
  } else {
    missing.push("Features");
  }

  // Use cases — 15
  if (useCases.length >= 4) {
    score += 15;
    strengths.push("Use cases");
  } else if (useCases.length >= 1) {
    score += 8;
    strengths.push("Use-case information");
  } else {
    missing.push("Use cases");
  }

  // Pricing — 10
  if (
    clean(tool.pricing) ||
    clean(tool.pricing_model) ||
    clean(tool.pricingModel)
  ) {
    score += 10;
    strengths.push("Pricing information");
  } else {
    missing.push("Pricing");
  }

  // Platforms — 10
  if (platforms.length >= 1) {
    score += 10;
    strengths.push("Platform information");
  } else {
    missing.push("Platforms");
  }

  // Official website — 10
  if (website) {
    score += 10;
    strengths.push("Official website");
  } else {
    missing.push("Official website");
  }

  // Category — 5
  if (
    clean(tool.category) ||
    asArray(tool.categories).length > 0
  ) {
    score += 5;
    strengths.push("Category classification");
  } else {
    missing.push("Category");
  }

  // Logo/image — 5
  if (clean(tool.logo) || clean(tool.image)) {
    score += 5;
    strengths.push("Visual identity");
  } else {
    missing.push("Logo/image");
  }

  const finalScore = Math.max(0, Math.min(100, score));

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

export function detectDuplicate(
  current: ToolIntelligenceInput,
  candidates: ToolIntelligenceInput[],
): DuplicateMatch | null {
  const currentName = normalize(clean(current.name));
  const currentSlug = normalize(clean(current.slug));
  const currentWebsite = normalize(
    getToolWebsite(current) ?? "",
  );

  if (!currentName && !currentSlug && !currentWebsite) {
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

    const candidateName = normalize(clean(candidate.name));
    const candidateSlug = normalize(clean(candidate.slug));
    const candidateWebsite = normalize(
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
        toolSlug: candidate.slug ?? undefined,
        toolName: candidate.name ?? undefined,
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
        toolSlug: candidate.slug ?? undefined,
        toolName: candidate.name ?? undefined,
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
        toolSlug: candidate.slug ?? undefined,
        toolName: candidate.name ?? undefined,
      };
    }

    if (
      currentName &&
      candidateName &&
      (
        candidateName.includes(currentName) ||
        currentName.includes(candidateName)
      )
    ) {
      return {
        type: "near",
        confidence: 90,
        reason: "Very similar normalized tool name",
        toolSlug: candidate.slug ?? undefined,
        toolName: candidate.name ?? undefined,
      };
    }
  }

  return null;
}
