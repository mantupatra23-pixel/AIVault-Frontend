import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Missing Affiliate Links | AI Vault Admin",
  robots: { index: false, follow: false },
};

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export default async function MissingAffiliatesPage() {
  const supabase = getSupabaseClient();
  let missingTools: { id: string; name: string; slug: string; category: string; website_url: string | null }[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("ai_tools")
      .select("id, name, slug, category, website_url")
      .or("affiliate_url.is.null,affiliate_status.neq.ACTIVE")
      .limit(100);

    missingTools = data || [];
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20">
              High Priority Optimization
            </span>
            <h1 className="text-3xl font-black text-white font-serif mt-2">
              Missing Affiliate Links ({missingTools.length})
            </h1>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition"
          >
            ← Back to Command Center
          </Link>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="divide-y divide-slate-800">
            {missingTools.map((tool) => (
              <div key={tool.id} className="py-4 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-white">{tool.name}</h3>
                  <p className="text-xs text-slate-400">{tool.category || "Software"} • /tool/{tool.slug}</p>
                </div>
                <div className="flex items-center gap-3">
                  {tool.website_url && (
                    <a
                      href={tool.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-slate-400 hover:text-white"
                    >
                      Website ↗
                    </a>
                  )}
                  <Link
                    href={`/admin?configure=${tool.id}`}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition"
                  >
                    CONFIGURE NOW →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
