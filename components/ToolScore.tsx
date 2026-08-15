"use client";

import { getAiVaultScore } from "@/lib/utils/score";

type ToolScoreProps = {
  tool?: Record<string, unknown> | null;
  score?: unknown;
  compact?: boolean;
  showLabel?: boolean;
  className?: string;
};

export default function ToolScore({
  tool,
  score,
  compact = false,
  showLabel = true,
  className = "",
}: ToolScoreProps) {
  const value =
    score !== undefined
      ? getDirectScore(score)
      : tool
        ? getAiVaultScore(tool)
        : null;

  return (
    <div className={className}>
      {showLabel && (
        <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
          AI Vault Score
        </div>
      )}

      {value === null ? (
        <div className="mt-1 text-sm font-medium text-slate-400">
          Score unavailable
        </div>
      ) : (
        <div className="mt-1 flex items-baseline gap-1">
          <span
            className={
              compact
                ? "text-sm font-semibold text-slate-700"
                : "text-lg font-semibold text-slate-900"
            }
          >
            {value}
          </span>

          <span className="text-xs text-slate-400">
            /100
          </span>
        </div>
      )}
    </div>
  );
}

function getDirectScore(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return null;
    }

    return Math.round(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());

    if (
      Number.isFinite(parsed) &&
      parsed >= 0 &&
      parsed <= 100
    ) {
      return Math.round(parsed);
    }
  }

  return null;
}
