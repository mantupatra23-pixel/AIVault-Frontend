import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const SITE_URL = "https://www.aivault.pp.ua";
const SITE_NAME = "AI Vault";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ToolRecord = {
  id?: string | number | null;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  category?: string | null;
  pricing?: string | null;
  website_url?: string | null;
  created_at?: string | null;
};

type ToolData = {
  id: string | number | null;
  name: string;
  slug: string;
  description: string;
  category: string;
  pricing: string;
  websiteUrl: string;
  createdAt?: string;
};

/* =========================================================
   SUPABASE
========================================================= */

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("[AI_VAULT] Missing Supabase environment variables");
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/* =========================================================
   HELPERS
========================================================= */

function normalizeSlug(value: string | null | undefined): string {
  if (!value) return "";

  return decodeURIComponent(value)
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");
}

function cleanText(
  value: string | null | undefined
): string | undefined {
  if (!value) return undefined;

  const cleaned = String(value).trim();

  return cleaned.length > 0 ? cleaned : undefined;
}

function normalizeWebsite(
  value: string | null | undefined
): string {
  if (!value) return "";

  let url = String(value).trim();

  if (!url) return "";

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  return url;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pricingLabel(
  value: string | null | undefined
): string {
  if (!value) return "Free";

  const normalized = value.trim().toLowerCase();

  if (normalized.includes("free")) return "Free";
  if (normalized.includes("freemium")) return "Freemium";
  if (normalized.includes("paid")) return "Paid";
  if (normalized.includes("premium")) return "Premium";

  return value.trim();
}

function categoryLabel(
  value: string | null | undefined
): string {
  if (!value) return "AI Tools";

  return value
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function descriptionText(
  description: string | null | undefined,
  name: string,
  category: string
): string {
  const cleaned = cleanText(description);

  if (cleaned) return cleaned;

  return `${name} is an AI tool in the ${category} category. Explore its features, pricing, and official website on AI Vault.`;
}

/* =========================================================
   DATABASE MAPPER
========================================================= */

function mapTool(record: ToolRecord): ToolData {
  const name =
    cleanText(record.name) ||
    "AI Tool";

  const slug =
    normalizeSlug(record.slug) ||
    slugify(name);

  const category =
    categoryLabel(record.category);

  const description =
    descriptionText(
      record.description,
      name,
      category
    );

  const websiteUrl =
    normalizeWebsite(record.website_url);

  return {
    id: record.id ?? null,
    name,
    slug,
    description,
    category,
    pricing: pricingLabel(record.pricing),
    websiteUrl,
    createdAt: cleanText(record.created_at),
  };
}

/* =========================================================
   TOOL QUERY
========================================================= */

async function getTool(
  requestedSlug: string
): Promise<ToolData | null> {
  const supabase = getSupabase();

  if (!supabase) {
    console.error(
      "[AI_VAULT] Supabase client could not be created"
    );

    return null;
  }

  const slug = normalizeSlug(requestedSlug);

  if (!slug) {
    console.error(
      "[AI_VAULT] Empty tool slug"
    );

    return null;
  }

  /*
   * IMPORTANT:
   *
   * Database columns confirmed from Supabase:
   *
   * id
   * name
   * slug
   * description
   * category
   * pricing
   * website_url
   * created_at
   *
   * DO NOT add:
   * website
   * updated_at
   */

  const fields =
    "id,name,slug,description,category,pricing,website_url,created_at";

  /* -------------------------------------------------------
     1. EXACT SLUG MATCH
  ------------------------------------------------------- */

  const {
    data: exactRecord,
    error: exactError,
  } = await supabase
    .from("ai_tools")
    .select(fields)
    .eq("slug", slug)
    .maybeSingle();

  if (exactError) {
    console.error(
      "[AI_VAULT] Exact tool query failed:",
      {
        message: exactError.message,
        details: exactError.details,
        hint: exactError.hint,
        code: exactError.code,
        slug,
      }
    );
  }

  if (exactRecord) {
    console.log(
      "[AI_VAULT] Exact tool found:",
      slug
    );

    return mapTool(
      exactRecord as ToolRecord
    );
  }

  /* -------------------------------------------------------
     2. CASE-INSENSITIVE FALLBACK
  ------------------------------------------------------- */

  const {
    data: fallbackRecords,
    error: fallbackError,
  } = await supabase
    .from("ai_tools")
    .select(fields)
    .ilike("slug", slug)
    .limit(1);

  if (fallbackError) {
    console.error(
      "[AI_VAULT] Fallback tool query failed:",
      {
        message: fallbackError.message,
        details: fallbackError.details,
        hint: fallbackError.hint,
        code: fallbackError.code,
        slug,
      }
    );
  }

  if (
    fallbackRecords &&
    fallbackRecords.length > 0
  ) {
    console.log(
      "[AI_VAULT] Fallback tool found:",
      slug
    );

    return mapTool(
      fallbackRecords[0] as ToolRecord
    );
  }

  /* -------------------------------------------------------
     3. SAFE NAME FALLBACK
     Only used if slug was generated incorrectly.
  ------------------------------------------------------- */

  const possibleName = slug
    .replace(/-/g, " ")
    .trim();

  if (possibleName) {
    const {
      data: nameRecords,
      error: nameError,
    } = await supabase
      .from("ai_tools")
      .select(fields)
      .ilike("name", possibleName)
      .limit(1);

    if (nameError) {
      console.error(
        "[AI_VAULT] Name fallback query failed:",
        {
          message: nameError.message,
          code: nameError.code,
          slug,
        }
      );
    }

    if (
      nameRecords &&
      nameRecords.length > 0
    ) {
      console.log(
        "[AI_VAULT] Name fallback found:",
        possibleName
      );

      return mapTool(
        nameRecords[0] as ToolRecord
      );
    }
  }

  console.error(
    "[AI_VAULT] TOOL NOT FOUND:",
    {
      requestedSlug,
      normalizedSlug: slug,
    }
  );

  return null;
}

/* =========================================================
   METADATA
========================================================= */

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { slug } = await params;

  const tool = await getTool(slug);

  if (!tool) {
    return {
      title: "AI Tool Not Found | AI Vault",
      description:
        "The requested AI tool could not be found in the AI Vault directory.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title =
    `${tool.name} — AI Tool Review, Pricing & Website | AI Vault`;

  const description =
    tool.description.slice(0, 155);

  const canonical =
    `${SITE_URL}/tool/${tool.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

/* =========================================================
   PAGE
========================================================= */

export default async function ToolPage(
  { params }: PageProps
) {
  const { slug: requestedSlug } =
    await params;

  const slug =
    normalizeSlug(requestedSlug);

  if (!slug) {
    notFound();
  }

  const tool =
    await getTool(slug);

  if (!tool) {
    notFound();
  }

  const canonicalUrl =
    `${SITE_URL}/tool/${tool.slug}`;

  const websiteAvailable =
    Boolean(tool.websiteUrl);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link
            href="/"
            className="text-xl font-black tracking-tight"
          >
            AI Vault<span className="text-blue-600">.</span>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:border-blue-500 hover:text-blue-600"
          >
            ← AI Directory
          </Link>
        </div>
      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        {/* Breadcrumb */}

        <nav
          aria-label="Breadcrumb"
          className="mb-8 text-sm text-slate-500"
        >
          <Link
            href="/"
            className="hover:text-blue-600"
          >
            AI Vault
          </Link>

          <span className="mx-2">
            /
          </span>

          <span>
            {tool.category}
          </span>

          <span className="mx-2">
            /
          </span>

          <span className="text-slate-800">
            {tool.name}
          </span>
        </nav>

        {/* Hero */}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-5">
              {/* Icon */}

              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-black text-white shadow-lg">
                {tool.name
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                    Verified AI Tool
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {tool.pricing}
                  </span>
                </div>

                <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                  {tool.name}
                </h1>

                <p className="mt-3 text-base font-semibold text-blue-600">
                  {tool.category}
                </p>
              </div>
            </div>

            {websiteAvailable && (
              <a
                href={tool.websiteUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700"
              >
                Visit Website →
              </a>
            )}
          </div>

          {/* Description */}

          <div className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-black">
              About {tool.name}
            </h2>

            <p className="mt-4 max-w-4xl whitespace-pre-line text-base leading-8 text-slate-600">
              {tool.description}
            </p>
          </div>

          {/* Details */}

          <div className="mt-10 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Category
              </p>

              <p className="mt-2 font-bold text-slate-900">
                {tool.category}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Pricing
              </p>

              <p className="mt-2 font-bold text-slate-900">
                {tool.pricing}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Slug
              </p>

              <p className="mt-2 break-all font-mono text-sm font-bold text-slate-900">
                {tool.slug}
              </p>
            </div>
          </div>

          {/* Website */}

          {websiteAvailable && (
            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                Official Website
              </p>

              <a
                href={tool.websiteUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-2 block break-all font-semibold text-blue-700 hover:underline"
              >
                {tool.websiteUrl}
              </a>
            </div>
          )}
        </div>

        {/* Back */}

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold transition hover:border-blue-500 hover:text-blue-600"
          >
            ← Back to AI Directory
          </Link>
        </div>
      </section>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} AI Vault. All rights reserved.
          </p>

          <div className="flex gap-5">
            <Link
              href="/about"
              className="hover:text-slate-900"
            >
              About
            </Link>

            <Link
              href="/contact"
              className="hover:text-slate-900"
            >
              Contact
            </Link>

            <Link
              href="/privacy"
              className="hover:text-slate-900"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="hover:text-slate-900"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>

      {/* =================================================
          STRUCTURED DATA
      ================================================= */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context":
              "https://schema.org",
            "@type":
              "SoftwareApplication",
            name: tool.name,
            description:
              tool.description,
            applicationCategory:
              tool.category,
            url: canonicalUrl,
            ...(tool.websiteUrl
              ? {
                  sameAs:
                    tool.websiteUrl,
                }
              : {}),
          }),
        }}
      />
    </main>
  );
}
