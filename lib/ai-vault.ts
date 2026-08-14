import { createClient } from "@supabase/supabase-js";

/* =========================================================
   TYPES
========================================================= */

export type ToolRecord = {
  id?: string | number | null;

  name?: string | null;
  slug?: string | null;
  category?: string | null;

  description?: string | null;
  short_description?: string | null;
  overview?: string | null;

  pricing?: string | null;
  pricing_model?: string | null;

  score?: number | string | null;
  ai_vault_score?: number | string | null;

  logo_url?: string | null;
  logo?: string | null;
  image_url?: string | null;

  website_url?: string | null;
  official_url?: string | null;
  url?: string | null;

  features?: unknown;
  key_features?: unknown;

  limitations?: unknown;
  cons?: unknown;

  use_cases?: unknown;

  how_to_start?: unknown;
  getting_started?: unknown;
  how_to_get_started?: unknown;

  faqs?: unknown;
  faq?: unknown;

  operating_system?: string | null;
  os?: string | null;

  deployment?: string | null;
  license?: string | null;

  integrations?: unknown;

  [key: string]: unknown;
};

/* =========================================================
   SUPABASE
========================================================= */

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(url, key);
}

/* =========================================================
   STRING HELPERS
========================================================= */

export function clean(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return "";
}

/* =========================================================
   CANONICAL SLUG
========================================================= */

/**
 * IMPORTANT:
 *
 * This function is ONLY for URL normalization/comparison.
 *
 * It must NOT be used to create a database slug.
 *
 * The database `public.ai_tools.slug` remains canonical.
 */
export function decodeSlug(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Used only for audit/debugging.
 * NEVER use this to silently choose another tool.
 */
export function normalizeSlugForAudit(
  value: string
): string {
  return clean(value)
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\s+/g, "-");
}

/* =========================================================
   EXACT TOOL LOOKUP
========================================================= */

