// lib/score.ts
import type { Tool } from "./tool-types";

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
  if (n >= 0 && n <= 10) return Math.round(n * 10);
  if (n >= 0 && n <= 100) return Math.round(n);
  return null;
}

export function getToolScore(tool: Tool | null | undefined): number | null {
  if (!tool) return null;

  const candidates = [
    (tool as any).score,
    (tool as any).ai_vault_score,
    (tool as any).neural_score,
    (tool as any).rating,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeScore(candidate);
    if (normalized !== null) {
      return normalized;
    }
  }

  return null;
}

// Alias taaki koi bhi file getAiVaultScore call kare toh crash na ho
export const getAiVaultScore = getToolScore;

export function formatToolScore(tool: Tool | null | undefined): string {
  const score = getToolScore(tool);
  if (score === null || score <= 0) return "Not rated";
  return `${score}/100`;
}

export function formatAIScore(score: unknown): string {
  const normalized = normalizeScore(score);
  if (normalized === null || normalized <= 0) return "N/A";
  return `${normalized}/100`;
}

export function getScoreBarWidth(value: unknown): string {
  let normalized: number | null = null;
  if (typeof value === "object" && value !== null) {
    normalized = getToolScore(value as Tool);
  } else {
    normalized = normalizeScore(value);
  }
  if (normalized === null || normalized <= 0) return "0%";
  return `${Math.min(Math.max(normalized, 0), 100)}%`;
}

export function scoreLabel(tool: Tool | null | undefined): string {
  const score = getToolScore(tool);
  if (score === null || score <= 0) return "Not rated";
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  return "Needs review";
}
