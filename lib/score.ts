// lib/score.ts

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

export function normalizeScore(value: unknown): number | null {
  const n = toNumber(value);
  if (n === null) return null;
  if (n > 0 && n <= 10) return Math.round(n * 10);
  if (n >= 0 && n <= 100) return Math.round(n);
  return null;
}

/**
 * Evaluates candidate scores by strict canonical priority:
 * 1. neural_score
 * 2. score
 * 3. rating
 * 4. ai_vault_score
 *
 * Returns a normalized 0-100 number or null (never invents or defaults to 85).
 */
export function getToolScore(tool: any): number | null {
  if (!tool || typeof tool !== "object") return null;

  const candidates = [
    tool.neural_score,
    tool.score,
    tool.rating,
    tool.ai_vault_score,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeScore(candidate);
    if (normalized !== null && normalized > 0) {
      return normalized;
    }
  }

  return null;
}

// Universal alias export
export const getAiVaultScore = getToolScore;

export function formatToolScore(tool: any): string {
  const score = getToolScore(tool);
  if (score === null) return "Score unavailable";
  return `${score}/100`;
}

export function formatAIScore(score: unknown): string {
  const normalized = normalizeScore(score);
  if (normalized === null) return "Score unavailable";
  return `${normalized}/100`;
}

export function getScoreBarWidth(value: unknown): string {
  let normalized: number | null = null;
  if (typeof value === "object" && value !== null) {
    normalized = getToolScore(value);
  } else {
    normalized = normalizeScore(value);
  }
  if (normalized === null || normalized <= 0) return "0%";
  return `${Math.min(Math.max(normalized, 0), 100)}%`;
}

export function scoreLabel(tool: any): string {
  const score = getToolScore(tool);
  if (score === null || score <= 0) return "Not rated";
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  return "Needs review";
}
