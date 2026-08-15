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
  /it appears to be a useful tool/i,
  /for those looking for the/i,
  /in conclusion/i,
];

/**
 * Strips all AI garbage, filler intros, and returns pure, clean readable text.
 */
export function cleanAiContent(text: unknown): string {
  if (!text || typeof text !== "string") return "";

  let cleaned = text.trim();

  // 1. Remove common intro filler sentences completely
  cleaned = cleaned.replace(/^I have (analyzed|conducted|reviewed|tested) [^.]*\.\s*/gi, "");
  cleaned = cleaned.replace(/^and it appears to be a useful tool for [^.]*\.\s*/gi, "");
  cleaned = cleaned.replace(/^As (a|an) Senior SEO [^.]*,\s*/gi, "");
  cleaned = cleaned.replace(/As a Senior SEO & AI Analyst for Visora AI,?\s*/gi, "");
  cleaned = cleaned.replace(/I conducted an in-depth analysis of [^.]*\.\s*/gi, "");
  cleaned = cleaned.replace(/In this Professional Review,?\s*/gi, "");
  cleaned = cleaned.replace(/Our professional review aims to provide [^.]*\.\s*/gi, "");

  // 2. Remove middle/trailing boilerplate & SEO fluff
  cleaned = cleaned.replace(/In conclusion,?[^.]*explore alternative options\.?/gi, "");
  cleaned = cleaned.replace(/By evaluating the pros and cons[^.]*needs\.?/gi, "");
  cleaned = cleaned.replace(/For those looking for the ['"]?Best [^'"]*Alternatives['"]?[^.]*\./gi, "");
  cleaned = cleaned.replace(/The ['"]?[^'"]*['"]? plan offers a [^.]*small businesses\.\s*/gi, "");
  cleaned = cleaned.replace(/It's essential to consider the features and pricing plans[^.]*\./gi, "");

  // 3. Remove orphaned connector words at start (e.g. "and it...", "which is...")
  cleaned = cleaned.replace(/^(and|which|also|moreover|furthermore|it appears to be)\s+/i, "");

  // 4. Normalize spaces & trim
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned.length > 20 ? cleaned : "";
}

export function isGenericContent(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return BAD_PATTERNS.some((pattern) => pattern.test(value));
}

export function cleanVerifiedDescription(value: unknown): string | null {
  const cleaned = cleanAiContent(value);
  return cleaned || null;
}
