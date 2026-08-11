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

interface FormattedListItem {
  title?: string;
  description: string;
}

interface NormalizedTool {
  id: string;
  name: string;
  slug: string;
  category: string;
  pricing_model: string;
  description: string;
  pricing_details: string;
  features_pros: FormattedListItem[];
  limitations_cons: FormattedListItem[];
  who_should_use: string;
  how_to_use: string[];
  faqs: { q: string; a: string }[];
  official_url: string;
  image_url?: string;
  logo_url?: string;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

function parseListItems(input: any): FormattedListItem[] {
  if (!input) return [];
  let lines: string[] = [];
  if (Array.isArray(input)) {
    lines = input.map((i) => String(i));
  } else if (typeof input === "string") {
    lines = input.split(/\n|•|\*/).map((s) => s.trim()).filter(Boolean);
  }

  return lines.map((line) => {
    const cleanLine = line.replace(/^\d+\.\s*/, "").trim();
    if (cleanLine.includes(":") || cleanLine.includes(" - ")) {
      const parts = cleanLine.split(/:(.+)| - (.+)/).filter(Boolean);
      if (parts.length >= 2) {
        return { title: parts[0].trim(), description: parts.slice(1).join(" ").trim() };
      }
    }
    return { description: cleanLine };
  });
}

async function getNormalizedTool(rawSlug: string): Promise<NormalizedTool | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const decodedSlug = decodeURIComponent(rawSlug).toLowerCase().trim();
    const { data: raw, error } = await supabase
      .from("ai_tools")
      .select("*")
      .eq("slug", decodedSlug)
      .maybeSingle();

    if (error || !raw) return null;

    const pros = parseListItems(raw.pros);
    const cons = parseListItems(raw.cons);
    const category = raw.category || "Software";
    const name = raw.name || "Tool";

    // Build tool-specific How-To steps based on category
    let howToSteps: string[] = [];
    if (category.toLowerCase().includes("publish") || category.toLowerCase().includes("cms") || raw.slug === "ghost") {
      howToSteps = [
        `Set up your ${name} instance on Ghost(Pro) or deploy the open-source Node.js package on your server.`,
        `Connect your custom domain, set up site branding, and configure email newsletter distribution settings.`,
        `Draft posts, format content with the rich editor, and establish free or paid membership subscription tiers.`,
        `Publish articles directly to the web and send automated newsletter broadcasts to your email subscribers.`
      ];
    } else if (category.toLowerCase().includes("code") || category.toLowerCase().includes("cli") || category.toLowerCase().includes("dev")) {
      howToSteps = [
        `Install or access ${name} using your package manager or developer terminal environment.`,
        `Configure API keys, authentication credentials, and system environment variables.`,
        `Execute specific CLI commands or integrate SDK libraries directly into your project codebase.`,
        `Monitor output logs, verify integration endpoints, and deploy to your production environment.`
      ];
    } else {
      howToSteps = [
        `Visit the official platform website at ${raw.website_url || raw.official_url || "the official portal"}.`,
        `Sign up for an account and authenticate your credentials.`,
        `Configure operational settings for your target project.`,
        `Execute your tasks and export generated results.`
      ];
    }

    // Build tool-specific FAQs
    const faqs = [
      {
        q: `What is ${name} used for?`,
        a: raw.description ? raw.description.slice(0, 200) + "..." : `${name} is designed for ${category} operations.`
      },
      {
        q: `What is ${name}'s pricing structure?`,
        a: raw.pricing ? `${name} is offered under: ${raw.pricing}` : "Pricing details can be verified on the official portal."
      },
      {
        q: `Who should use ${name}?`,
        a: category.toLowerCase().includes("publish") || raw.slug === "ghost"
          ? `${name} is built for independent creators, newsletter publishers, journalists, and media teams.`
          : `${name} is designed for developers, software engineers, and digital teams.`
      }
    ];

