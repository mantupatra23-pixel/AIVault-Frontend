import type { Metadata } from "next";
import type { ReactNode } from "react";
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
  website_url?: string | null;
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
    return "Discover this AI tool on AI Vault. Explore features, pricing, use cases, alternatives, and more.";
  }

  if (text.length <= 160) {
    return text;
  }

  return `${text.slice(0, 157).trim()}...`;
}

function getToolName(
  tool: ToolRecord | null,
  requestedSlug: string
): string {
  return (
    clean(tool?.name) ||
    clean(requestedSlug) ||
    "AI Tool"
  );
}

function getCategory(
  tool: ToolRecord | null
): string {
  return (
    clean(tool?.category) ||
    "AI Software"
  );
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
   * First: exact slug match
   */

  const exactResult = await supabase
    .from("ai_tools")
    .select(
      "id,name,slug,description,category,pricing,website_url"
    )
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (exactResult.data) {
    return exactResult.data as ToolRecord;
  }

  /*
   * Second: case-insensitive fallback
   */

  const fallbackResult = await supabase
    .from("ai_tools")
    .select(
      "id,name,slug,description,category,pricing,website_url"
    )
    .ilike("slug", normalizedSlug)
    .limit(1)
    .maybeSingle();

  if (fallbackResult.data) {
    return fallbackResult.data as ToolRecord;
  }

  /*
   * No tool found
   */

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
   DYNAMIC METADATA
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

  const name = getToolName(tool, slug);
  const category = getCategory(tool);

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

  const keywords = [
    name,
    `${name} AI`,
    `${name} tool`,
    `${name} review`,
    `${name} pricing`,
    `${name} alternatives`,
    `${name} features`,
    `best ${name} alternatives`,
    category,
    "AI tools",
    "AI software",
    "AI tools directory",
    "AI Vault",
  ].filter(Boolean);

  return {
    metadataBase: new URL(SITE_URL),

    title,

    description,

    keywords,

    applicationName: SITE_NAME,

    authors: [
      {
        name: SITE_NAME,
      },
    ],

    creator: SITE_NAME,

    publisher: SITE_NAME,

    alternates: {
      canonical: canonicalUrl,
    },

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
          alt: `${name} - AI Vault`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",

      title,

      description,

      images: [
        `${SITE_URL}/og-image.png`,
      ],
    },
  };
}

/* =========================================================
   SOFTWARE APPLICATION SCHEMA
   ========================================================= */

function createSoftwareSchema({
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

    isPartOf: {
      "@type": "WebSite",

      name: SITE_NAME,

      url: SITE_URL,
    },

    publisher: {
      "@type": "Organization",

      name: SITE_NAME,

      url: SITE_URL,
    },
  };

  /*
   * Only add free-access information when
   * database explicitly says "free".
   */

  const pricing = clean(tool?.pricing).toLowerCase();

  if (pricing === "free") {
    schema.isAccessibleForFree = true;
  }

  return schema;
}

/* =========================================================
   BREADCRUMB SCHEMA
   ========================================================= */

function createBreadcrumbSchema({
  name,
  category,
  canonicalUrl,
}: {
  name: string;
  category: string;
  canonicalUrl: string;
}) {
  return {
    "@context": "https://schema.org",

    "@type": "BreadcrumbList",

    itemListElement: [
      {
        "@type": "ListItem",

        position: 1,

        name: SITE_NAME,

        item: SITE_URL,
      },

      {
        "@type": "ListItem",

        position: 2,

        name: "AI Tools",

        item: SITE_URL,
      },

      {
        "@type": "ListItem",

        position: 3,

        name: category,

        item:
          `${SITE_URL}/category/${slugify(category)}`,
      },

      {
        "@type": "ListItem",

        position: 4,

        name,

        item: canonicalUrl,
      },
    ],
  };
}

/* =========================================================
   FAQ / WEBPAGE SCHEMA
   ========================================================= */

function createWebPageSchema({
  name,
  description,
  canonicalUrl,
}: {
  name: string;
  description: string;
  canonicalUrl: string;
}) {
  return {
    "@context": "https://schema.org",

    "@type": "WebPage",

    name,

    description,

    url: canonicalUrl,

    isPartOf: {
      "@type": "WebSite",

      name: SITE_NAME,

      url: SITE_URL,
    },

    publisher: {
      "@type": "Organization",

      name: SITE_NAME,

      url: SITE_URL,
    },
  };
}

/* =========================================================
   LAYOUT
   ========================================================= */

export default async function ToolLayout({
  children,
  params,
}: {
  children: ReactNode;

  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;

  const tool = await getTool(slug);

  const name = getToolName(
    tool,
    slug
  );

  const category = getCategory(tool);

  const description = makeDescription(
    tool?.description
  );

  const canonicalSlug = getCanonicalSlug(
    tool,
    slug
  );

  const canonicalUrl =
    `${SITE_URL}/tool/${canonicalSlug}`;

  /* =======================================================
     STRUCTURED DATA
     ======================================================= */

  const softwareSchema = createSoftwareSchema({
    tool,
    name,
    category,
    description,
    canonicalUrl,
  });

  const breadcrumbSchema =
    createBreadcrumbSchema({
      name,
      category,
      canonicalUrl,
    });

  const webPageSchema =
    createWebPageSchema({
      name,
      description,
      canonicalUrl,
    });

  return (
    <>
      {/* ===================================================
          SOFTWARE APPLICATION JSON-LD
          =================================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            softwareSchema
          ),
        }}
      />

      {/* ===================================================
          BREADCRUMB JSON-LD
          =================================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema
          ),
        }}
      />

      {/* ===================================================
          WEBPAGE JSON-LD
          =================================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema
          ),
        }}
      />

      {children}
    </>
  );
}
