import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://aivault.pp.ua";
const SITE_NAME = "AI Vault";

type ToolRecord = {
  id?: string | number | null;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  category?: string | null;
  pricing?: string | null;
};

type ToolLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
};

/* =========================================================
   SUPABASE
========================================================= */

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

/* =========================================================
   TEXT HELPERS
========================================================= */

function clean(value: unknown): string {
  return String(value ?? "")
    .replace(/^\/+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeDescription(value: unknown): string {
  const text = clean(value);

  if (!text) {
    return "Explore this AI tool on AI Vault, including features, pricing, use cases, specifications, reviews, and alternatives.";
  }

  if (text.length <= 155) {
    return text;
  }

  return `${text.slice(0, 152).trim()}...`;
}

/* =========================================================
   TOOL LOOKUP
========================================================= */

async function getTool(
  slug: string
): Promise<ToolRecord | null> {
  const supabase = getSupabase();

  if (!supabase) {
    return null;
  }

  const normalizedSlug = clean(slug);

  if (!normalizedSlug) {
    return null;
  }

  /*
   * First try exact slug.
   */
  const exactResult = await supabase
    .from("ai_tools")
    .select(
      "id,name,slug,description,category,pricing"
    )
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (exactResult.data) {
    return exactResult.data as ToolRecord;
  }

  /*
   * Fallback for older/inconsistent slug records.
   */
  const fallbackResult = await supabase
    .from("ai_tools")
    .select(
      "id,name,slug,description,category,pricing"
    )
    .ilike("slug", normalizedSlug)
    .limit(1)
    .maybeSingle();

  if (fallbackResult.data) {
    return fallbackResult.data as ToolRecord;
  }

  return null;
}

/* =========================================================
   CANONICAL SLUG
========================================================= */

function getCanonicalSlug(
  tool: ToolRecord | null,
  requestedSlug: string
): string {
  const databaseSlug = slugify(tool?.slug);

  if (databaseSlug) {
    return databaseSlug;
  }

  const requested = slugify(requestedSlug);

  if (requested) {
    return requested;
  }

  return "ai-tool";
}

/* =========================================================
   DYNAMIC SEO METADATA
========================================================= */

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const tool = await getTool(slug);

  const name =
    clean(tool?.name) ||
    clean(slug) ||
    "AI Tool";

  const category =
    clean(tool?.category) ||
    "AI Software";

  const description = makeDescription(
    tool?.description
  );

  const canonicalSlug = getCanonicalSlug(
    tool,
    slug
  );

  const canonicalUrl =
    `${SITE_URL}/tool/${canonicalSlug}`;

  const title =
    category &&
    category.toLowerCase() !== "ai software"
      ? `${name} — ${category} AI Tool`
      : `${name} — AI Tool`;

  return {
    /*
     * Page title
     */
    title,

    /*
     * Meta description
     */
    description,

    /*
     * Search keywords
     */
    keywords: [
      name,
      `${name} AI`,
      `${name} tool`,
      `${name} review`,
      `${name} pricing`,
      `${name} alternatives`,
      category,
      "AI tools",
      "AI software",
      "AI tools directory",
      "AI Vault",
    ],

    /*
     * Canonical URL
     */
    alternates: {
      canonical: canonicalUrl,
    },

    /*
     * Robots
     */
    robots: {
      index: true,
      follow: true,

      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    /*
     * Open Graph
     */
    openGraph: {
      type: "website",

      locale: "en_US",

      siteName: SITE_NAME,

      url: canonicalUrl,

      title,

      description,

      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${name} — AI Tool`,
        },
      ],
    },

    /*
     * Twitter / X
     */
    twitter: {
      card: "summary_large_image",

      title,

      description,

      images: [
        `${SITE_URL}/og-image.png`,
      ],
    },

    /*
     * Browser metadata
     */
    category: "technology",
  };
}

/* =========================================================
   TOOL PAGE JSON-LD
========================================================= */

function createToolSchema({
  tool,
  name,
  category,
  description,
  canonicalUrl,
}: {
  tool: ToolRecord | null;
  name: string;
  category: string;
  description: string;
  canonicalUrl: string;
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",

    "@type": "SoftwareApplication",

    name,

    description,

    url: canonicalUrl,

    applicationCategory: category,

    operatingSystem: "Web",

    isAccessibleForFree:
      clean(tool?.pricing).toLowerCase() ===
      "free",

    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },

    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  /*
   * Add pricing only when available.
   */
  const pricing = clean(tool?.pricing);

  if (pricing) {
    schema.offers = {
      "@type": "Offer",

      url: canonicalUrl,

      priceCurrency: "USD",

      availability:
        "https://schema.org/InStock",

      description: `${name} pricing: ${pricing}`,
    };
  }

  return schema;
}

/* =========================================================
   LAYOUT
========================================================= */

export default async function ToolLayout({
  children,
  params,
}: ToolLayoutProps) {
  const { slug } = await params;

  const tool = await getTool(slug);

  const name =
    clean(tool?.name) ||
    clean(slug) ||
    "AI Tool";

  const category =
    clean(tool?.category) ||
    "AI Software";

  const description = makeDescription(
    tool?.description
  );

  const canonicalSlug = getCanonicalSlug(
    tool,
    slug
  );

  const canonicalUrl =
    `${SITE_URL}/tool/${canonicalSlug}`;

  const schema = createToolSchema({
    tool,
    name,
    category,
    description,
    canonicalUrl,
  });

  return (
    <>
      {/* =================================================
          STRUCTURED DATA
      ================================================= */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />

      {children}
    </>
  );
}
