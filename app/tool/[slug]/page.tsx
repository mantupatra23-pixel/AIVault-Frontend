import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ToolLogo } from "@/components/ToolLogo";
import { AdSlot } from "@/components/AdSlot";
import { SITE_URL } from "@/lib/site-url";
import { DatabaseToolRecord, FormattedListItem, FAQItem } from "@/types/tool";
import {
  extractYouTubeId,
  normalizeScore,
  parseProsConsColumn,
  generateToolSpecificEnrichment,
} from "@/lib/tool-normalizer";

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

async function getToolFromDatabase(rawSlug: string): Promise<DatabaseToolRecord | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !rawSlug) return null;

  try {
    const cleanSlug = decodeURIComponent(rawSlug).toLowerCase().trim();

    // 1. Direct PostgREST Lookup via .from("ai_tools")
    let { data, error } = await supabase
      .from("ai_tools")
      .select("id, name, slug, category, pricing, description, website_url, official_url, affiliate_url, youtube_url, youtube_id, score, neural_score, rating, image_url, logo_url, features_pros, limitations_cons, who_should_use, how_to_use, pricing_details, tags, faqs, seo_title, seo_description, pros_cons")
      .eq("slug", cleanSlug)
      .maybeSingle();

    // 2. Case-insensitive fallback lookup
    if (!data) {
      const res = await supabase
        .from("ai_tools")
        .select("id, name, slug, category, pricing, description, website_url, official_url, affiliate_url, youtube_url, youtube_id, score, neural_score, rating, image_url, logo_url, features_pros, limitations_cons, who_should_use, how_to_use, pricing_details, tags, faqs, seo_title, seo_description, pros_cons")
        .ilike("slug", cleanSlug)
        .maybeSingle();
      data = res.data;
    }

    if (error || !data) return null;

    let record = data as DatabaseToolRecord;

    // Self-healing write-back: Enrich missing JSONB fields if absent in DB
    if (!record.who_should_use || !record.features_pros || record.features_pros.length === 0) {
      const enrichment = generateToolSpecificEnrichment(record);

      const parsedFromProsCons = parseProsConsColumn(record.pros_cons);

      const finalPros = record.features_pros && record.features_pros.length > 0 
        ? record.features_pros 
        : parsedFromProsCons.pros.length > 0 
        ? parsedFromProsCons.pros 
        : (enrichment.features_pros || []);

      const finalCons = record.limitations_cons && record.limitations_cons.length > 0 
        ? record.limitations_cons 
        : parsedFromProsCons.cons.length > 0 
        ? parsedFromProsCons.cons 
        : (enrichment.limitations_cons || []);

      record = {
        ...record,
        description: record.description || enrichment.description || null,
        features_pros: finalPros,
        limitations_cons: finalCons,
        who_should_use: record.who_should_use || enrichment.who_should_use || null,
        how_to_use: record.how_to_use || enrichment.how_to_use || null,
        pricing_details: record.pricing_details || enrichment.pricing_details || null,
        tags: record.tags || enrichment.tags || null,
        faqs: record.faqs || enrichment.faqs || null,
        seo_title: record.seo_title || enrichment.seo_title || null,
        seo_description: record.seo_description || enrichment.seo_description || null,
      };

      // Asynchronous server-side database write-back using .from('ai_tools')
      supabase
        .from("ai_tools")
        .update({
          description: record.description,
          features_pros: record.features_pros,
          limitations_cons: record.limitations_cons,
          who_should_use: record.who_should_use,
          how_to_use: record.how_to_use,
          pricing_details: record.pricing_details,
          tags: record.tags,
          faqs: record.faqs,
          seo_title: record.seo_title,
          seo_description: record.seo_description,
        })
        .eq("id", record.id)
        .then(({ error: writeErr }) => {
          if (writeErr) {
            console.error("[DB_WRITE_BACK_ERR] slug=" + cleanSlug, writeErr.message);
          }
        });
    }

    return record;
  } catch {
    return null;
  }
}

