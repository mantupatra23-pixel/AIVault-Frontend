"use client";

import Link from "next/link";

type RelatedTool = {
  id?: string | number | null;
  slug: string;
  name: string;
  description?: string | null;
  category?: string | null;
  pricing?: string | null;
  pricing_model?: string | null;
  logo_url?: string | null;
  logo?: string | null;
  image_url?: string | null;
  ai_vault_score?: number | string | null;
  score?: number | string | null;
};

type Props = {
  tools?: RelatedTool[];
  currentSlug?: string;
  title?: string;
  maxItems?: number;
};

function clean(value: unknown): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

function normalizeSlug(
  value: string
): string {
  return value
    .trim()
    .toLowerCase();
}

function getScore(
  tool: RelatedTool
): number | null {
  const raw =
    tool.ai_vault_score ??
    tool.score;

  if (
    raw === null ||
    raw === undefined
  ) {
    return null;
  }

  const number =
    typeof raw === "number"
      ? raw
      : Number(raw);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(number)
    )
  );
}

function getPricing(
  tool: RelatedTool
): string {
  return (
    clean(tool.pricing_model) ||
    clean(tool.pricing) ||
    "Pricing information unavailable"
  );
}

function getLogo(
  tool: RelatedTool
): string | null {
  return (
    clean(tool.logo_url) ||
    clean(tool.logo) ||
    clean(tool.image_url) ||
    null
  );
}

function getInitials(
  name: string
): string {
  const words =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (!words.length) {
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

export default function RelatedTools({
  tools = [],
  currentSlug,
  title = "Similar Tools",
  maxItems = 5,
}: Props) {
  const current =
    normalizeSlug(
      currentSlug || ""
    );

  /*
   * Never show:
   * - current tool
   * - duplicate slug
   * - empty slug
   */
  const uniqueTools =
    tools
      .filter((tool) => {
        const slug =
          clean(tool.slug);

        if (!slug) {
          return false;
        }

        if (
          current &&
          normalizeSlug(slug) === current
        ) {
          return false;
        }

        return true;
      })
      .filter(
        (tool, index, array) =>
          array.findIndex(
            (item) =>
              normalizeSlug(
                item.slug
              ) ===
              normalizeSlug(
                tool.slug
              )
          ) === index
      )
      .slice(0, maxItems);

  if (!uniqueTools.length) {
    return null;
  }

  return (
    <section
      aria-labelledby="related-tools-heading"
      className="mt-12"
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2
            id="related-tools-heading"
            className="text-xl font-black tracking-tight"
          >
            {title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Other tools with related categories or available data.
          </p>
        </div>

        <Link
          href="/compare"
          className="shrink-0 text-xs font-bold text-blue-600 hover:text-blue-700"
        >
          Compare →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {uniqueTools.map(
          (tool) => {
            const name =
              clean(tool.name) ||
              "Unnamed Tool";

            const category =
              clean(tool.category);

            const description =
              clean(
                tool.description
              );

            const logo =
              getLogo(tool);

            const score =
              getScore(tool);

            const pricing =
              getPricing(tool);

            return (
              <article
                key={
                  tool.id ??
                  tool.slug
                }
                className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {logo ? (
                      <img
                        src={logo}
                        alt={`${name} logo`}
                        className="h-full w-full object-contain p-1.5"
                        loading="lazy"
                        onError={(event) => {
                          const target =
                            event.currentTarget;

                          target.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <span className="text-xs font-black text-slate-500">
                        {getInitials(
                          name
                        )}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-sm font-black text-slate-900">
                      {name}
                    </h3>

                    {category && (
                      <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {category}
                      </p>
                    )}
                  </div>
                </div>

                {description && (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                    {description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                    {pricing}
                  </span>

                  {score !== null && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600">
                      Data score {score}/100
                    </span>
                  )}
                </div>

                <Link
                  href={`/tool/${encodeURIComponent(
                    tool.slug
                  )}`}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition group-hover:border-blue-200 group-hover:text-blue-600"
                >
                  View Tool →
                </Link>
              </article>
            );
          }
        )}
      </div>
    </section>
  );
}
