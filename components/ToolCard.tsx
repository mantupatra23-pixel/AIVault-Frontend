"use client";

import Link from "next/link";

import ToolLogo from "@/components/ToolLogo";

import {
  trackToolClick,
} from "@/lib/traffic-tracker";

/* =========================================================
   TYPES
========================================================= */

export type ToolCardData = {
  id?: string | number | null;

  slug?: string | null;

  name?: string | null;

  description?: string | null;

  short_description?: string | null;

  overview?: string | null;

  category?: string | null;

  pricing?: string | null;

  pricing_model?: string | null;

  score?: number | string | null;

  ai_vault_score?: number | string | null;

  logo_url?: string | null;

  logo?: string | null;

  image_url?: string | null;

  icon_url?: string | null;

  [key: string]: unknown;
};

/* =========================================================
   PROPS
========================================================= */

type ToolCardProps = {
  tool: ToolCardData;

  index?: number;

  className?: string;
};

/* =========================================================
   HELPERS
========================================================= */

function getName(
  tool: ToolCardData
): string {
  if (
    typeof tool.name === "string" &&
    tool.name.trim()
  ) {
    return tool.name.trim();
  }

  return "AI Tool";
}

function getSlug(
  tool: ToolCardData
): string {
  if (
    typeof tool.slug === "string"
  ) {
    return tool.slug.trim();
  }

  return "";
}

function getDescription(
  tool: ToolCardData
): string {
  const values = [
    tool.short_description,
    tool.description,
    tool.overview,
  ];

  for (const value of values) {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  return `Explore ${getName(
    tool
  )}, its features, pricing, capabilities and use cases.`;
}

function getCategory(
  tool: ToolCardData
): string {
  if (
    typeof tool.category === "string" &&
    tool.category.trim()
  ) {
    return tool.category.trim();
  }

  return "General AI";
}

function normalizePricing(
  value: unknown
): string {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return "Unknown";
  }

  const raw = value.trim();

  const lower =
    raw.toLowerCase();

  if (
    lower.includes("freemium")
  ) {
    return "Freemium";
  }

  if (
    lower === "free" ||
    lower.includes("free plan") ||
    lower.includes("free to use")
  ) {
    return "Free";
  }

  if (
    lower.includes("free trial") ||
    lower.includes("trial")
  ) {
    return "Free Trial";
  }

  if (
    lower.includes("open source") ||
    lower.includes("opensource")
  ) {
    return "Open Source";
  }

  if (
    lower.includes("contact sales") ||
    lower.includes("contact us")
  ) {
    return "Contact Sales";
  }

  if (
    lower.includes("enterprise")
  ) {
    return "Enterprise";
  }

  if (
    lower.includes("paid") ||
    lower.includes("subscription")
  ) {
    return "Paid";
  }

  return raw;
}

function getPricing(
  tool: ToolCardData
): string {
  const model =
    typeof tool.pricing_model === "string"
      ? tool.pricing_model.trim()
      : "";

  const pricing =
    typeof tool.pricing === "string"
      ? tool.pricing.trim()
      : "";

  return normalizePricing(
    model || pricing
  );
}

function getScore(
  tool: ToolCardData
): number {
  const raw =
    tool.ai_vault_score ??
    tool.score ??
    0;

  const numberValue =
    Number(raw);

  if (
    !Number.isFinite(
      numberValue
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(numberValue)
    )
  );
}

function getLogo(
  tool: ToolCardData
): string | null {
  const candidates = [
    tool.logo_url,
    tool.logo,
    tool.image_url,
    tool.icon_url,
  ];

  for (
    const value of candidates
  ) {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return null;
}

/* =========================================================
   CARD
========================================================= */

export default function ToolCard({
  tool,
  index = 0,
  className = "",
}: ToolCardProps) {
  const name =
    getName(tool);

  const slug =
    getSlug(tool);

  const category =
    getCategory(tool);

  const description =
    getDescription(tool);

  const pricing =
    getPricing(tool);

  const score =
    getScore(tool);

  const logo =
    getLogo(tool);

  const href =
    slug
      ? `/tool/${encodeURIComponent(
          slug
        )}`
      : null;

  const cardKey =
    tool.id != null
      ? String(tool.id)
      : slug ||
        `tool-${index}`;

  /* =======================================================
     CARD CONTENT
  ======================================================= */

  const cardContent = (
    <>
      {/* TOP */}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          {/* LOGO */}

          <div className="relative h-12 w-12 shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-blue-500/20 opacity-0 blur-xl transition duration-300 group-hover:opacity-100" />

            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {/*
                IMPORTANT:
                ToolLogo does NOT accept logoUrl.
                Use src instead.
              */}

              <ToolLogo
                src={logo}
                fallbackSrc={logo}
                name={name}
                size="md"
              />
            </div>
          </div>

          {/* NAME */}

          <div className="min-w-0">
            <h3 className="truncate text-base font-black tracking-tight text-slate-950">
              {name}
            </h3>

            <p className="mt-1 truncate text-xs font-semibold text-slate-400">
              {category}
            </p>
          </div>
        </div>

        {/* PRICING */}

        <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-black text-slate-600">
          {pricing}
        </span>
      </div>

      {/* DESCRIPTION */}

      <p className="mt-5 min-h-[72px] line-clamp-3 text-[13px] leading-6 text-slate-500">
        {description}
      </p>

      {/* SCORE */}

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
            AI Vault Score
          </span>

          <span className="text-xs font-black text-blue-600">
            {score}/100
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-all duration-500"
            style={{
              width: `${score}%`,
            }}
          />
        </div>
      </div>

      {/* FOOTER */}

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
          Verified AI Tool
        </span>

        {href ? (
          <span className="text-xs font-black text-blue-600 transition-transform duration-200 group-hover:translate-x-1">
            Explore →
          </span>
        ) : (
          <span className="text-xs font-black text-slate-400">
            Details unavailable
          </span>
        )}
      </div>
    </>
  );

  /* =======================================================
     NO SLUG
  ======================================================= */

  if (!href) {
    return (
      <article
        key={cardKey}
        className={`group rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.05)] ${className}`}
      >
        {cardContent}
      </article>
    );
  }

  /* =======================================================
     NORMAL CARD
  ======================================================= */

  return (
    <Link
      key={cardKey}
      href={href}
      onClick={() => {
        try {
          trackToolClick(
            slug,
            name,
            category,
            index
          );
        } catch (error) {
          console.error(
            "[TOOL_CARD_CLICK_ERR]",
            error
          );
        }
      }}
      className={`group block h-full rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.045)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_25px_65px_rgba(37,99,235,0.12)] ${className}`}
    >
      {cardContent}
    </Link>
  );
}