async function getRelatedTools(category: string, currentSlug: string) {
  const supabase = getSupabaseClient();
  if (!supabase || !category) return [];

  try {
    const { data } = await supabase
      .from("ai_tools")
      .select("name, slug, category, pricing, image_url, logo_url, description")
      .ilike("category", `%${category}%`)
      .neq("slug", currentSlug)
      .limit(8);

    return data || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const tool = await getToolFromDatabase(resolvedParams.slug);

  if (!tool) {
    return {
      title: "Tool Not Found | AI Vault",
      description: "The requested software tool could not be found in our verified database index.",
      robots: { index: false, follow: true },
    };
  }

  const canonicalUrl = `${SITE_URL}/tool/${tool.slug}`;
  const title = tool.seo_title || `${tool.name} Review, Pricing, Features & Alternatives | AI Vault`;
  const description = tool.seo_description || `Discover ${tool.name} features, pricing, pros, cons, use cases and alternatives on AI Vault.`;
  const logoUrl = tool.image_url || tool.logo_url || `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "AI Vault",
      type: "website",
      images: [{ url: logoUrl, alt: `${tool.name} logo` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [logoUrl],
    },
    robots: { index: true, follow: true },
  };
}

export default async function ToolPage({ params }: Props) {
  const resolvedParams = await params;
  const tool = await getToolFromDatabase(resolvedParams.slug);

  if (!tool) {
    notFound();
  }

  const relatedTools = await getRelatedTools(tool.category || "Software", tool.slug);
  const alternativesList = relatedTools.slice(0, 3);
  const generalRelated = relatedTools.slice(3, 8);

  const officialUrl = tool.website_url || tool.official_url || "#";
  const destinationUrl = tool.affiliate_url || officialUrl;
  const isAffiliate = Boolean(tool.affiliate_url);
  const youtubeVideoId = extractYouTubeId(tool.youtube_url, tool.youtube_id);
  const normalizedScore = normalizeScore(tool.score, tool.neural_score, tool.rating);

  const prosList: FormattedListItem[] = Array.isArray(tool.features_pros) ? tool.features_pros : [];
  const consList: FormattedListItem[] = Array.isArray(tool.limitations_cons) ? tool.limitations_cons : [];
  const howToSteps: string[] = Array.isArray(tool.how_to_use) ? tool.how_to_use : [];
  const tagsList: string[] = Array.isArray(tool.tags) ? tool.tags : [];
  const faqsList: FAQItem[] = Array.isArray(tool.faqs) ? tool.faqs : [];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: tool.category || "AI Tools", item: `${SITE_URL}/?cat=${encodeURIComponent(tool.category || "")}` },
      { "@type": "ListItem", position: 3, name: tool.name, item: `${SITE_URL}/tool/${tool.slug}` },
    ],
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    applicationCategory: tool.category || "Application",
    operatingSystem: "Web",
    url: destinationUrl,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      description: tool.pricing || "Pricing varies",
    },
  };

  const faqSchema = faqsList.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqsList.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tight text-slate-950 font-serif">
                AI Vault<span className="text-blue-600">.</span>
              </span>
            </Link>

            <a
              href={destinationUrl}
              target="_blank"
              rel={isAffiliate ? "nofollow sponsored" : "noopener noreferrer"}
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-sm hover:shadow-blue-500/20 active:scale-95"
            >
              {isAffiliate ? "VISIT PARTNER PORTAL ↗" : "VISIT OFFICIAL PORTAL ↗"}
            </a>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="text-xs font-semibold text-slate-400">
            <ol className="flex items-center gap-2 flex-wrap">
              <li><Link href="/" className="hover:text-blue-600 transition">Home</Link></li>
              <li>/</li>
              <li><Link href={`/?cat=${encodeURIComponent(tool.category || "")}`} className="hover:text-blue-600 transition">{tool.category || "Software"}</Link></li>
              <li>/</li>
              <li className="text-slate-900 font-bold">{tool.name}</li>
            </ol>
          </nav>

          {/* Hero Section */}
          <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5 sm:gap-6 min-w-0">
                <ToolLogo tool={tool} size="xl" />

                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">
                      {tool.category || "Software"}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-slate-100 text-slate-700">
                      {tool.pricing || "Freemium"}
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 font-serif truncate">
                    {tool.name}
                  </h1>
                </div>
              </div>

              {normalizedScore && (
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    AI Vault Score
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-blue-600 tracking-tight font-serif">
                    {normalizedScore}
                    <span className="text-base font-normal text-slate-400">/10</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Overview & Tags */}
          <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-black text-slate-950 font-serif">
              What is {tool.name}?
            </h2>
            <div className="prose prose-slate max-w-none text-slate-700 text-base leading-relaxed whitespace-pre-line">
              {tool.description || `${tool.name} is a software platform designed for ${tool.category || "digital"} operations.`}
            </div>

            {tagsList.length > 0 && (
              <div className="pt-4 flex flex-wrap gap-2">
                {tagsList.map((tag, i) => (
                  <span key={i} className="text-xs font-semibold px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Ad Placement 1 */}
          <AdSlot slotId="tool-after-overview" />

          {/* YouTube Video Section */}
          {youtubeVideoId && (
            <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-xl font-black text-slate-950 font-serif">
                Video Overview
              </h2>
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
                  title={`${tool.name} Video Overview`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full border-0"
                />
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              {/* Pricing & Plans */}
              <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl font-black text-slate-950 font-serif">
                  Pricing & Plans
                </h2>
                <p className="text-slate-700 text-sm leading-relaxed font-medium">
                  {tool.pricing_details?.note || tool.pricing || "Pricing information varies — check official website for current plans and tier limits."}
                </p>
                <div className="pt-2">
                  <a
                    href={destinationUrl}
                    target="_blank"
                    rel={isAffiliate ? "nofollow sponsored" : "noopener noreferrer"}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700"
                  >
                    CHECK OFFICIAL PRICING TIERS →
                  </a>
                </div>
              </section>

              {/* Pros & Cons */}
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white border border-emerald-100/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">
                    KEY FEATURES & PROS
                  </h2>
                  {prosList.length > 0 ? (
                    <ol className="space-y-3 text-sm text-slate-700 list-decimal list-inside">
                      {prosList.map((item, i) => (
                        <li key={i} className="leading-relaxed">
                          {item.title && <strong className="text-slate-900 font-bold mr-1">{item.title}:</strong>}
                          <span>{item.description}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Not explicitly specified.</p>
                  )}
                </div>

                <div className="bg-white border border-amber-100/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-amber-700">
                    LIMITATIONS & CONS
                  </h2>
                  {consList.length > 0 ? (
                    <ol className="space-y-3 text-sm text-slate-700 list-decimal list-inside">
                      {consList.map((item, i) => (
                        <li key={i} className="leading-relaxed">
                          {item.title && <strong className="text-slate-900 font-bold mr-1">{item.title}:</strong>}
                          <span>{item.description}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Not explicitly specified.</p>
                  )}
                </div>
              </section>

              {/* Alternatives */}
              {alternativesList.length > 0 && (
                <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                  <h2 className="text-xl font-black text-slate-950 font-serif">
                    Best Alternatives to {tool.name}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {alternativesList.map((alt) => (
                      <Link
                        key={alt.slug}
                        href={`/tool/${encodeURIComponent(alt.slug)}`}
                        className="p-4 rounded-2xl border border-slate-100 hover:border-blue-300 transition bg-slate-50/50 flex flex-col justify-between"
                      >
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">{alt.name}</h3>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                            {alt.description || "Alternative software listing."}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-blue-600 mt-3 block">View Details →</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Who Should Use */}
              {tool.who_should_use && (
                <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-3">
                  <h2 className="text-xl font-black text-slate-950 font-serif">
                    Who Should Use {tool.name}?
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {tool.who_should_use}
                  </p>
                </section>
              )}

              {/* How to Use */}
              {howToSteps.length > 0 && (
                <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                  <h2 className="text-xl font-black text-slate-950 font-serif">
                    How to Get Started with {tool.name}
                  </h2>
                  <ol className="list-decimal list-inside space-y-3 text-sm text-slate-700 leading-relaxed">
                    {howToSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </section>
              )}

              {/* FAQs */}
              {faqsList.length > 0 && (
                <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <h2 className="text-xl font-black text-slate-950 font-serif">
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-4 divide-y divide-slate-100">
                    {faqsList.map((faq, index) => (
                      <div key={index} className={index > 0 ? "pt-4" : ""}>
                        <h3 className="text-sm font-bold text-slate-900">{faq.q}</h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar Specifications */}
            <aside className="space-y-6 lg:sticky lg:top-28">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  System Specifications
                </h2>

                <dl className="space-y-4 text-sm divide-y divide-slate-100">
                  <div className="pt-2 flex justify-between items-center">
                    <dt className="text-slate-500 font-medium">Software</dt>
                    <dd className="font-bold text-slate-900 truncate max-w-[150px]">{tool.name}</dd>
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    <dt className="text-slate-500 font-medium">Category</dt>
                    <dd className="font-bold text-blue-600">{tool.category || "Software"}</dd>
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    <dt className="text-slate-500 font-medium">Pricing Model</dt>
                    <dd className="font-bold text-emerald-600">{tool.pricing || "Freemium"}</dd>
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    <dt className="text-slate-500 font-medium">Data Status</dt>
                    <dd className="inline-flex items-center gap-1.5 font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      Database Verified
                    </dd>
                  </div>
                </dl>

                <div className="space-y-2 pt-2">
                  <a
                    href={destinationUrl}
                    target="_blank"
                    rel={isAffiliate ? "nofollow sponsored" : "noopener noreferrer"}
                    className="w-full inline-flex items-center justify-center py-4 px-6 text-sm font-extrabold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all shadow-md hover:shadow-blue-500/25 active:scale-98"
                  >
                    {isAffiliate ? "VISIT PARTNER PORTAL ↗" : "VISIT OFFICIAL PORTAL ↗"}
                  </a>

                  {isAffiliate && officialUrl !== "#" && (
                    <a
                      href={officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center py-2 px-4 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      Visit Official Direct Website ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Sidebar Ad Placement */}
              <AdSlot slotId="tool-sidebar" format="rectangle" />
            </aside>
          </div>

          {/* Related Tools Section */}
          {generalRelated.length > 0 && (
            <section className="pt-8 border-t border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Related Tools in {tool.category || "Software"}
                </h2>
                <Link href="/" className="text-xs font-bold text-blue-600 hover:underline">
                  View Full Directory ↗
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {generalRelated.map((rel: any) => (
                  <Link
                    key={rel.slug}
                    href={`/tool/${encodeURIComponent(rel.slug)}`}
                    className="group bg-white border border-slate-100 hover:border-blue-200 rounded-3xl p-6 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <ToolLogo tool={rel} size="md" />
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {rel.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {rel.description || "Software listing."}
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
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
