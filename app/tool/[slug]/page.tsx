import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Ensure page dynamically fetches from DB without stale static parameter bounding
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

async function getTool(rawSlug: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const decodedSlug = decodeURIComponent(rawSlug);

    // Safe, exact lookup using maybeSingle() to avoid PGRST116 single() exceptions
    const { data, error } = await supabase
      .from("ai_tools")
      .select("*")
      .eq("slug", decodedSlug)
      .maybeSingle();

    if (error) {
      console.error(`[DB_LOOKUP_ERROR] slug=${decodedSlug} code=${error.code} msg=${error.message}`);
      return null;
    }

    return data;
  } catch (err) {
    console.error(`[TOOL_FETCH_EXCEPT] rawSlug=${rawSlug}`, err);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const tool = await getTool(resolvedParams.slug);

  if (!tool) {
    return {
      title: "Tool Not Found | AIVault",
      description: "Discover verified AI tools and services on AIVault.",
      robots: { index: false, follow: true },
    };
  }

  const canonicalUrl = `https://aivault.pp.ua/tool/${tool.slug}`;
  const title = tool.meta_title || `${tool.name} — AI Tool Features & Reviews`;
  const description =
    tool.meta_description ||
    tool.description?.replace(/(<([^>]+)>)/gi, "").slice(0, 155) ||
    `Explore ${tool.name} features, pricing, and use cases on AIVault.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${tool.name} | AIVault`,
      description,
      url: canonicalUrl,
      siteName: "AIVault",
      type: "website",
      images: tool.image_url ? [{ url: tool.image_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} | AIVault`,
      description,
      images: tool.image_url ? [tool.image_url] : [],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ToolPage({ params }: Props) {
  const resolvedParams = await params;
  const tool = await getTool(resolvedParams.slug);

  if (!tool) {
    notFound();
  }

  // Schema.org Grounded JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description,
    applicationCategory: tool.category || "BusinessApplication",
    operatingSystem: "Web",
    offers: tool.pricing
      ? {
          "@type": "Offer",
          priceCurrency: "USD",
          description: tool.pricing,
        }
      : undefined,
    url: tool.website_url || `https://aivault.pp.ua/tool/${tool.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Existing UI layout components rendering tool details */}
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="flex items-center gap-6 mb-8">
            {tool.image_url && (
              <img
                src={tool.image_url}
                alt={tool.name}
                className="w-20 h-20 rounded-2xl object-cover bg-slate-900 border border-slate-800"
              />
            )}
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">{tool.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {tool.category || "AI Tool"}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {tool.pricing || "Freemium"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4">About {tool.name}</h2>
                <div className="text-slate-300 leading-relaxed whitespace-pre-line">
                  {tool.description}
                </div>
              </div>

              {tool.pros_cons && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">Pros & Cons</h2>
                  <div className="text-slate-300 leading-relaxed whitespace-pre-line">
                    {tool.pros_cons}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
                <a
                  href={tool.website_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 px-4 text-center font-bold text-slate-950 bg-gradient-to-r from-blue-400 to-emerald-400 hover:opacity-90 rounded-xl transition"
                >
                  Visit Official Website ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
