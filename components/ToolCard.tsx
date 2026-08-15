import Link from "next/link";

import type { Tool } from "@/lib/tool-types";
import { getToolHref } from "@/lib/tool-href";
import { getToolScore } from "@/lib/score";

import ToolLogo from "./ToolLogo";

type Props = {
  tool: Tool;
};

export default function ToolCard({ tool }: Props) {
  const score = getToolScore(tool);

  const href = getToolHref(tool);

  const pricing =
    tool.pricing ??
    tool.pricing_model ??
    "Not specified";

  return (
    <article className="group flex min-h-[285px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ToolLogo
            name={tool.name}
            src={tool.logo_url ?? tool.logo}
            size="md"
          />

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-950">
              {tool.name}
            </h3>

            <p className="mt-1 text-[11px] text-slate-400">
              {tool.category ?? "Other"}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[9px] font-medium text-slate-500">
          {pricing}
        </span>
      </div>

      <p className="mt-5 line-clamp-4 min-h-[68px] text-xs leading-5 text-slate-500">
        {tool.description ??
          tool.overview ??
          "Explore this AI tool and discover its features, pricing, and use cases."}
      </p>

      <div className="mt-auto pt-5">
        {score !== null ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                AI Vault Score
              </span>

              <span className="text-[11px] font-bold text-blue-600">
                {score}/100
              </span>
            </div>

            <div className="h-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{
                  width: `${score}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-slate-400">
            AI Vault Score: Not rated
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Verified AI Tool
          </span>

          <Link
            href={href}
            className="text-[11px] font-bold text-blue-600 transition hover:text-blue-800"
          >
            Explore →
          </Link>
        </div>
      </div>
    </article>
  );
}
