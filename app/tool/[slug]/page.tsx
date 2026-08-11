import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ToolLogo } from "@/components/ToolLogo";
import { AdSlot } from "@/components/AdSlot";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }> | { slug: string };
};

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  const rawSlug = resolved?.slug || "";
  const cleanSlug = decodeURIComponent(rawSlug).toLowerCase().trim();

  const supabase = getClient();
  if (!supabase) return { title: "AI Vault" };

  const { data: tool } = await supabase
    .from("ai_tools")
    .select("name, slug, description, category, image_url, logo_url, seo_title, seo_description")
    .ilike("slug", cleanSlug)
    .maybeSingle();

  if (!tool) {
    return { title: "Tool Not Found | AI Vault" };
  }

  return {
    title: tool.seo_title || `${tool.name} Review & Pricing | AI Vault`,
    description: tool.seo_description || tool.description?.slice(0, 155) || "Tool specs",
    alternates: { canonical: `${SITE_URL}/tool/${tool.slug}` },
  };
}

export default async function ToolPage({ params }: Props) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug || "";
  const cleanSlug = decodeURIComponent(rawSlug).toLowerCase().trim();

  const supabase = getClient();

  if (!supabase || !cleanSlug) {
    notFound();
  }

  // Multi-tier Fallback Query directly from ai_tools table
  let { data: tool, error } = await supabase
    .from("ai_tools")
    .select("*")
    .ilike("slug", cleanSlug)
    .maybeSingle();

  // Secondary Fallback if exact ilike fails
  if (!tool) {
    const { data: fallbackData } = await supabase
      .from("ai_tools")
      .select("*")
      .or(`slug.eq.${cleanSlug},slug.ilike.%${cleanSlug}%`)
      .limit(1);

    if (fallbackData && fallbackData.length > 0) {
      tool = fallbackData[0];
    }
  }

  if (error || !tool) {
    console.error(`[404_TRIGGER] Slug=${cleanSlug} Error:`, error);
    notFound();
  }

  const officialUrl = tool.website_url || tool.official_url || "#";
  const destinationUrl = tool.affiliate_url || officialUrl;
  const isAffiliate = Boolean(tool.affiliate_url);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-950 font-serif">
              AI Vault<span className="text-blue-600">.</span>
            </span>
          </Link>

          <a
            href={destinationUrl}
            target="_blank"
            rel={isAffiliate ? "nofollow sponsored" : "noopener noreferrer"}
            className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all"
          >
            {isAffiliate ? "VISIT PARTNER PORTAL ↗" : "VISIT OFFICIAL PORTAL ↗"}
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
        <nav aria-label="Breadcrumb" className="text-xs font-semibold text-slate-400">
          <ol className="flex items-center gap-2 flex-wrap">
            <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
            <li>/</li>
            <li><Link href={`/?cat=${encodeURIComponent(tool.category || "")}`}>{tool.category || "Software"}</Link></li>
            <li>/</li>
            <li className="text-slate-900 font-bold">{tool.name}</li>
          </ol>
        </nav>

        <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5 sm:gap-6 min-w-0">
              <ToolLogo tool={tool} size="xl" />

              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700">
                    {tool.category || "Software"}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700">
                    {tool.pricing || "Freemium"}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-slate-950 font-serif truncate">
                  {tool.name}
                </h1>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-slate-950 font-serif">
            What is {tool.name}?
          </h2>
          <div className="prose prose-slate max-w-none text-slate-700 text-base leading-relaxed whitespace-pre-line">
            {tool.description || `${tool.name} is a software platform designed for ${tool.category || "digital"} operations.`}
          </div>
        </section>

        <AdSlot slotId="tool-after-overview" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-xl font-black text-slate-950 font-serif">
                Pricing & Plans
              </h2>
              <p className="text-slate-700 text-sm leading-relaxed font-medium">
                {tool.pricing || "Pricing information varies — check official website."}
              </p>
              <a
                href={destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase text-blue-600"
              >
                CHECK OFFICIAL PRICING TIERS →
              </a>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Specifications
              </h2>
              <dl className="space-y-4 text-sm divide-y divide-slate-100">
                <div className="pt-2 flex justify-between items-center">
                  <dt className="text-slate-500">Software</dt>
                  <dd className="font-bold text-slate-900">{tool.name}</dd>
                </div>
                <div className="pt-4 flex justify-between items-center">
                  <dt className="text-slate-500">Category</dt>
                  <dd className="font-bold text-blue-600">{tool.category || "Software"}</dd>
                </div>
              </dl>

              <a
                href={destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center py-4 px-6 text-sm font-extrabold uppercase text-white bg-blue-600 hover:bg-blue-700 rounded-2xl"
              >
                VISIT OFFICIAL PORTAL ↗
              </a>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
