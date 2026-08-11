import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ToolLogo } from "@/components/ToolLogo";
import { AdSlot } from "@/components/AdSlot";
import { SITE_URL } from "@/lib/site-url";
import { resolveToolOutboundUrl } from "@/lib/affiliate/resolver";
import {
  DatabaseToolRecord,
  FormattedListItem,
  FAQItem,
  extractYouTubeId,
  normalizeScore,
  parseProsConsColumn,
  generateToolSpecificEnrichment,
} from "@/lib/tool-normalizer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }> | { slug: string };
};

function getSupabaseClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://mantupatra23-pixel.supabase.co";

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

async function getToolFromDatabase(rawSlug: string): Promise<DatabaseToolRecord | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !rawSlug || typeof rawSlug !== "string") return null;

  try {
    const cleanSlug = decodeURIComponent(rawSlug).toLowerCase().trim();

    // Complete Select from public.ai_tools
    let { data, error } = await supabase
      .from("ai_tools")
      .select("*")
      .eq("slug", cleanSlug)
      .maybeSingle();

    if (!data) {
      const res = await supabase
        .from("ai_tools")
        .select("*")
        .ilike("slug", cleanSlug)
        .maybeSingle();
      data = res.data;
    }

    if (error || !data) return null;

    let record = data as DatabaseToolRecord;

    // Self-healing write-back: Enrich missing JSONB fields
    if (!record.who_should_use || !record.features_pros || !record.limitations_cons) {
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
        description: record.description || enrichment.description,
        features_pros: finalPros,
        limitations_cons: finalCons,
        who_should_use: record.who_should_use || enrichment.who_should_use,
        how_to_use: record.how_to_use || enrichment.how_to_use,
        pricing_details: record.pricing_details || enrichment.pricing_details,
        tags: record.tags || enrichment.tags || null,
        faqs: record.faqs || enrichment.faqs || null,
        seo_title: record.seo_title || enrichment.seo_title,
        seo_description: record.seo_description || enrichment.seo_description,
      };

      // Asynchronous database write-back using .from("ai_tools")
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
            console.error(`[DB_WRITE_BACK_ERR] slug=${record.slug}`, writeErr.message);
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
      .select("name, slug, category, pricing, image_url, logo_url")
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
  const rawSlug = resolvedParams?.slug;
  const tool = await getToolFromDatabase(rawSlug);

  if (!tool) {
    return {
      title: "Tool Not Found | AI Vault",
      description: "The requested software tool could not be located in our directory.",
      robots: { index: false, follow: true },
    };
  }

  const canonicalUrl = `${SITE_URL}/tool/${tool.slug}`;
  const title = tool.seo_title || `${tool.name} Review, Features & Pricing | AI Vault`;
  const description = tool.seo_description || `Discover ${tool.name} features, pros/cons, and pricing on AI Vault.`;
  const logoUrl = tool.image_url || tool.logo_url || "";

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
  const rawSlug = resolvedParams?.slug;

  if (!rawSlug) {
    notFound();
  }

  const tool = await getToolFromDatabase(rawSlug);

  if (!tool) {
    notFound();
  }

  const relatedTools = await getRelatedTools(tool.category || "", tool.slug);
  const alternativesList = relatedTools.slice(0, 3);
  const generalRelated = relatedTools.slice(3, 8);

  // Server-side Outbound Link Resolution
  const { outboundUrl, isAffiliate, buttonLabel } = await resolveToolOutboundUrl(
    tool.id,
    tool.slug,
    tool.website_url ?? null
  );

  const officialDirectUrl = tool.website_url || "#";
  const youtubeVideoId = extractYouTubeId(tool.youtube_id || "");
  const normalizedScore = normalizeScore(tool.score || tool.rating || 0);

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
      { "@type": "ListItem", position: 2, name: tool.category || "Tools", item: `${SITE_URL}/?cat=${encodeURIComponent(tool.category || "")}` },
      { "@type": "ListItem", position: 3, name: tool.name, item: `${SITE_URL}/tool/${tool.slug}` },
    ],
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    applicationCategory: tool.category || "Software",
    operatingSystem: "Web",
    url: outboundUrl,
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

      <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
        {/* Sticky Header Bar */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-slate-900 font-black">
              <span className="text-2xl font-black tracking-tight font-serif">AI Vault</span>
            </Link>

            <a
              href={outboundUrl}
              target="_blank"
              rel={isAffiliate ? "nofollow sponsored" : "noopener noreferrer"}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-2xl transition shadow-lg shadow-blue-600/20"
            >
              {isAffiliate ? "VISIT PARTNER PORTAL ↗" : buttonLabel}
            </a>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="text-xs font-medium text-slate-500">
            <ol className="flex items-center gap-2 flex-wrap">
              <li><Link href="/" className="hover:text-slate-900">Home</Link></li>
              <li>/</li>
              <li><Link href={`/?cat=${encodeURIComponent(tool.category || "")}`} className="hover:text-slate-900">{tool.category || "Software"}</Link></li>
              <li>/</li>
              <li className="text-slate-900 font-bold">{tool.name}</li>
            </ol>
          </nav>

          {/* Hero Section */}
          <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <ToolLogo tool={tool} size="xl" />
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-600 border border-blue-200">
                      {tool.category || "Software"}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                      {tool.pricing || "Freemium"}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black text-slate-900 font-serif tracking-tight">
                    {tool.name}
                  </h1>
                </div>
              </div>

              {normalizedScore && (
                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Vault Score</span>
                  <div className="text-3xl sm:text-4xl font-black text-blue-600 font-serif">
                    {normalizedScore}<span className="text-base font-bold text-slate-400">/100</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Overview Section */}
          <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 font-serif">What is {tool.name}?</h2>
            <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed font-sans">
              {tool.description || `${tool.name} is an advanced software solution.`}
            </div>

            {tagsList.length > 0 && (
              <div className="pt-4 flex flex-wrap gap-2">
                {tagsList.map((tag, i) => (
                  <span key={i} className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </section>

          <AdSlot slotId="tool-after-overview" />

          {/* YouTube Video Section */}
          {youtubeVideoId && (
            <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 font-serif">Video Overview</h2>
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Pricing Section */}
              <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 font-serif">Pricing & Plans</h2>
                <p className="text-sm text-slate-600 leading-relaxed font-sans">
                  {typeof tool.pricing_details === "string" 
                    ? tool.pricing_details 
                    : `${tool.name} offers flexible options structured around ${tool.pricing || "Freemium"} tiers.`}
                </p>
              </section>

              {/* Pros & Cons */}
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
                  <h2 className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest">KEY FEATURES & PROS</h2>
                  {prosList.length > 0 ? (
                    <ol className="space-y-3 text-sm text-slate-600 font-sans">
                      {prosList.map((item, i) => (
                        <li key={i} className="leading-snug">
                          {item.title && <strong className="font-bold text-slate-900 block">{item.title}</strong>}
                          <span>{item.description}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No specific pros listed.</p>
                  )}
                </div>

                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-sm">
                  <h2 className="text-xs font-extrabold text-rose-600 uppercase tracking-widest">LIMITATIONS & CONS</h2>
                  {consList.length > 0 ? (
                    <ol className="space-y-3 text-sm text-slate-600 font-sans">
                      {consList.map((item, i) => (
                        <li key={i} className="leading-snug">
                          {item.title && <strong className="font-bold text-slate-900 block">{item.title}</strong>}
                          <span>{item.description}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No specific limitations listed.</p>
                  )}
                </div>
              </section>

              {/* How to Use */}
              {howToSteps.length > 0 && (
                <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
                  <h2 className="text-xl font-black text-slate-900 font-serif">How to Get Started with {tool.name}</h2>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 font-sans leading-relaxed">
                    {howToSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </section>
              )}

              {/* FAQs */}
              {faqsList.length > 0 && (
                <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
                  <h2 className="text-xl font-black text-slate-900 font-serif">Frequently Asked Questions</h2>
                  <div className="space-y-4 divide-y divide-slate-100">
                    {faqsList.map((faq, index) => (
                      <div key={index} className="pt-4 space-y-1">
                        <h3 className="text-sm font-bold text-slate-900">{faq.q}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar Specifications */}
            <aside className="space-y-6 lg:sticky lg:top-24 h-fit">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-6 shadow-sm">
                <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">System Specifications</h2>

                <dl className="space-y-4 text-sm divide-y divide-slate-100">
                  <div className="pt-2 flex justify-between gap-2">
                    <dt className="text-slate-500 font-medium">Category</dt>
                    <dd className="font-bold text-slate-900 text-right">{tool.category || "Software"}</dd>
                  </div>

                  <div className="pt-4 flex justify-between gap-2">
                    <dt className="text-slate-500 font-medium">Pricing Model</dt>
                    <dd className="font-bold text-slate-900 text-right">{tool.pricing || "Freemium"}</dd>
                  </div>

                  <div className="pt-4 flex justify-between gap-2">
                    <dt className="text-slate-500 font-medium">Operating System</dt>
                    <dd className="font-bold text-slate-900 text-right">Web / Cloud</dd>
                  </div>
                </dl>

                <div className="space-y-2 pt-2">
                  <a
                    href={outboundUrl}
                    target="_blank"
                    rel={isAffiliate ? "nofollow sponsored" : "noopener noreferrer"}
                    className="w-full inline-flex items-center justify-center px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-blue-600/20"
                  >
                    {isAffiliate ? "VISIT PARTNER PORTAL ↗" : buttonLabel}
                  </a>

                  {isAffiliate && officialDirectUrl !== "#" && (
                    <a
                      href={officialDirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition"
                    >
                      Visit Official Direct Website ↗
                    </a>
                  )}

                  {isAffiliate && (
                    <p className="text-[10px] text-slate-400 text-center font-medium pt-1">
                      Disclosure: Some links may be sponsored affiliate partnerships.
                    </p>
                  )}
                </div>
              </div>

              <AdSlot slotId="tool-sidebar" format="rectangle" />
            </aside>
          </div>

          {/* Related Tools */}
          {generalRelated.length > 0 && (
            <section className="pt-8 border-t border-slate-200/80 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                  Related Tools in {tool.category || "Directory"}
                </h2>
                <Link href="/" className="text-xs font-bold text-blue-600 hover:underline">
                  View Full Directory ↗
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {generalRelated.map((rel: any) => (
                  <Link
                    key={rel.slug}
                    href={`/tool/${encodeURIComponent(rel.slug)}`}
                    className="group bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-blue-500 transition shadow-sm space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <ToolLogo tool={rel} size="md" />
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition truncate">
                          {rel.name}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{rel.pricing || "Freemium"}</p>
                      </div>
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
