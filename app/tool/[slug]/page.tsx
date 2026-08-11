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

// Strict blacklist filter to reject legacy review/analyst language
const BLACKLIST_PATTERNS = [
  /Professional Review/i,
  /I have conducted/i,
  /I conducted/i,
  /Our analysis/i,
  /Our research/i,
  /Senior SEO/i,
  /Visora AI/i,
  /Pricing 2026/i,
  /empowering users to make informed decisions/i,
  /expected to remain competitive/i,
  /provides software functionality for .* workflows/i,
];

function validateAndSanitizeText(rawText: string = "", toolName: string = ""): string {
  if (!rawText) return "";

  let cleaned = rawText;

  // Remove blacklisted phrases
  cleaned = cleaned
    .replace(/As a Senior SEO &? AI Analyst( for Visora AI)?\.*/gi, "")
    .replace(/Our Professional Review:?\.*/gi, "")
    .replace(/I have conducted (a|an) (in-depth|thorough) analysis\.*/gi, "")
    .replace(/I conducted (a|an) (in-depth|thorough) analysis\.*/gi, "")
    .replace(/Visora AI network intelligence identifies\.*/gi, "")
    .replace(/AI Vault network intelligence identifies\.*/gi, "")
    .replace(/Our analysis aims to provide\.*/gi, "")
    .replace(/Our research shows\.*/gi, "")
    .replace(/empowering users to make informed decisions\.*/gi, "")
    .replace(/expected to remain competitive\.*/gi, "")
    .replace(/Pricing 2026/gi, "Pricing")
    .replace(new RegExp(`${toolName} Pricing 2026`, "gi"), `${toolName} Pricing`)
    .replace(/(<([^>]+)>)/gi, "")
    .trim();

  cleaned = cleaned.replace(/^[\s,.:;—–-]+/, "");

  // Safety fallback if entire text was blacklisted
  for (const pattern of BLACKLIST_PATTERNS) {
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, "").trim();
    }
  }

  return cleaned;
}

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
    const decodedSlug = decodeURIComponent(rawSlug).toLowerCase().trim();
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

