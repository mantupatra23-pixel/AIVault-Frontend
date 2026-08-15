"use client";

import Link from "next/link";

type Tool = {
  id?: string | number | null;
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  short_description?: string | null;
  category?: string | null;
  pricing?: string | null;
  pricing_model?: string | null;
  score?: number | string | null;
  ai_vault_score?: number | string | null;
  logo_url?: string | null;
  logo?: string | null;
  image_url?: string | null;
  icon_url?: string | null;
  verified?: boolean | null;
};

function scoreOf(tool: Tool): number {
  const n = Number(
    tool.ai_vault_score ?? tool.score ?? 0
  );

  if (!Number.isFinite(n)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(n))
  );
}

function pricingOf(tool: Tool): string {
  const value = String(
    tool.pricing_model ??
      tool.pricing ??
      ""
  ).trim();

  if (!value) {
    return "Unknown";
  }

  const v = value.toLowerCase();

  if (v.includes("freemium")) {
    return "Freemium";
  }

  if (
    v === "free" ||
    v.includes("free plan")
  ) {
    return "Free";
  }

  if (v.includes("trial")) {
    return "Free Trial";
  }

  if (v.includes("enterprise")) {
    return "Enterprise";
  }

  if (v.includes("open source")) {
    return "Open Source";
  }

  if (
    v.includes("paid") ||
    v.includes("subscription")
  ) {
    return "Paid";
  }

  return value;
}

function cleanText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(
      /As a Senior SEO & AI Analyst for Visora AI,?\s*/gi,
      ""
    )
    .replace(
      /As a Senior SEO and AI Analyst for Visora AI,?\s*/gi,
      ""
    )
    .replace(
      /I have conducted an in-depth analysis of/gi,
      ""
    )
    .replace(
      /I have analyzed/gi,
      ""
    )
    .replace(
      /we will delve into/gi,
      ""
    )
    .replace(
      /it appears to be/gi,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function getInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "AI";
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[1][0]
  ).toUpperCase();
}

