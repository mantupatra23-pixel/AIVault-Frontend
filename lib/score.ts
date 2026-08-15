import type { Tool } from "./tool-types";

function toNumber(value: unknown): number | null {
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
 * Converts a possible score into 0–100.
 *
 * Rules:
 * 0–10 => multiplied by 10
 * 0–100 => unchanged
 * anything else => invalid
 */
export function normalizeScore(value: unknown): number | null {
  const n = toNumber(value);

  if (n === null) return null;

  if (n >= 0 && n <= 10) {
    return Math.round(n * 10);
  }

  if (n >= 0 && n <= 100) {
    return Math.round(n);
  }

  return null;
}

/**
 * Canonical AI Vault Score.
 *
 * Priority:
 * score
 * → neural_score
 * → rating
 *
 * NEVER use contentQualityScore here.
 */
export function getToolScore(tool: Tool): number | null {
  const candidates = [
    tool.score,
    tool.neural_score,
    tool.rating,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeScore(candidate);

    if (normalized !== null) {
      return normalized;
    }
  }

  return null;
}

export function formatToolScore(tool: Tool): string {
  const score = getToolScore(tool);

  if (score === null) {
    return "Not rated";
  }

  return `${score}/100`;
}

export function scoreLabel(tool: Tool): string {
  const score = getToolScore(tool);

  if (score === null) return "Not rated";

  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";

  return "Needs review";
}
