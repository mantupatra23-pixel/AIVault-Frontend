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

const TRASH_PATTERNS: RegExp[] = [
  /senior seo/i,
  /ai analyst/i,
  /visora ai/i,
  /in-depth analysis/i,
  /professional review/i,
  /our analysis reveals/i,
  /our research suggests/i,
  /best .* alternatives/i,
  /pricing 2026/i,
  /i have (analyzed|conducted|reviewed|tested)/i,
  /for those looking for/i,
  /in conclusion/i,
  /by evaluating the pros/i,
  /it's essential to consider/i,
  /it appears to be a useful tool/i,
  /we will delve into/i,
  /ever-evolving landscape/i,
  /streamline workflows and enhance/i,
  /essential to stay informed/i,
  /professional analysis/i,
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
 * Filter out entire junk AI sentences and retain only genuine, clean information.
 */
export function cleanAiContent(text: unknown): string {
  if (!text || typeof text !== "string") return "";

  const rawSentences = text.split(/(?<=[.!?])\s+/);
  const cleanSentences: string[] = [];

  for (const s of rawSentences) {
    let cleanS = s.trim();

    // Check if sentence contains template AI junk
    const isTrash = TRASH_PATTERNS.some((pattern) => pattern.test(cleanS));
    if (isTrash) continue;

    // Clean leading connector artifacts
    cleanS = cleanS.replace(/^(and|which|also|moreover|furthermore|it appears to be)\s+/i, "");

    // Capitalize first character
    if (cleanS.length > 10) {
      cleanS = cleanS.charAt(0).toUpperCase() + cleanS.slice(1);
      cleanSentences.push(cleanS);
    }
  }

  const result = cleanSentences.slice(0, 3).join(" ").replace(/\s{2,}/g, " ").trim();
  return result.length > 20 ? result : "";
}

export function analyzeContentQuality(value: unknown): ContentQualityResult {
  const text = normalizeText(value);
  const issues: ContentQualityIssue[] = [];

  if (!text) {
    issues.push("empty");
  } else if (text.length < 40) {
    issues.push("too-short");
  }

  if (TRASH_PATTERNS.some((pattern) => pattern.test(text))) {
    issues.push("generic-template");
  }

  if (detectKeywordStuffing(text)) {
    issues.push("seo-stuffing");
  }

  if (detectRepeatedSentences(text)) {
    issues.push("repeated-sentence");
  }

  const score = Math.max(0, 100 - issues.length * 20);

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

export function cleanVerifiedDescription(value: unknown): string | null {
  const cleaned = cleanAiContent(value);
  return cleaned || null;
}
