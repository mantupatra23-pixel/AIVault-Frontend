import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ToolLogo } from "@/components/ToolLogo";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

export interface FormattedListItem {
  title?: string;
  description: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface PricingDetailsJSON {
  model?: string;
  note?: string;
  official_link?: string;
}

export interface DatabaseToolRecord {
  id: string;
  name: string;
  slug: string;
  category: string;
  pricing: string | null;
  description: string | null;
  website_url: string | null;
  official_url: string | null;
  affiliate_url: string | null;
  youtube_url: string | null;
  youtube_id: string | null;
  score: number | null;
  neural_score: number | null;
  rating: number | null;
  image_url: string | null;
  logo_url: string | null;
  features_pros: FormattedListItem[] | null;
  limitations_cons: FormattedListItem[] | null;
  who_should_use: string | null;
  how_to_use: string[] | null;
  pricing_details: PricingDetailsJSON | null;
  tags: string[] | null;
  faqs: FAQItem[] | null;
  seo_title: string | null;
  seo_description: string | null;
  pros_cons?: string | null;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

function extractYouTubeId(urlStr: string | null, idStr: string | null): string | null {
  if (idStr && idStr.trim().length === 11) return idStr.trim();
  if (!urlStr) return null;

  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlStr.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  } catch {
    return null;
  }
}

function normalizeScore(rawScore: number | null, rawNeural: number | null, rawRating: number | null): number | null {
  const val = Number(rawScore || rawNeural || rawRating);
  if (isNaN(val) || val <= 0) return null;
  if (val > 10 && val <= 100) return Number((val / 10).toFixed(1));
  if (val <= 10) return Number(val.toFixed(1));
  return 8.5;
}

function generateToolSpecificEnrichment(raw: DatabaseToolRecord): Partial<DatabaseToolRecord> {
  const slug = (raw.slug || "").toLowerCase().trim();
  const name = raw.name || "Tool";
  const category = raw.category || "Software";

  // 1. Ghost Specific Fact Enrichment
  if (slug === "ghost") {
    return {
      description: "Ghost is an open-source, independent publishing platform built on Node.js designed for professional creators, bloggers, newsletters, and online publications. It provides modern tools for subscription management, native newsletter delivery, custom themes, and membership monetization.",
      features_pros: [
        { title: "Newsletter Distribution", description: "Native email newsletter broadcasting and automated subscription workflows." },
        { title: "Membership Monetization", description: "Built-in audience membership support with direct Stripe payment processing." },
        { title: "Modern Publishing Editor", description: "Clean, card-based rich text and Markdown editing interface." },
        { title: "Custom Theme Engine", description: "Flexible Handlebars theme support for total visual control." },
        { title: "Headless APIs", description: "Full REST and GraphQL content APIs for custom web architectures." }
      ],
      limitations_cons: [
        { title: "Technical Self-Hosting", description: "Self-hosting requires server configuration and Node.js maintenance." },
        { title: "Plugin Ecosystem", description: "Smaller plugin repository compared to traditional CMS platforms like WordPress." }
      ],
      who_should_use: "Independent publishers, bloggers, newsletter creators, journalists, media teams, and businesses building paid subscription membership websites.",
      how_to_use: [
        "Create a Ghost publication on managed Ghost(Pro) or deploy the open-source Node.js package on your server.",
        "Configure custom domain, publication branding, and Handlebars theme settings.",
        "Draft and format posts or newsletter issues using the dynamic card editor.",
        "Configure free and paid subscription tiers integrated with Stripe.",
        "Publish content directly to the web and trigger automated newsletter emails to subscribers."
      ],
      pricing_details: {
        model: "Paid / Open Source",
        note: "Ghost open-source software is free to self-host. Managed Ghost(Pro) starts at $9/mo based on subscriber tiers."
      },
      tags: ["CMS", "Blogging", "Publishing", "Newsletter", "Membership", "Node.js"],
      faqs: [
        { q: "What is Ghost used for?", a: "Ghost is used for running blogs, publishing email newsletters, managing subscriber tiers, and monetizing digital publications." },
        { q: "Is Ghost free or paid?", a: "Ghost is open-source and free to self-host. Managed hosting via Ghost(Pro) is a paid service based on subscriber count." },
        { q: "Does Ghost support native email newsletters?", a: "Yes, Ghost includes native email newsletter distribution and audience analytics without needing external plugins." }
      ],
      seo_title: "Ghost — Features, Pricing & Review | AI Vault",
      seo_description: "Ghost is an open-source publishing platform built on Node.js for creators, newsletters, and subscription websites."
    };
  }

  // 2. Cursor Specific Fact Enrichment
  if (slug === "cursor") {
    return {
      features_pros: [
        { title: "Codebase Indexing", description: "Deep local repository indexing for project-wide AI context." },
        { title: "VS Code Compatibility", description: "Native fork of VS Code supporting all existing extensions and keybindings." },
        { title: "Inline AI Editing", description: "Instant code generation and refactoring via Cmd+K." }
      ],
      limitations_cons: [
        { title: "Account Required", description: "Requires a Cursor account for fast cloud AI queries." }
      ],
      who_should_use: "Software engineers, web developers, and technical teams seeking an AI-first IDE fork of VS Code.",
      how_to_use: [
        "Download and install Cursor on macOS, Windows, or Linux.",
        "Import your existing VS Code settings and extensions.",
        "Index your local codebase repository for AI context.",
        "Use Cmd+K or Cmd+I for inline code generation and refactoring."
      ],
      pricing_details: {
        model: "Freemium",
        note: "Offers a free tier with monthly AI query allowances and Pro tiers for unlimited fast usage."
      },
      tags: ["IDE", "Developer Tools", "AI Code Assistant", "VS Code Fork"],
      faqs: [
        { q: "Is Cursor a plugin or an IDE?", a: "Cursor is a standalone desktop IDE forked directly from Visual Studio Code." }
      ],
      seo_title: "Cursor IDE — Features, Pricing & Review | AI Vault",
      seo_description: "Cursor is an AI-first code editor built on VS Code for intelligent code generation and refactoring."
    };
  }

  // 3. Generic Contextual Enrichment for Unverified Tools
  return {
    who_should_use: `${name} is designed for professionals and teams operating in the ${category} space.`,
    how_to_use: [
      `Visit the official portal for ${name}.`,
      "Create or authenticate your account credentials.",
      "Set up project configuration parameters for your workflow.",
      "Execute tasks and export or integrate generated outputs."
    ],
    pricing_details: {
      model: raw.pricing || "Freemium",
      note: `${name} is listed under a ${raw.pricing || "Freemium"} model. Check official website for active tier plans.`
    },
    tags: [category, name, "Software", "AI Tools"],
    faqs: [
      { q: `What is ${name} used for?`, a: (raw.description || `${name} provides software capabilities in the ${category} domain.`) },
      { q: `What pricing model does ${name} offer?`, a: `${name} is listed under a ${raw.pricing || "Freemium"} model. Check official website for active tier plans.` }
    ],
    seo_title: `${name} — Features, Pricing & Review | AI Vault`,
    seo_description: (raw.description || `Overview and feature guide for ${name} in the ${category} directory.`).slice(0, 155)
  };
}

async function getToolFromDatabase(rawSlug: string): Promise<DatabaseToolRecord | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const decodedSlug = decodeURIComponent(rawSlug).toLowerCase().trim();
    const { data, error } = await supabase
      .from("ai_tools")
      .select("*")
      .eq("slug", decodedSlug)
      .maybeSingle();

