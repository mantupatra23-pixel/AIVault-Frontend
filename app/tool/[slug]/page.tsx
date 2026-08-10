import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// Force dynamic server-side rendering so newly vaulted DB tools resolve immediately
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

// Data Fetcher 1: Fetch Primary Tool Record
async function getTool(rawSlug: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const decodedSlug = decodeURIComponent(rawSlug);
    const { data, error } = await supabase
      .from("ai_tools")
      .select("*")
      .eq("slug", decodedSlug)
      .maybeSingle();

    if (error) {
      console.error(`[DB_ERROR] slug=${decodedSlug}`, error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`[FETCH_EXCEPT] rawSlug=${rawSlug}`, err);
    return null;
  }
}

// Data Fetcher 2: Fetch Related Category Tools
async function getRelatedTools(category: string, currentSlug: string) {
  const supabase = getSupabaseClient();
  if (!supabase || !category) return [];

  try {
    const { data } = await supabase
      .from("ai_tools")
      .select("name, slug, category, pricing, neural_score, image_url, description")
      .eq("category", category)
      .neq("slug", currentSlug)
      .limit(3);

    return data || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const tool = await getTool(resolvedParams.slug);

  if (!tool) {
    return {
      title: "Tool Not Found | VISORA Intelligence",
      description: "Explore verified AI tools and neural software in the VISORA directory.",
      robots: { index: false, follow: true },
    };
  }

  const canonicalUrl = `https://aivault.pp.ua/tool/${tool.slug}`;
  const title = tool.meta_title || `${tool.name} — AI Features & Neural Analysis | VISORA`;
  const description =
    tool.meta_description ||
    tool.description?.replace(/(<([^>]+)>)/gi, "").slice(0, 155) ||
    `Explore ${tool.name} features, specifications, and live analysis on VISORA.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${tool.name} | VISORA AI Vault`,
      description,
      url: canonicalUrl,
      siteName: "VISORA",
      type: "website",
      images: tool.image_url ? [{ url: tool.image_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} | VISORA`,
      description,
      images: tool.image_url ? [tool.image_url] : [],
    },
    robots: { index: true, follow: true },
  };
}

export default async function ToolPage({ params }: Props) {
  const resolvedParams = await params;
  const tool = await getTool(resolvedParams.slug);

  if (!tool) {
    notFound();
  }

  const relatedTools = await getRelatedTools(tool.category || "", tool.slug);
  const firstLetter = (tool.name || "A").charAt(0).toUpperCase();
  const scoreDisplay = tool.neural_score
    ? Number(tool.neural_score).toFixed(1)
    : tool.score
    ? (tool.score / 10).toFixed(1)
    : "8.5";

  // Format Pros & Cons lists cleanly from DB strings or arrays
  const parseList = (input: any) => {
    if (Array.isArray(input)) return input;
    if (typeof input === "string") {
      return input.split(/\n|•|\*/).map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const prosList = parseList(tool.pros || tool.pros_cons);
  const consList = parseList(tool.cons);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description,
    applicationCategory: tool.category || "Application",
    operatingSystem: "Web",
    offers: tool.pricing ? { "@type": "Offer", description: tool.pricing } : undefined,
    url: tool.website_url || `https://aivault.pp.ua/tool/${tool.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        {/* === HEADER === */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tight text-slate-950 font-serif">
                VISORA<span className="text-blue-600">.</span>
              </span>
            </Link>

            <a
              href={tool.website_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-sm hover:shadow-blue-500/20 active:scale-95"
            >
              Visit Portal ↗
            </a>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
          {/* === HERO SECTION === */}
          <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5 sm:gap-6">
                {/* SSR Safe Image Avatar Wrapper */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-3xl sm:text-4xl flex items-center justify-center shadow-md overflow-hidden flex-shrink-0 border border-slate-100">
                  {tool.image_url ? (
                    <img
                      src={tool.image_url}
                      alt={tool.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="select-none">{firstLetter}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">
                      {tool.category || "AI Engine"}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-slate-100 text-slate-700">
                      {tool.pricing || "Freemium"}
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 font-serif">
                    {tool.name}
                  </h1>
                </div>
              </div>

              {/* Neural Score Display */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Neural Score
                </span>
                <div className="text-3xl sm:text-4xl font-black text-blue-600 tracking-tight font-serif">
                  {scoreDisplay}
                  <span className="text-base font-normal text-slate-400">/10</span>
                </div>
              </div>
            </div>
          </section>

          {/* === STRATEGIC SUMMARY === */}
          <section className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-extrabold tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Strategic Summary
              </div>
              <p className="text-lg sm:text-2xl font-serif text-slate-100 leading-relaxed">
                “Visora network intelligence identifies{" "}
                <strong className="text-white underline decoration-blue-500 underline-offset-4">
                  {tool.name}
                </strong>{" "}
                as a highly optimized verified engine tailored for{" "}
                <span className="text-blue-300">{tool.category || "Productivity"}</span> operations.”
              </p>
            </div>
          </section>

          {/* === MAIN CONTENT & SPECIFICATIONS GRID === */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left 2 Columns: Description & Reviews */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
                  Engine Overview & Verification
                </h2>
                <div className="prose prose-slate max-w-none text-slate-700 text-base sm:text-lg leading-relaxed whitespace-pre-line">
                  {tool.description || "No full description currently available for this neural asset."}
                </div>
              </div>

              {/* Pros & Cons Section */}
              {(prosList.length > 0 || consList.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Pros */}
                  <div className="bg-white border border-emerald-100/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-emerald-700 text-xs font-extrabold tracking-widest uppercase">
                      <span className="text-base">✓</span> Global Edge (Pros)
                    </div>
                    <ul className="space-y-2.5 text-sm text-slate-700">
                      {prosList.map((pro: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div className="bg-white border border-amber-100/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-amber-700 text-xs font-extrabold tracking-widest uppercase">
                      <span className="text-base">×</span> Friction Warning (Cons)
                    </div>
                    <ul className="space-y-2.5 text-sm text-slate-700">
                      {consList.length > 0 ? (
                        consList.map((con: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{con}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-400 italic">No critical operational cons recorded.</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: System Specification Sidebar */}
            <div className="space-y-6 lg:sticky lg:top-28">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  System Specification
                </h3>

                <dl className="space-y-4 text-sm divide-y divide-slate-100">
                  <div className="pt-2 flex justify-between items-center">
                    <dt className="text-slate-500 font-medium">Blueprint</dt>
                    <dd className="font-bold text-slate-900">{tool.name}</dd>
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    <dt className="text-slate-500 font-medium">Operation Niche</dt>
                    <dd className="font-bold text-blue-600">{tool.category || "General AI"}</dd>
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    <dt className="text-slate-500 font-medium">Deployment Cost</dt>
                    <dd className="font-bold text-emerald-600">{tool.pricing || "Freemium"}</dd>
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    <dt className="text-slate-500 font-medium">Crawl Verification</dt>
                    <dd className="inline-flex items-center gap-1.5 font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      VERIFIED
                    </dd>
                  </div>
                </dl>

                {/* Primary CTA Button */}
                <a
                  href={tool.website_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center py-4 px-6 text-sm font-extrabold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all shadow-md hover:shadow-blue-500/25 active:scale-98"
                >
                  Visit Official Portal ↗
                </a>
              </div>
            </div>
          </div>

          {/* === RELATED TOOLS / NEURAL DISCOVERY === */}
          {relatedTools.length > 0 && (
            <section className="pt-8 border-t border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Neural Discovery // Related Engines
                </h2>
                <Link href="/" className="text-xs font-bold text-blue-600 hover:underline">
                  View Directory ↗
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedTools.map((rel: any) => {
                  const relLetter = (rel.name || "A").charAt(0).toUpperCase();
                  const relScore = rel.neural_score ? Number(rel.neural_score).toFixed(1) : "8.5";

                  return (
                    <Link
                      key={rel.slug}
                      href={`/tool/${rel.slug}`}
                      className="group bg-white border border-slate-100 hover:border-blue-200 rounded-3xl p-6 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xl flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                            {rel.image_url ? (
                              <img
                                src={rel.image_url}
                                alt={rel.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="select-none">{relLetter}</span>
                            )}
                          </div>

                          <span className="text-xs font-bold text-blue-600 font-serif">
                            ★ {relScore}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {rel.name}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                            {rel.description || "Verified AI automation asset."}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>{rel.category || "AI Engine"}</span>
                        <span className="text-blue-600 group-hover:translate-x-1 transition-transform">
                          Inspect →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
