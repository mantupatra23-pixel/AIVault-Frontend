import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://aivault-faqc.onrender.com";

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
      `${API_URL}/api/tools?limit=100`,
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

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

async function getUseCaseTools(
  slug: string
): Promise<Tool[]> {
  const tools = await getTools();

  const words = slug
    .toLowerCase()
    .split("-")
    .filter(Boolean);

  const matched = tools.filter((tool) => {
    const text = `
      ${tool.name || ""}
      ${tool.category || ""}
      ${tool.description || ""}
      ${tool.meta_description || ""}
    `.toLowerCase();

    return words.some((word) =>
      text.includes(word)
    );
  });

  return matched.slice(0, 30);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const useCase = titleFromSlug(slug);

  const title = `Best AI Tools for ${useCase} | AI Vault`;

  const description =
    `Discover the best AI tools for ${useCase}. Compare AI tools, find free alternatives and build the perfect AI stack with AI Vault.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/use-case/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/use-case/${slug}`,
    },
  };
}

export default async function UseCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const useCase = titleFromSlug(slug);

  const tools = await getUseCaseTools(slug);

  if (!slug) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Best AI Tools for ${useCase}`,
    description:
      `Discover the best AI tools for ${useCase}.`,
    url: `https://aivault.pp.ua/use-case/${slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: tools.map(
        (tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.name,
          url: tool.slug
            ? `https://aivault.pp.ua/best/${tool.slug}`
            : tool.website_url,
        })
      ),
    },
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

        <div className="mx-auto max-w-7xl px-6 py-12">

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
              href="/use-case"
              className="hover:text-white"
            >
              Use Cases
            </Link>

            <span className="mx-2">/</span>

            <span className="text-slate-200">
              {useCase}
            </span>

          </nav>

          {/* Hero */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 md:p-12">

            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
              AI Use Case
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
              Best AI Tools for {useCase}
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              Discover AI tools that can help with{" "}
              {useCase.toLowerCase()}.
              Compare solutions, explore features,
              pricing and find tools that match your
              workflow.
            </p>

          </section>

          {/* Tool Grid */}
          <section className="mt-10">

            <div className="mb-6 flex items-end justify-between">

              <div>
                <h2 className="text-2xl font-bold">
                  Recommended AI Tools
                </h2>

                <p className="mt-2 text-slate-400">
                  {tools.length} tools discovered
                </p>
              </div>

            </div>

            {tools.length === 0 ? (

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10 text-center">

                <h2 className="text-xl font-semibold">
                  More tools coming soon
                </h2>

                <p className="mt-3 text-slate-400">
                  AI Vault is continuously expanding
                  its AI tool directory.
                </p>

                <Link
                  href="/tools"
                  className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold hover:bg-indigo-500"
                >
                  Browse All AI Tools
                </Link>

              </div>

            ) : (

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                {tools.map((tool) => (

                  <article
                    key={
                      tool.id ||
                      tool.slug ||
                      tool.name
                    }
                    className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-slate-600"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">

                        {tool.image_url ? (
                          <img
                            src={tool.image_url}
                            alt={`${tool.name} logo`}
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <span className="font-bold text-slate-900">
                            {tool.name
                              ?.slice(0, 2)
                              .toUpperCase()}
                          </span>
                        )}

                      </div>

                      <div className="min-w-0">

                        <h3 className="truncate text-lg font-bold">
                          {tool.name}
                        </h3>

                        <p className="text-sm text-slate-500">
                          {tool.category ||
                            "AI Tool"}
                        </p>

                      </div>

                    </div>

                    {tool.description && (
                      <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-400">
                        {tool.description}
                      </p>
                    )}

                    <div className="mt-5 flex items-center justify-between">

                      {tool.score ? (
                        <span className="rounded-lg bg-slate-800 px-3 py-1 text-sm">
                          Score {tool.score}
                        </span>
                      ) : (
                        <span />
                      )}

                      {tool.slug ? (
                        <Link
                          href={`/best/${tool.slug}`}
                          className="font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                          View Tool →
                        </Link>
                      ) : tool.website_url ? (
                        <a
                          href={tool.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                          Visit →
                        </a>
                      ) : null}

                    </div>

                  </article>

                ))}

              </div>

            )}

          </section>

          {/* SEO Content */}
          <section className="mt-12 rounded-3xl border border-slate-800 bg-slate-900 p-8 md:p-10">

            <h2 className="text-2xl font-bold">
              How to Choose the Best AI Tools for{" "}
              {useCase}
            </h2>

            <div className="mt-6 space-y-5 leading-8 text-slate-300">

              <p>
                Choosing the right AI tool depends on
                your workflow, budget, experience level
                and the specific result you want to
                achieve.
              </p>

              <p>
                AI Vault helps you discover and compare
                AI software across categories and use
                cases. You can explore individual tools,
                compare alternatives and build complete
                AI stacks for your workflow.
              </p>

              <p>
                Before choosing a tool, consider its
                features, pricing, integrations, ease of
                use and whether it fits your existing
                workflow.
              </p>

            </div>

          </section>

          {/* Internal Links */}
          <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-8">

            <h2 className="text-xl font-bold">
              Explore AI Vault
            </h2>

            <div className="mt-5 flex flex-wrap gap-3">

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
                Trending Tools
              </Link>

              <Link
                href="/new"
                className="rounded-xl border border-slate-700 px-5 py-3 hover:bg-slate-800"
              >
                New AI Tools
              </Link>

              <Link
                href="/comparisons"
                className="rounded-xl border border-slate-700 px-5 py-3 hover:bg-slate-800"
              >
                AI Comparisons
              </Link>

              <Link
                href="/stacks"
                className="rounded-xl border border-slate-700 px-5 py-3 hover:bg-slate-800"
              >
                AI Stack Builder
              </Link>

            </div>

          </section>

        </div>
      </main>
    </>
  );
}
