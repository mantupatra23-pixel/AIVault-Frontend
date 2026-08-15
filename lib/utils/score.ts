/**
 * AI Vault 3.0
 * Canonical AI Vault Score normalization.
 *
 * IMPORTANT:
 * - AI Vault Score is always 0-100.
 * - User rating is NOT AI Vault Score.
 * - Finder match score is NOT AI Vault Score.
 * - Missing/invalid values return null.
 * - No missing value is converted to 0.
 */

export type AiVaultScoreResult = {
  value: number | null;
  scale: 100;
};

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const raw = value.trim();

  if (!raw) {
    return null;
  }

  const numeric = Number(raw);

  return Number.isFinite(numeric) ? numeric : null;
}

/**
 * Normalize a score to 0-100.
 *
 * Supported:
 * 85
 * "85"
 * 8.5/10
 * "85/10"
 * "85/100"
 *
 * Rules:
 * - x/10 => x * 10
 * - x/100 => x
 * - plain 0-10 => x * 10
 * - plain 0-100 => x
 * - invalid => null
 */
export function normalizeAiVaultScore(
  value: unknown,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const raw = value.trim();

    if (!raw) {
      return null;
    }

    const slashMatch = raw.match(
      /^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/,
    );

    if (slashMatch) {
      const numerator = Number(slashMatch[1]);
      const denominator = Number(slashMatch[2]);

      if (
        !Number.isFinite(numerator) ||
        !Number.isFinite(denominator) ||
        denominator <= 0 ||
        numerator < 0
      ) {
        return null;
      }

      const normalized = (numerator / denominator) * 100;

      if (
        !Number.isFinite(normalized) ||
        normalized < 0 ||
        normalized > 100
      ) {
        return null;
      }

      return Math.round(normalized);
    }
  }

  const numeric = parseFiniteNumber(value);

  if (numeric === null || numeric < 0) {
    return null;
  }

  /*
   * Plain 0-10 values are treated as legacy /10 scores.
   *
   * Examples:
   * 8   -> 80
   * 8.5 -> 85
   * 10  -> 100
   */
  if (numeric <= 10) {
    return Math.round(numeric * 10);
  }

  /*
   * Plain 0-100 values remain on the canonical scale.
   */
  if (numeric <= 100) {
    return Math.round(numeric);
  }

  return null;
}

/**
 * Canonical field priority.
 *
 * IMPORTANT:
 * rating is deliberately excluded.
 */
export function getAiVaultScore(
  input: Record<string, unknown> | null | undefined,
): number | null {
  if (!input) {
    return null;
  }

  const candidates = [
    input.score,
    input.neural_score,
    input.ai_vault_score,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeAiVaultScore(candidate);

    if (normalized !== null) {
      return normalized;
    }
  }

  return null;
}

/**
 * Return the canonical UI object.
 */
export function getAiVaultScoreResult(
  input: Record<string, unknown> | null | undefined,
): AiVaultScoreResult {
  return {
    value: getAiVaultScore(input),
    scale: 100,
  };
}

/**
 * Normalize a user rating.
 *
 * User rating remains 0-5.
 * It must NEVER become an AI Vault Score.
 */
export function normalizeUserRating(
  value: unknown,
): number | null {
  const numeric = parseFiniteNumber(value);

  if (
    numeric === null ||
    numeric < 0 ||
    numeric > 5
  ) {
    return null;
  }

  return Math.round(numeric * 10) / 10;
}

/**
 * Normalize Finder match score.
 *
 * Finder match score is a separate 0-100 concept.
 */
export function normalizeFinderMatchScore(
  value: unknown,
): number | null {
  return normalizeAiVaultScore(value);
}