function parseStructuredList(input: any): FormattedListItem[] {
  if (!input) return [];

  let rawLines: string[] = [];
  if (Array.isArray(input)) {
    rawLines = input.map((item) => String(item));
  } else if (typeof input === "string") {
    rawLines = input.split(/\n|•|\*/).map((s) => s.trim()).filter(Boolean);
  }

  const items: FormattedListItem[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].replace(/^\d+\.\s*/, "").trim();
    if (!line) continue;

    if (BLACKLIST_PATTERNS.some((pattern) => pattern.test(line))) {
      continue;
    }

    if (line.includes(":") || line.includes(" - ")) {
      const parts = line.split(/:(.+)| - (.+)/).filter(Boolean);
      if (parts.length >= 2) {
        items.push({
          title: parts[0].trim(),
          description: parts.slice(1).join(" ").trim(),
        });
        continue;
      }
    }

    items.push({ description: line });
  }

  return items;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const tool = await getTool(resolvedParams.slug);

  if (!tool) {
    return {
      title: "Tool Not Found | AI Vault",
      description: "Explore verified AI tools and software in the AI Vault directory.",
      robots: { index: false, follow: true },
    };
  }

  const cleanDesc = validateAndSanitizeText(tool.description, tool.name);
  const canonicalUrl = `${SITE_URL}/tool/${tool.slug}`;
  const title = tool.meta_title || `${tool.name}: Features, Pricing & Alternatives | AI Vault`;
  const description =
    tool.meta_description ||
    cleanDesc.slice(0, 155) ||
    `Overview of ${tool.name}: key capabilities, pricing details, pros, cons, and alternatives.`;

  const logoUrl = tool.image_url || tool.logo_url || `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "AI Vault",
      type: "website",
      images: [{ url: logoUrl, alt: `${tool.name} software logo` }],
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
  const tool = await getTool(resolvedParams.slug);

  if (!tool) {
    notFound();
  }

  const cleanDescription = validateAndSanitizeText(tool.description, tool.name);
  const relatedTools = await getRelatedTools(tool.category || "", tool.slug);

  let prosItems = parseStructuredList(tool.pros);
  let consItems = parseStructuredList(tool.cons);

  if (prosItems.length === 0 && consItems.length === 0 && tool.pros_cons) {
    const text = String(tool.pros_cons);
    if (text.includes("Cons:") || text.includes("CONS:")) {
      const parts = text.split(/Cons:|CONS:/i);
      prosItems = parseStructuredList(parts[0].replace(/Pros:|PROS:/i, ""));
      consItems = parseStructuredList(parts[1]);
    } else {
      prosItems = parseStructuredList(text);
    }
  }

  const officialUrl = tool.website_url || tool.official_url || "#";
  const canonicalUrl = `${SITE_URL}/tool/${tool.slug}`;

  // Split category tools into Best Alternatives (first 3) and Related Tools (next 4-5)
  const alternativesList = relatedTools.slice(0, 3);
  const generalRelated = relatedTools.slice(3, 8);

  // Schema.org Grounded Breadcrumbs
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: tool.category || "AI Tools",
        item: `${SITE_URL}/?cat=${encodeURIComponent(tool.category || "")}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: canonicalUrl,
      },
    ],
  };

  // Concise, Non-Duplicative FAQs
  const faqItems = [
    {
      q: `What is ${tool.name} used for?`,
      a: `${tool.name} provides specialized capabilities in the ${tool.category || "software"} domain.`,
    },
    {
      q: `Is ${tool.name} free or paid?`,
      a: tool.pricing
        ? `${tool.name} is categorized under a ${tool.pricing} tier. Check the official website for active plan limits.`
        : `Pricing may change. Check the official website for the latest plans, limits and pricing.`,
    },
    {
      q: `Who should use ${tool.name}?`,
      a: `${tool.name} is designed for professionals and teams managing tasks in ${tool.category || "digital operations"}.`,
    },
    {
      q: `What are the best alternatives to ${tool.name}?`,
      a: alternativesList.length > 0
        ? `Top options include ${alternativesList.map((a) => a.name).join(", ")}.`
        : `Check the ${tool.category || "software"} directory for similar platforms.`,
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  // Target audience definitions
  const getTargetUserDescription = (category?: string) => {
    if (!category) return "teams and professionals seeking software automation tools.";
    const cat = category.toLowerCase();
    if (cat.includes("code") || cat.includes("dev") || cat.includes("cli")) {
      return "developers, system engineers, and technical teams looking to streamline terminal and code operations.";
    }
    if (cat.includes("publish") || cat.includes("blog") || cat.includes("content")) {
      return "writers, independent publishers, and media teams managing blogs, newsletters, or membership platforms.";
    }
    if (cat.includes("chat") || cat.includes("bot")) {
      return "customer support teams, product managers, and developers integrating conversational automation.";
    }
    if (cat.includes("image") || cat.includes("video") || cat.includes("design")) {
      return "designers, video editors, and creative marketers producing visual assets.";
    }
    if (cat.includes("market") || cat.includes("seo")) {
      return "marketing managers, growth strategists, and SEO professionals running campaigns.";
    }
    return `professionals and teams operating in the ${category} space.`;
  };

  // Tool-specific onboarding steps
  const getHowToSteps = (category?: string, name: string = "this software") => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("code") || cat.includes("cli") || cat.includes("dev")) {
      return [
        `Install or access ${name} using your package manager, terminal interface, or developer portal.`,
        `Configure environment variables and authentication API keys as required.`,
        `Execute relevant commands or integrate libraries into your software environment.`,
        `Inspect terminal/build output and deploy your project.`,
      ];
    }
    if (cat.includes("publish") || cat.includes("blog") || cat.includes("content")) {
      return [
        `Access the ${name} portal or deploy the package on your web host.`,
        `Set up your publication domain, site settings, and subscription options.`,
        `Create and format your content or newsletter issues.`,
        `Publish posts and manage subscriber access.`,
      ];
    }
    return [
      `Visit the official website using the link on this page.`,
      `Set up an account or authenticate on the vendor platform.`,
      `Configure settings for your specific project requirements.`,
      `Execute your tasks and export or integrate generated outputs.`,
    ];
  };

  const howToSteps = getHowToSteps(tool.category, tool.name);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tight text-slate-950 font-serif">
                AI Vault<span className="text-blue-600">.</span>
              </span>
            </Link>

            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-sm hover:shadow-blue-500/20 active:scale-95"
            >
              VISIT OFFICIAL PORTAL ↗
            </a>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="text-xs font-semibold text-slate-400">
            <ol className="flex items-center gap-2 flex-wrap">
              <li>
                <Link href="/" className="hover:text-blue-600 transition">Home</Link>
              </li>
              <li>/</li>
              <li>
                <Link href={`/?cat=${encodeURIComponent(tool.category || "")}`} className="hover:text-blue-600 transition">
                  {tool.category || "AI Tools"}
                </Link>
              </li>
              <li>/</li>
              <li className="text-slate-900 font-bold">{tool.name}</li>
            </ol>
          </nav>

          {/* Hero Header */}
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
                      {tool.pricing || "Software Tool"}
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 font-serif truncate">
                    {tool.name}
                  </h1>
                </div>
              </div>
            </div>
          </section>

          {/* 1. What is [Tool]? */}
          <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-black text-slate-950 font-serif">
              What is {tool.name}?
            </h2>
            <div className="prose prose-slate max-w-none text-slate-700 text-base leading-relaxed whitespace-pre-line">
              {cleanDescription || `${tool.name} is a software platform designed to manage ${tool.category || "digital operations"} tasks.`}
            </div>
          </section>

          {/* Core Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              {/* 2. Pricing & Plans */}
              <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl font-black text-slate-950 font-serif">
                  Pricing & Plans
                </h2>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {tool.pricing ? (
                    <>
                      {tool.name} is listed under a <strong className="text-slate-900 font-bold">{tool.pricing}</strong> model.
                    </>
                  ) : null}{" "}
                  Pricing may change. Check the official website for the latest plans, limits and pricing.
                </p>
                <div className="pt-2">
                  <a
                    href={officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-700"
                  >
                    Check Pricing on Official Website →
                  </a>
                </div>
              </section>

              {/* 3. Key Features & Limitations (Pros & Cons) */}
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white border border-emerald-100/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">
                    KEY FEATURES & PROS
                  </h2>
                  {prosItems.length > 0 ? (
                    <ol className="space-y-3 text-sm text-slate-700 list-decimal list-inside">
                      {prosItems.map((item, i) => (
                        <li key={i} className="leading-relaxed">
                          {item.title && (
                            <strong className="text-slate-900 font-bold mr-1">
                              {item.title}:
                            </strong>
                          )}
                          <span>{item.description}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Not publicly specified.</p>
                  )}
                </div>

                <div className="bg-white border border-amber-100/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-amber-700">
                    LIMITATIONS & CONS
                  </h2>
                  {consItems.length > 0 ? (
                    <ol className="space-y-3 text-sm text-slate-700 list-decimal list-inside">
                      {consItems.map((item, i) => (
                        <li key={i} className="leading-relaxed">
                          {item.title && (
                            <strong className="text-slate-900 font-bold mr-1">
                              {item.title}:
                            </strong>
                          )}
                          <span>{item.description}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Not publicly specified.</p>
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
                            {validateAndSanitizeText(alt.description, alt.name) || "Alternative software listing."}
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
                  {tool.name} is best suited for {getTargetUserDescription(tool.category)}
                </p>
              </section>

              {/* 6. How to Use [Tool] */}
              <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <h2 className="text-xl font-black text-slate-950 font-serif">
                  How to Use {tool.name}
                </h2>
                <ol className="list-decimal list-inside space-y-3 text-sm text-slate-700 leading-relaxed">
                  {howToSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </section>

              {/* 7. FAQ */}
              <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <h2 className="text-xl font-black text-slate-950 font-serif">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4 divide-y divide-slate-100">
                  {faqItems.map((faq, index) => (
                    <div key={index} className={index > 0 ? "pt-4" : ""}>
                      <h3 className="text-sm font-bold text-slate-900">{faq.q}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar Specifications */}
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
                    <dd className="font-bold text-blue-600">{tool.category || "Software"}</dd>
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    <dt className="text-slate-500 font-medium">Pricing Model</dt>
                    <dd className="font-bold text-emerald-600">{tool.pricing || "Not specified"}</dd>
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
                  href={officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center py-4 px-6 text-sm font-extrabold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all shadow-md hover:shadow-blue-500/25 active:scale-98"
                >
                  VISIT OFFICIAL PORTAL ↗
                </a>
              </div>
            </aside>
          </div>

          {/* 8. Related Tools */}
          {generalRelated.length > 0 && (
            <section className="pt-8 border-t border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Related Tools in {tool.category || "Software"}
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
                          {validateAndSanitizeText(rel.description, rel.name) || "Software directory listing."}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-400">
                      <span>{rel.category || "Software"}</span>
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
