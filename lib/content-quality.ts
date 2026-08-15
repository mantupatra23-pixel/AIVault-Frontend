// lib/content-quality.ts

export type ContentQualityIssue =
  | "empty"
  | "too-short"
  | "generic-template"
  | "seo-stuffing"
  | "repeated-sentence";

export type ContentQualityResult = {
  score: number;
  issues: ContentQualityIssue[];
  generic: boolean;
  normalizedText: string;
};

const TRASH_PATTERNS = [
  /senior seo/i,
  /ai analyst/i,
  /visora ai/i,
  /in-depth analysis/i,
  /professional review/i,
  /our analysis reveals/i,
  /best .* alternatives/i,
  /pricing 2026/i,
  /i have (analyzed|conducted|reviewed|tested)/i,
  /for those looking for/i,
  /in conclusion/i,
  /by evaluating the pros/i,
  /it's essential to consider/i,
  /it appears to be a useful tool/i,
  /we will delve into/i,
];

/**
 * Filter out entire junk AI sentences and retain only genuine information.
 */
export function cleanAiContent(text: unknown): string {
  if (!text || typeof text !== "string") return "";

  // Split into actual sentences
  const rawSentences = text.split(/(?<=[.!?])\s+/);
  const cleanSentences: string[] = [];

  for (let s of rawSentences) {
    let cleanS = s.trim();

    // Check if sentence contains template AI junk
    const isTrash = TRASH_PATTERNS.some((pattern) => pattern.test(cleanS));
    if (isTrash) continue;

    // Clean leading connector artifacts (e.g. "and it...", "which...")
    cleanS = cleanS.replace(/^(and|which|also|moreover|furthermore)\s+/i, "");
    
    // Capitalize first character
    if (cleanS.length > 5) {
      cleanS = cleanS.charAt(0).toUpperCase() + cleanS.slice(1);
      cleanSentences.push(cleanS);
    }
  }

  const result = cleanSentences.join(" ").replace(/\s{2,}/g, " ").trim();

  // If filtered output is too short or empty, provide a clean default
  return result.length > 25 ? result : "";
}

export function analyzeContentQuality(value: unknown): ContentQualityResult {
  const text = typeof value === "string" ? value.trim() : "";
  const issues: ContentQualityIssue[] = [];

  if (!text) {
    issues.push("empty");
  } else if (text.length < 40) {
    issues.push("too-short");
  }

  if (TRASH_PATTERNS.some((pattern) => pattern.test(text))) {
    issues.push("generic-template");
  }

  const score = Math.max(0, 100 - issues.length * 20);

  return {
    score,
    issues,
    generic: issues.includes("generic-template"),
    normalizedText: text,
  };
}

export function isGenericContent(value: unknown): boolean {
  return analyzeContentQuality(value).generic;
}

export function cleanVerifiedDescription(value: unknown): string | null {
  const cleaned = cleanAiContent(value);
  return cleaned || null;
}
