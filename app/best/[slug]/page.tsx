import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://aivault-backend.onrender.com";

type Tool = {
  id?: string;
  name?: string;
  slug?: string;
  category?: string;
  description?: string;
  meta_description?: string;
  website_url?: string;
  image_url?: string;
  pricing?: string;
  score?: number;
};

async function getTools(): Promise<Tool[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/tools?limit=50`,
      {
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.tools)) return data.tools;

    return [];
  } catch {
    return [];
  }
}

async function getTool(slug: string): Promise<Tool | null> {
  const tools = await getTools();

  return (
    tools.find(
      (tool) =>
        String(tool.slug || "").toLowerCase() ===
        slug.toLowerCase()
    ) || null
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getTool(slug);

  if (!tool) {
    return {
      title: "AI Tools | AI Vault",
      description:
        "Discover the best AI tools on AI Vault.",
    };
  }

  const title = `Best ${tool.name} Alternatives & AI Tools | AI Vault`;

  const description =
    tool.meta_description ||
    `Discover ${tool.name}, its features, pricing, alternatives and best use cases on AI Vault.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/best/${tool.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/best/${tool.slug}`,
      images: tool.image_url
        ? [tool.image_url]
        : undefined,
    },
  };
}

export default async function BestToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await getTool(slug);

  if (!tool) notFound();

  const score =
    typeof tool.score === "number"
      ? tool.score
      : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description:
      tool.description ||
      tool.meta_description ||
      "",
    applicationCategory:
      tool.category || "AI Tool",
    url: tool.website_url,
    image: tool.image_url,
    aggregateRating:
      score > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Math.min(
              5,
              Math.max(1, score / 20)
            ).toFixed(1),
            bestRating: "5",
            worstRating: "1",
            ratingCount: "1",
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">

          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-slate-400">
            <Link
              href="/"
              className="hover:text-white"
            >
              Home
            </Link>

            <span className="mx-2">/</span>

            <Link
              href="/best"
              className="hover:text-white"
            >
              Best AI Tools
            </Link>

            <span className="mx-2">/</span>

            <span className="text-slate-200">
              {tool.name}
            </span>
          </nav>

          {/* Hero */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 md:p-12">

            <div className="flex flex-col gap-8 md:flex-row md:items-center">

              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-white">

                {tool.image_url ? (
                  <img
                    src={tool.image_url}
                    alt={`${tool.name} logo`}
                    className="h-full w-full object-contain p-3"
                  />
                ) : (
                  <span className="text-2xl font-bold text-slate-900">
                    {tool.name?.slice(0, 2).toUpperCase()}
                  </span>
                )}

              </div>

              <div className="flex-1">

                <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-400">
                  Best AI Tool
                </p>

                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                  {tool.name}
                </h1>

                {tool.category && (
                  <p className="mt-3 text-slate-400">
                    {tool.category}
                  </p>
                )}

              </div>

              {score > 0 && (
                <div className="rounded-2xl border border-slate-700 bg-slate-950 p-5 text-center">
                  <div className="text-3xl font-bold">
                    {score}
                  </div>
                  <div className="text-xs text-slate-400">
                    AI Vault Score
                  </div>
                </div>
              )}

            </div>

            {tool.description && (
              <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-300">
                {tool.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">

              {tool.website_url && (
                <a
                  href={tool.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold transition hover:bg-indigo-500"
                >
                  Visit {tool.name}
                </a>
              )}

              {tool.pricing && (
                <span className="rounded-xl border border-slate-700 px-6 py-3 text-slate-300">
                  {tool.pricing}
                </span>
              )}

            </div>
          </section>

          {/* SEO Content */}
          <section className="mt-10 grid gap-8 md:grid-cols-3">

            <article className="md:col-span-2 rounded-3xl border border-slate-800 bg-slate-900 p-8">

              <h2 className="text-2xl font-bold">
                Why {tool.name} is Worth Considering
              </h2>

              <p className="mt-5 leading-8 text-slate-300">
                {tool.name} is an AI-powered tool listed
                in the AI Vault directory. This page helps
                users understand what the tool does, who it
                is useful for, and how it compares with other
                solutions available in the AI ecosystem.
              </p>

              <h2 className="mt-10 text-2xl font-bold">
                Features and Use Cases
              </h2>

              <p className="mt-5 leading-8 text-slate-300">
                Explore the capabilities, workflows and
                practical applications of {tool.name}.
                Depending on your goals, it may be useful
                for individuals, creators, developers,
                marketers, businesses or teams.
              </p>

            </article>

            <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-8">

              <h2 className="text-xl font-bold">
                Tool Information
              </h2>

              <dl className="mt-6 space-y-5">

                <div>
                  <dt className="text-sm text-slate-500">
                    Category
                  </dt>
                  <dd className="mt-1 font-medium">
                    {tool.category || "AI Tool"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-slate-500">
                    Pricing
                  </dt>
                  <dd className="mt-1 font-medium">
                    {tool.pricing || "Check website"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm text-slate-500">
                    AI Vault Score
                  </dt>
                  <dd className="mt-1 font-medium">
                    {score || "Not rated"}
                  </dd>
                </div>

              </dl>

            </aside>

          </section>

          {/* Related SEO links */}
          <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-8">

            <h2 className="text-2xl font-bold">
              Explore More AI Tools
            </h2>

            <div className="mt-6 flex flex-wrap gap-3">

              <Link
                href="/tools"
                className="rounded-xl border border-slate-700 px-5 py-3 hover:bg-slate-800"
              >
                AI Tools Directory
              </Link>

              <Link
                href="/trending"
                className="rounded-xl border border-slate-700 px-5 py-3 hover:bg-slate-800"
              >
                Trending AI Tools
              </Link>

              <Link
                href="/new"
                className="rounded-xl border border-slate-700 px-5 py-3 hover:bg-slate-800"
              >
                New AI Tools
              </Link>

              <Link
                href="/hidden-gems"
                className="rounded-xl border border-slate-700 px-5 py-3 hover:bg-slate-800"
              >
                Hidden Gems
              </Link>

            </div>

          </section>

        </div>
      </main>
    </>
  );
}
