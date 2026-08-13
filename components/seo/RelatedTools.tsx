import Link from "next/link";

type Tool = {
  name: string;
  slug: string;
  logo?: string | null;
  ai_vault_score?: number | null;
};

export function RelatedTools({
  tools,
}: {
  tools: Tool[];
}) {
  if (!tools?.length) return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold">
        Related AI Tools
      </h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.slice(0, 6).map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="rounded-xl border p-4 transition hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              {tool.logo && (
                <img
                  src={tool.logo}
                  alt=""
                  className="h-10 w-10 rounded-lg object-contain"
                  loading="lazy"
                />
              )}

              <div>
                <h3 className="font-semibold">
                  {tool.name}
                </h3>

                {tool.ai_vault_score != null && (
                  <p className="text-sm opacity-70">
                    AI Vault Score {tool.ai_vault_score}/100
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
