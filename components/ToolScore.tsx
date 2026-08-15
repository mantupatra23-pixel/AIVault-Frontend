import type { Tool } from "@/lib/tool-types";
import { getToolScore } from "@/lib/score";

type Props = {
  tool: Tool;
};

export default function ToolScore({ tool }: Props) {
  const score = getToolScore(tool);

  if (score === null) {
    return (
      <div className="text-xs font-medium text-slate-400">
        AI Vault Score: Not rated
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          AI Vault Score
        </span>

        <span className="text-sm font-bold text-blue-600">
          {score}/100
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
          style={{
            width: `${Math.min(100, Math.max(0, score))}%`,
          }}
        />
      </div>
    </div>
  );
}