function getLogo(tool: Tool): string | null {
  const candidates = [
    tool.logo_url,
    tool.logo,
    tool.image_url,
    tool.icon_url,
  ];

  for (const value of candidates) {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return null;
}

export default function ToolCard({
  tool,
}: {
  tool: Tool;
}) {
  const slug = String(
    tool.slug ?? ""
  ).trim();

  if (!slug) {
    return null;
  }

  const name =
    String(
      tool.name ?? "AI Tool"
    ).trim() || "AI Tool";

  const category =
    String(
      tool.category ?? "AI"
    ).trim() || "AI";

  const description =
    cleanText(
      tool.short_description ??
        tool.description
    ) ||
    "Explore this AI tool, its capabilities, pricing and platform availability.";

  const score = scoreOf(tool);

  const pricing = pricingOf(tool);

  const logo = getLogo(tool);

  const initials = getInitials(name);

  return (
    <article
      className="
        group relative flex h-full min-w-0 flex-col
        overflow-hidden rounded-[24px]
        border border-slate-200/80
        bg-white p-5
        shadow-[0_8px_30px_rgba(15,23,42,0.04)]
        transition-all duration-300
        hover:-translate-y-1
        hover:border-blue-200
        hover:shadow-[0_18px_50px_rgba(37,99,235,0.12)]
      "
    >
      {/* =====================================================
          CARD HEADER
      ===================================================== */}
      <div
        className="
          flex min-w-0 items-start
          justify-between gap-3
        "
      >
        {/* Tool identity */}
        <div
          className="
            flex min-w-0 items-center gap-3
          "
        >
          {/* Logo */}
          <div
            className="
              relative flex h-12 w-12
              shrink-0 items-center justify-center
              overflow-hidden rounded-2xl
              border border-slate-200
              bg-gradient-to-br
              from-slate-50 to-white
              shadow-sm
            "
          >
            {logo ? (
              <img
                src={logo}
                alt={`${name} logo`}
                className="
                  h-full w-full
                  object-contain p-2
                "
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";

                  const fallback =
                    event.currentTarget
                      .parentElement
                      ?.querySelector(
                        "[data-logo-fallback]"
                      );

                  if (
                    fallback instanceof HTMLElement
                  ) {
                    fallback.style.display =
                      "flex";
                  }
                }}
              />
            ) : null}

            {/* Initial fallback */}
            <div
              data-logo-fallback
              className={`
                ${
                  logo
                    ? "hidden"
                    : "flex"
                }
                absolute inset-0
                items-center justify-center
                bg-gradient-to-br
                from-blue-600
                via-indigo-600
                to-violet-600
                text-sm font-black
                text-white
              `}
            >
              {initials}
            </div>
          </div>

          {/* Name + category */}
          <div className="min-w-0">
            <h2
              className="
                truncate text-[16px]
                font-extrabold
                tracking-tight
                text-slate-950
              "
              title={name}
            >
              {name}
            </h2>

            <p
              className="
                mt-1 truncate
                text-xs font-medium
                text-slate-500
              "
              title={category}
            >
              {category}
            </p>
          </div>
        </div>

        {/* Pricing */}
        <span
          className="
            shrink-0 rounded-full
            border border-slate-200
            bg-slate-50
            px-2.5 py-1
            text-[10px] font-bold
            text-slate-600
          "
        >
          {pricing}
        </span>
      </div>

      {/* =====================================================
          DESCRIPTION
      ===================================================== */}
      <p
        className="
          mt-5 line-clamp-3
          min-h-[66px]
          text-[13px]
          leading-6
          text-slate-500
        "
      >
        {description}
      </p>

      {/* =====================================================
          SCORE
      ===================================================== */}
      <div className="mt-5">
        <div
          className="
            mb-2 flex
            items-center
            justify-between
          "
        >
          <span
            className="
              text-[9px]
              font-black
              uppercase
              tracking-[0.18em]
              text-slate-400
            "
          >
            AI Vault Score
          </span>

          <span
            className="
              text-xs
              font-black
              text-slate-700
            "
          >
            {score}/100
          </span>
        </div>

        {/* Score bar */}
        <div
          className="
            h-1.5
            overflow-hidden
            rounded-full
            bg-slate-100
          "
        >
          <div
            className="
              h-full
              rounded-full
              bg-gradient-to-r
              from-blue-500
              via-indigo-500
              to-violet-500
              transition-all
              duration-500
            "
            style={{
              width: `${score}%`,
            }}
          />
        </div>
      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}
      <div
        className="
          mt-5 flex
          items-center
          justify-between
          border-t
          border-slate-100
          pt-4
        "
      >
        {/* Verification */}
        <span
          className="
            text-[9px]
            font-bold
            uppercase
            tracking-[0.16em]
            text-slate-400
          "
        >
          {tool.verified
            ? "Verified AI Tool"
            : "AI Tool"}
        </span>

        {/* Explore */}
        <Link
          href={`/tool/${encodeURIComponent(
            slug
          )}`}
          aria-label={`Explore ${name}`}
          className="
            inline-flex
            items-center
            gap-2
            text-xs
            font-extrabold
            text-blue-600
            transition
            hover:text-blue-800
          "
        >
          <span>
            Explore
          </span>

          <span
            aria-hidden="true"
            className="
              transition-transform
              duration-200
              group-hover:translate-x-1
            "
          >
            →
          </span>
        </Link>
      </div>

      {/* =====================================================
          PREMIUM BOTTOM ACCENT
      ===================================================== */}
      <div
        className="
          pointer-events-none
          absolute bottom-0 left-0 right-0
          h-[2px]
          origin-left
          scale-x-0
          bg-gradient-to-r
          from-blue-500
          via-indigo-500
          to-violet-500
          transition-transform
          duration-300
          group-hover:scale-x-100
        "
      />
    </article>
  );
}
