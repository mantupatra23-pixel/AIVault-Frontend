"use client";

import Link from "next/link";

import type { Tool } from "@/lib/tool-types";
import { getToolHref } from "@/lib/tool-href";
import { getAiVaultScore } from "@/lib/utils/score";

import ToolLogo from "./ToolLogo";

type Props = {
  tool: Tool;
};

export default function ToolCard({ tool }: Props) {
  /*
   * ============================================================
   * AI VAULT SCORE
   * ============================================================
   *
   * Canonical source:
   *
   * score
   *   -> neural_score
   *   -> ai_vault_score
   *
   * IMPORTANT:
   * rating is NEVER used here.
   *
   * AI Vault Score is always 0-100.
   */
  const score = getAiVaultScore(
    tool as unknown as Record<string, unknown>,
  );

  /*
   * ============================================================
   * TOOL URL
   * ============================================================
   *
   * Existing production slug is preserved by getToolHref().
   */
  const href = getToolHref(tool);

  /*
   * ============================================================
   * PRICING
   * ============================================================
   *
   * Missing pricing must not become fake pricing.
   */
  const pricing =
    typeof tool.pricing === "string" &&
    tool.pricing.trim().length > 0
      ? tool.pricing.trim()
      : typeof tool.pricing_model === "string" &&
          tool.pricing_model.trim().length > 0
        ? tool.pricing_model.trim()
        : "Not specified";

  /*
   * ============================================================
   * DESCRIPTION
   * ============================================================
   *
   * Do NOT generate marketing copy when data is missing.
   */
  const description =
    typeof tool.description === "string" &&
    tool.description.trim().length > 0
      ? tool.description.trim()
      : typeof tool.overview === "string" &&
          tool.overview.trim().length > 0
        ? tool.overview.trim()
        : null;

  /*
   * ============================================================
   * CATEGORY
   * ============================================================
   */
  const category =
    typeof tool.category === "string" &&
    tool.category.trim().length > 0
      ? tool.category.trim()
      : "Other";

  /*
   * ============================================================
   * LOGO
   * ============================================================
   *
   * Existing valid logo remains untouched.
   */
  const logoSrc =
    typeof tool.logo_url === "string" &&
    tool.logo_url.trim().length > 0
      ? tool.logo_url.trim()
      : typeof tool.logo === "string" &&
          tool.logo.trim().length > 0
        ? tool.logo.trim()
        : undefined;

  return (
    <article className="group flex min-h-[285px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05]">
      {/* ======================================================
          HEADER
          ====================================================== */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ToolLogo
            name={tool.name}
            src={logoSrc}
            size="md"
          />

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-white">
              {tool.name}
            </h3>

            <p className="mt-1 text-[11px] text-slate-400">
              {category}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300">
          {pricing}
        </span>
      </div>

      {/* ======================================================
          DESCRIPTION
          ====================================================== */}
      <div className="mt-5">
        {description ? (
          <p className="line-clamp-4 min-h-[68px] text-sm leading-6 text-slate-300">
            {description}
          </p>
        ) : (
          <p className="min-h-[68px] text-sm leading-6 text-slate-500">
            Tool description is currently unavailable.
          </p>
        )}
      </div>

      {/* ======================================================
          AI VAULT SCORE
          ====================================================== */}
      <div className="mt-auto pt-5">
        {score !== null ? (
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                AI Vault Score
              </span>

              <span className="text-[11px] font-bold text-white">
                {score}/100
              </span>
            </div>

            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, score),
                  )}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-slate-500">
            AI Vault Score: Not available
          </div>
        )}

        {/* ====================================================
            FOOTER
            ==================================================== */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-[9px] font-semibold text-slate-400">
            Verified AI Tool
          </span>

          <Link
            href={href}
            className="text-[11px] font-bold text-blue-400 transition-colors hover:text-blue-300"
          >
            Explore →
          </Link>
        </div>
      </div>
    </article>
  );
}