export async function getToolBySlug(
  slug: string
): Promise<ToolRecord | null> {
  const canonicalSlug = decodeSlug(slug).trim();

  if (!canonicalSlug) {
    return null;
  }

  const supabase = getSupabase();

  /*
   * CRITICAL:
   *
   * Exact canonical lookup only.
   *
   * NO:
   * - ilike
   * - name lookup
   * - fuzzy matching
   * - fallback to another record
   */

  const { data, error } = await supabase
    .from("ai_tools")
    .select("*")
    .eq("slug", canonicalSlug)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Supabase tool lookup failed: ${error.message}`
    );
  }

  return (data as ToolRecord | null) ?? null;
}

/* =========================================================
   CANONICAL SCORE
========================================================= */

export function getToolScore(
  tool: ToolRecord
): number {
  const raw =
    tool.ai_vault_score ??
    tool.score;

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    return 0;
  }

  /*
   * Database score is treated as a 0-100 score.
   *
   * Example:
   * 85 -> 85/100
   *
   * We intentionally do NOT convert 8.5 -> 85
   * because that could alter the underlying meaning.
   */

  return Math.max(
    0,
    Math.min(100, Math.round(value))
  );
}

/* =========================================================
   TOOL NAME
========================================================= */

export function getToolName(
  tool: ToolRecord
): string {
  return (
    clean(tool.name) ||
    "AI Tool"
  );
}

/* =========================================================
   DESCRIPTION
========================================================= */

export function getToolDescription(
  tool: ToolRecord
): string {
  return (
    clean(tool.description) ||
    clean(tool.short_description) ||
    clean(tool.overview) ||
    "Explore this AI tool, including its features, pricing, use cases, and official access information."
  );
}

/* =========================================================
   CATEGORY
========================================================= */

export function getToolCategory(
  tool: ToolRecord
): string {
  return (
    clean(tool.category) ||
    "AI Tools"
  );
}

/* =========================================================
   PRICING
========================================================= */

export function getToolPricing(
  tool: ToolRecord
): string {
  const value =
    clean(tool.pricing_model) ||
    clean(tool.pricing);

  if (!value) {
    return "Unknown";
  }

  const lower =
    value.toLowerCase();

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
    lower.includes("paid") ||
    lower.includes("subscription") ||
    lower.includes("pro plan")
  ) {
    return "Paid";
  }

  return value;
}

/* =========================================================
   LOGO
========================================================= */

export function getToolLogo(
  tool: ToolRecord
): string | null {
  return (
    clean(tool.logo_url) ||
    clean(tool.logo) ||
    clean(tool.image_url) ||
    null
  );
}

/* =========================================================
   OFFICIAL URL
========================================================= */

export function getOfficialUrl(
  tool: ToolRecord
): string | null {
  const value =
    clean(tool.website_url) ||
    clean(tool.official_url) ||
    clean(tool.url);

  if (!value) {
    return null;
  }

  if (
    !/^https?:\/\//i.test(value)
  ) {
    return null;
  }

  return value;
}

/* =========================================================
   ARRAY PARSER
========================================================= */

export function parseArray(
  value: unknown
): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (
          typeof item === "string"
        ) {
          return item.trim();
        }

        if (
          item &&
          typeof item === "object"
        ) {
          const object =
            item as Record<
              string,
              unknown
            >;

          return (
            clean(object.title) ||
            clean(object.name) ||
            clean(object.text) ||
            clean(object.value)
          );
        }

        return "";
      })
      .filter(Boolean);
  }

  if (
    typeof value === "string"
  ) {
    const text = value.trim();

    if (!text) {
      return [];
    }

    try {
      const parsed =
        JSON.parse(text);

      if (
        Array.isArray(parsed)
      ) {
        return parseArray(parsed);
      }
    } catch {
      // Plain text.
    }

    return text
      .split(/\r?\n/)
      .map((item) =>
        item
          .replace(
            /^[-•*]\s*/,
            ""
          )
          .replace(
            /^\d+[.)]\s*/,
            ""
          )
          .trim()
      )
      .filter(Boolean);
  }

  return [];
}

/* =========================================================
   FEATURES
========================================================= */

export function getToolFeatures(
  tool: ToolRecord
): string[] {
  const primary =
    parseArray(
      tool.key_features
    );

  if (primary.length) {
    return primary;
  }

  const secondary =
    parseArray(tool.features);

  if (secondary.length) {
    return secondary;
  }

  return [
    "User-friendly interface",
    "Practical workflow capabilities",
  ];
}

/* =========================================================
   LIMITATIONS
========================================================= */

export function getToolLimitations(
  tool: ToolRecord
): string[] {
  const primary =
    parseArray(
      tool.limitations
    );

  if (primary.length) {
    return primary;
  }

  const secondary =
    parseArray(tool.cons);

  if (secondary.length) {
    return secondary;
  }

  return [
    "Feature availability may vary by plan",
    "Cloud-based features may require an internet connection",
  ];
}

/* =========================================================
   USE CASES
========================================================= */

export function getToolUseCases(
  tool: ToolRecord
): string[] {
  const values =
    parseArray(tool.use_cases);

  if (values.length) {
    return values;
  }

  return [
    "Productivity",
    "Workflow automation",
    "Business operations",
  ];
}

/* =========================================================
   GETTING STARTED
========================================================= */

export function getToolGettingStarted(
  tool: ToolRecord
): string[] {
  const first =
    parseArray(
      tool.how_to_get_started
    );

  if (first.length) {
    return first;
  }

  const second =
    parseArray(
      tool.how_to_start
    );

  if (second.length) {
    return second;
  }

  const third =
    parseArray(
      tool.getting_started
    );

  if (third.length) {
    return third;
  }

  const name =
    getToolName(tool);

  return [
    `Visit the official ${name} portal`,
    "Create or sign in to your account if required",
    "Configure your workspace and preferences",
    "Start using the platform for your workflow",
  ];
}

/* =========================================================
   PLATFORM
========================================================= */

export function getToolOS(
  tool: ToolRecord
): string {
  return (
    clean(tool.operating_system) ||
    clean(tool.os) ||
    "Web / Cloud"
  );
}

export function getToolDeployment(
  tool: ToolRecord
): string {
  return (
    clean(tool.deployment) ||
    "Hosted SaaS"
  );
}

export function getToolLicense(
  tool: ToolRecord
): string {
  return (
    clean(tool.license) ||
    "Proprietary"
  );
}

/* =========================================================
   INTEGRATIONS
========================================================= */

export function getToolIntegrations(
  tool: ToolRecord
): string[] {
  const values =
    parseArray(
      tool.integrations
    );

  if (values.length) {
    return values;
  }

  return [
    "Web",
    "Cloud services",
    "API integrations",
  ];
}

/* =========================================================
   FAQ
========================================================= */

export type FAQItem = {
  question: string;
  answer: string;
};

export function getToolFAQs(
  tool: ToolRecord
): FAQItem[] {
  const raw =
    tool.faqs ??
    tool.faq;

  if (
    Array.isArray(raw)
  ) {
    const parsed =
      raw
        .map((item) => {
          if (
            !item ||
            typeof item !== "object"
          ) {
            return null;
          }

          const object =
            item as Record<
              string,
              unknown
            >;

          const question =
            clean(
              object.question
            ) ||
            clean(object.q);

          const answer =
            clean(
              object.answer
            ) ||
            clean(object.a);

          if (
            !question ||
            !answer
          ) {
            return null;
          }

          return {
            question,
            answer,
          };
        })
        .filter(
          Boolean
        ) as FAQItem[];

    if (parsed.length) {
      return parsed;
    }
  }

  const name =
    getToolName(tool);

  const pricing =
    getToolPricing(tool);

  return [
    {
      question:
        `What is ${name} used for?`,
      answer:
        `${name} is listed in the AI Vault directory as a software tool for relevant productivity and workflow use cases.`,
    },
    {
      question:
        `Is ${name} free?`,
      answer:
        `${name} is currently listed as ${pricing}. Check the official website for the latest pricing, limits, and terms.`,
    },
    {
      question:
        `Who can use ${name}?`,
      answer:
        `${name} may be useful for individuals, professionals, creators, or teams depending on its supported workflows.`,
    },
    {
      question:
        `How do I get started with ${name}?`,
      answer:
        `Use the official portal button on this page and follow the provider's current onboarding process.`,
    },
    {
      question:
        `Where can I access ${name}?`,
      answer:
        `Use the Visit Official Portal button on this page to open the official website.`,
    },
  ];
}

/* =========================================================
   DATABASE COUNT
========================================================= */

export async function getToolCount(
  category?: string
): Promise<number> {
  const supabase =
    getSupabase();

  let query =
    supabase
      .from("ai_tools")
      .select("id", {
        count: "exact",
        head: true,
      });

  if (category) {
    query =
      query.eq(
        "category",
        category
      );
  }

  const {
    count,
    error,
  } = await query;

  if (error) {
    throw new Error(
      `Tool count failed: ${error.message}`
    );
  }

  return count ?? 0;
}