    if (error || !data) return null;

    let record = data as DatabaseToolRecord;

    // Self-Healing Pipeline: If enriched columns are missing in DB, enrich and write back
    if (!record.who_should_use || !record.features_pros || record.features_pros.length === 0) {
      const enrichment = generateToolSpecificEnrichment(record);

      record = {
        ...record,
        description: enrichment.description || record.description,
        features_pros: record.features_pros && record.features_pros.length > 0 ? record.features_pros : (enrichment.features_pros || []),
        limitations_cons: record.limitations_cons && record.limitations_cons.length > 0 ? record.limitations_cons : (enrichment.limitations_cons || []),
        who_should_use: record.who_should_use || enrichment.who_should_use || null,
        how_to_use: record.how_to_use || enrichment.how_to_use || null,
        pricing_details: record.pricing_details || enrichment.pricing_details || null,
        tags: record.tags || enrichment.tags || null,
        faqs: record.faqs || enrichment.faqs || null,
        seo_title: record.seo_title || enrichment.seo_title || null,
        seo_description: record.seo_description || enrichment.seo_description || null
      };

      // Write back enriched data to Supabase database asynchronously
      supabase.table("ai_tools").update({
        description: record.description,
        features_pros: record.features_pros,
        limitations_cons: record.limitations_cons,
        who_should_use: record.who_should_use,
        how_to_use: record.how_to_use,
        pricing_details: record.pricing_details,
        tags: record.tags,
        faqs: record.faqs,
        seo_title: record.seo_title,
        seo_description: record.seo_description
      }).eq("id", record.id).then(({ error: updateErr }) => {
        if (updateErr) console.error(`[DB_WRITE_FAIL] slug=${decodedSlug}`, updateErr.message);
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
      description: "Explore verified software tools in the AI Vault directory.",
      robots: { index: false, follow: true },
    };
  }

  const canonicalUrl = `${SITE_URL}/tool/${tool.slug}`;
  const title = tool.seo_title || `${tool.name} — Features, Pricing & Review | AI Vault`;
  const description = tool.seo_description || tool.description?.slice(0, 155) || `${tool.name} overview and details.`;
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

  const prosList = Array.isArray(tool.features_pros) ? tool.features_pros : [];
  const consList = Array.isArray(tool.limitations_cons) ? tool.limitations_cons : [];
  const howToSteps = Array.isArray(tool.how_to_use) ? tool.how_to_use : [];
  const tagsList = Array.isArray(tool.tags) ? tool.tags : [];
  const faqsList = Array.isArray(tool.faqs) ? tool.faqs : [];

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

          {/* Overview Section */}
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

          {/* Responsive YouTube Embed */}
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
              {/* Pricing Section */}
              <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl font-black text-slate-950 font-serif">
                  Pricing & Plans
                </h2>
                <p className="text-slate-700 text-sm leading-relaxed font-medium">
                  {tool.pricing_details?.note || tool.pricing || "Pricing information varies — check official website for plans and limits."}
                </p>
                <div className="pt-2">
                  <a
                    href={destinationUrl}
                    target="_blank"
                    rel={isAffiliate ? "nofollow sponsored" : "noopener noreferrer"}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700"
                  >
                    Check Official Pricing Tiers →
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
                    <p className="text-xs text-slate-400 italic">Not specified.</p>
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
                    <p className="text-xs text-slate-400 italic">Not specified.</p>
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
                        href={`/tool/${alt.slug}`}
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
                      Database Enriched
                    </dd>
                  </div>
                </dl>

                <a
                  href={destinationUrl}
                  target="_blank"
                  rel={isAffiliate ? "nofollow sponsored" : "noopener noreferrer"}
                  className="w-full inline-flex items-center justify-center py-4 px-6 text-sm font-extrabold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all shadow-md hover:shadow-blue-500/25 active:scale-98"
                >
                  {isAffiliate ? "VISIT PARTNER PORTAL ↗" : "VISIT OFFICIAL PORTAL ↗"}
                </a>
              </div>
            </aside>
          </div>

          {/* Related Tools */}
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
                    href={`/tool/${rel.slug}`}
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
