// lib/score.ts

export type NormalizedScore = number | null;

/**
 * Validates and converts any arbitrary value to a clean finite number.
 */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Strict 0-100 normalization.
 * NEVER assumes or injects default/fallback scores (e.g., 85).
 */
export function normalizeAiVaultScore(value: unknown): NormalizedScore {
  const n = toNumber(value);
  if (n === null || n <= 0) return null;
  if (n > 100) return 100;
  return Math.round(n);
}

/**
 * Authoritative Canonical AI Vault Score resolution.
 * Strict priority: neural_score -> score -> ai_vault_score
 * User 'rating' (0-5) is completely excluded from AI Vault Score.
 */
export function getToolScore(tool: any): NormalizedScore {
  if (!tool || typeof tool !== "object") return null;

  const candidates = [
    tool.neural_score,
    tool.score,
    tool.ai_vault_score,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeAiVaultScore(candidate);
    if (normalized !== null) {
      return normalized;
    }
  }

  return null;
}

export const getAiVaultScore = getToolScore;

export function formatToolScore(tool: any): string {
  const score = getToolScore(tool);
  if (score === null) return "Score unavailable";
  return `${score}/100`;
}

export function formatAIScore(score: unknown): string {
  const normalized = normalizeAiVaultScore(score);
  if (normalized === null) return "Score unavailable";
  return `${normalized}/100`;
}

export function getScoreBarWidth(value: unknown): string {
  let normalized: NormalizedScore = null;
  if (typeof value === "object" && value !== null) {
    normalized = getToolScore(value);
  } else {
    normalized = normalizeAiVaultScore(value);
  }
  if (normalized === null) return "0%";
  return `${Math.min(Math.max(normalized, 0), 100)}%`;
}

export function scoreLabel(tool: any): string {
  const score = getToolScore(tool);
  if (score === null) return "Not rated";
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  return "Needs review";
}
