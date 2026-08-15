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

const BAD_PATTERNS: RegExp[] = [
  /senior seo/i,
  /ai analyst/i,
  /visora ai/i,
  /in-depth analysis/i,
  /professional review/i,
  /ever-evolving landscape/i,
  /essential to stay informed/i,
  /our analysis reveals/i,
  /best .* alternatives/i,
  /pricing 2026/i,
  /professional analysis/i,
  /i have (analyzed|conducted|reviewed|tested)/i,
];

const SEO_TERMS = [
  "best",
  "alternatives",
  "pricing",
  "review",
  "2026",
];

function normalizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceList(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((sentence) =>
      sentence
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
    )
    .filter(Boolean);
}

function detectKeywordStuffing(text: string): boolean {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);

  if (words.length < 40) {
    return false;
  }

  const counts = new Map<string, number>();

  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  for (const term of SEO_TERMS) {
    const count = counts.get(term);

    if (count && count / words.length > 0.08) {
      return true;
    }
  }

  return false;
}

function detectRepeatedSentences(text: string): boolean {
  const sentences = sentenceList(text);

  if (sentences.length < 4) {
    return false;
  }

  const unique = new Set(sentences);
  return unique.size / sentences.length < 0.65;
}

/**
 * Strips known generic AI repetitive phrases, intros, and SEO filler lines.
 */
export function cleanAiContent(text: unknown): string {
  if (!text || typeof text !== "string") return "";

  let cleaned = text.trim();

  // 1. Remove generic intro boilerplate
  cleaned = cleaned.replace(/^I have (analyzed|conducted|reviewed|tested) [^.]*\.\s*/gi, "");
  cleaned = cleaned.replace(/^As (a|an) [^.]*,\s*/gi, "");
  cleaned = cleaned.replace(/^(In this|Our) (professional|in-depth) review[^.]*\.\s*/gi, "");
  cleaned = cleaned.replace(/^Our analysis reveals that\s*/gi, "");

  // 2. Remove trailing generic SEO wrap-ups
  cleaned = cleaned.replace(/In conclusion,?[^.]*explore alternative options\.?/gi, "");
  cleaned = cleaned.replace(/By evaluating the pros and cons[^.]*needs\.?/gi, "");
  cleaned = cleaned.replace(/For those looking for the 'Best [^']*Alternatives'[^.]*\./gi, "");
  cleaned = cleaned.replace(/It's essential to consider the features and pricing plans[^.]*\./gi, "");

  // 3. Normalize multiple spaces & trim
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();

  return cleaned.length > 20 ? cleaned : "";
}

export function analyzeContentQuality(
  value: unknown
): ContentQualityResult {
  const text = normalizeText(value);
  const issues: ContentQualityIssue[] = [];

  if (!text) {
    issues.push("empty");
  } else if (text.length < 40) {
    issues.push("too-short");
  }

  if (BAD_PATTERNS.some((pattern) => pattern.test(text))) {
    issues.push("generic-template");
  }

  if (detectKeywordStuffing(text)) {
    issues.push("seo-stuffing");
  }

  if (detectRepeatedSentences(text)) {
    issues.push("repeated-sentence");
  }

  const score = Math.max(
    0,
    100 - issues.length * 20
  );

  return {
    score,
    issues,
    generic:
      issues.includes("generic-template") ||
      issues.includes("seo-stuffing") ||
      issues.includes("repeated-sentence"),
    normalizedText: text,
  };
}

export function isGenericContent(value: unknown): boolean {
  return analyzeContentQuality(value).generic;
}

export function cleanVerifiedDescription(
  value: unknown
): string | null {
  const text = normalizeText(value);

  if (!text) {
    return null;
  }

  const cleaned = cleanAiContent(text);

  if (!cleaned) {
    return null;
  }

  return cleaned;
}