    return {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      category: category,
      pricing_model: raw.pricing || "Paid",
      description: raw.description || "Content unavailable.",
      pricing_details: raw.pricing || "Check official website for active subscription tiers.",
      features_pros: pros,
      limitations_cons: cons,
      who_should_use: category.toLowerCase().includes("publish") || raw.slug === "ghost"
        ? "Professional creators, independent writers, publishers, and digital media teams building subscription businesses."
        : "Developers, software engineers, and digital operations teams.",
      how_to_use: howToSteps,
      faqs: faqs,
      official_url: raw.website_url || raw.official_url || "#",
      image_url: raw.image_url,
      logo_url: raw.logo_url
    };
  } catch (err) {
    console.error("[FETCH_EXCEPT]", err);
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
  const tool = await getNormalizedTool(resolvedParams.slug);

  if (!tool) {
    return {
      title: "Tool Not Found | AI Vault",
      description: "Explore verified AI tools and software in the AI Vault directory.",
      robots: { index: false, follow: true },
    };
  }

  const canonicalUrl = `${SITE_URL}/tool/${tool.slug}`;
  const title = `${tool.name} — Features, Pricing & Alternatives | AI Vault`;
  const description = tool.description.slice(0, 155);
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
  const tool = await getNormalizedTool(resolvedParams.slug);

  if (!tool) {
    notFound();
  }

  const relatedTools = await getRelatedTools(tool.category, tool.slug);
  const alternativesList = relatedTools.slice(0, 3);
  const generalRelated = relatedTools.slice(3, 8);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: tool.category, item: `${SITE_URL}/?cat=${encodeURIComponent(tool.category)}` },
      { "@type": "ListItem", position: 3, name: tool.name, item: `${SITE_URL}/tool/${tool.slug}` },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tight text-slate-950 font-serif">
                AI Vault<span className="text-blue-600">.</span>
              </span>
            </Link>

            <a
              href={tool.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-sm hover:shadow-blue-500/20 active:scale-95"
            >
              VISIT OFFICIAL PORTAL ↗
            </a>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
          <nav aria-label="Breadcrumb" className="text-xs font-semibold text-slate-400">
            <ol className="flex items-center gap-2 flex-wrap">
              <li><Link href="/" className="hover:text-blue-600 transition">Home</Link></li>
              <li>/</li>
              <li><Link href={`/?cat=${encodeURIComponent(tool.category)}`} className="hover:text-blue-600 transition">{tool.category}</Link></li>
              <li>/</li>
              <li className="text-slate-900 font-bold">{tool.name}</li>
            </ol>
          </nav>

          <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5 sm:gap-6 min-w-0">
                <ToolLogo tool={tool} size="xl" />

                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">
                      {tool.category}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-slate-100 text-slate-700">
                      {tool.pricing_model}
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 font-serif truncate">
                    {tool.name}
                  </h1>
                </div>
              </div>
            </div>
          </section>

          {/* 1. Description */}
          <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-black text-slate-950 font-serif">
              What is {tool.name}?
            </h2>
            <div className="prose prose-slate max-w-none text-slate-700 text-base leading-relaxed whitespace-pre-line">
              {tool.description}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              {/* 2. Pricing */}
              <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl font-black text-slate-950 font-serif">
                  Pricing & Plans
                </h2>
                <p className="text-slate-700 text-sm leading-relaxed font-medium">
                  {tool.pricing_details}
                </p>
                <div className="pt-2">
                  <a
                    href={tool.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700"
                  >
                    Check Pricing on Official Website →
                  </a>
                </div>
              </section>

              {/* 3. Pros & Cons */}
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white border border-emerald-100/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">
                    KEY FEATURES & PROS
                  </h2>
                  {tool.features_pros.length > 0 ? (
                    <ol className="space-y-3 text-sm text-slate-700 list-decimal list-inside">
                      {tool.features_pros.map((item, i) => (
                        <li key={i} className="leading-relaxed">
                          {item.title && <strong className="text-slate-900 font-bold mr-1">{item.title}:</strong>}
                          <span>{item.description}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Content unavailable.</p>
                  )}
                </div>

                <div className="bg-white border border-amber-100/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-amber-700">
                    LIMITATIONS & CONS
                  </h2>
                  {tool.limitations_cons.length > 0 ? (
                    <ol className="space-y-3 text-sm text-slate-700 list-decimal list-inside">
                      {tool.limitations_cons.map((item, i) => (
                        <li key={i} className="leading-relaxed">
                          {item.title && <strong className="text-slate-900 font-bold mr-1">{item.title}:</strong>}
                          <span>{item.description}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Content unavailable.</p>
                  )}
                </div>
              </section>

              {/* 4. Best Alternatives */}
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

              {/* 5. Who Should Use It? */}
              <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-3">
                <h2 className="text-xl font-black text-slate-950 font-serif">
                  Who Should Use {tool.name}?
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {tool.who_should_use}
                </p>
              </section>

              {/* 6. How to Use [Tool] */}
              <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl font-black text-slate-950 font-serif">
                  How to Use {tool.name}
                </h2>
                <ol className="list-decimal list-inside space-y-3 text-sm text-slate-700 leading-relaxed">
                  {tool.how_to_use.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </section>

              {/* 7. FAQs */}
              <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <h2 className="text-xl font-black text-slate-950 font-serif">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4 divide-y divide-slate-100">
                  {tool.faqs.map((faq, index) => (
                    <div key={index} className={index > 0 ? "pt-4" : ""}>
                      <h3 className="text-sm font-bold text-slate-900">{faq.q}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-28">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Specifications
                </h2>

                <dl className="space-y-4 text-sm divide-y divide-slate-100">
                  <div className="pt-2 flex justify-between items-center">
                    <dt className="text-slate-500 font-medium">Tool Name</dt>
                    <dd className="font-bold text-slate-900 truncate max-w-[150px]">{tool.name}</dd>
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    <dt className="text-slate-500 font-medium">Category</dt>
                    <dd className="font-bold text-blue-600">{tool.category}</dd>
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    <dt className="text-slate-500 font-medium">Pricing Model</dt>
                    <dd className="font-bold text-emerald-600">{tool.pricing_model}</dd>
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    <dt className="text-slate-500 font-medium">Status</dt>
                    <dd className="inline-flex items-center gap-1.5 font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      Information Reviewed
                    </dd>
                  </div>
                </dl>

                <a
                  href={tool.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center py-4 px-6 text-sm font-extrabold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all shadow-md hover:shadow-blue-500/25 active:scale-98"
                >
                  VISIT OFFICIAL PORTAL ↗
                </a>
              </div>
            </aside>
          </div>

          {/* Related Tools */}
          {generalRelated.length > 0 && (
            <section className="pt-8 border-t border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Related Tools
                </h2>
                <Link href="/" className="text-xs font-bold text-blue-600 hover:underline">
                  View Directory ↗
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
                          {rel.description || "Content unavailable."}
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
