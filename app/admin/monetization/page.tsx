import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Monetization Analytics | AI Vault Admin",
  robots: { index: false, follow: false },
};

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export default async function MonetizationAdminPage() {
  const supabase = getSupabaseClient();

  let totalTools = 0;
  let affiliateTools = 0;
  let totalClicks = 0;
  let topClicks: { slug: string; count: number }[] = [];

  if (supabase) {
    const { count: tCount } = await supabase.from("ai_tools").select("id", { count: "exact", head: true });
    totalTools = tCount || 0;

    const { count: aCount } = await supabase
      .from("ai_tools")
      .select("id", { count: "exact", head: true })
      .not("affiliate_url", "is", null);
    affiliateTools = aCount || 0;

    const { count: cCount } = await supabase.from("affiliate_clicks").select("id", { count: "exact", head: true });
    totalClicks = cCount || 0;

    const { data: rawClicks } = await supabase.from("affiliate_clicks").select("slug").limit(1000);

    if (rawClicks) {
      const counts: Record<string, number> = {};
      rawClicks.forEach((c) => {
        counts[c.slug] = (counts[c.slug] || 0) + 1;
      });
      topClicks = Object.entries(counts)
        .map(([slug, count]) => ({ slug, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }
  }

  const coveragePercent = totalTools > 0 ? ((affiliateTools / totalTools) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 sm:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black font-serif">Monetization & Affiliate Analytics</h1>
            <p className="text-xs text-slate-500">Live outbound traffic and affiliate link coverage</p>
          </div>
          <Link href="/" className="text-xs font-bold text-blue-600 hover:underline">
            ← Back to Public Site
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Directory Tools</span>
            <div className="text-3xl font-black text-slate-900">{totalTools}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Affiliate Enabled</span>
            <div className="text-3xl font-black text-emerald-600">{affiliateTools}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Affiliate Coverage</span>
            <div className="text-3xl font-black text-blue-600">{coveragePercent}%</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Outbound Clicks</span>
            <div className="text-3xl font-black text-purple-600">{totalClicks}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Top Outbound Click Destinations</h2>
          {topClicks.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {topClicks.map((item, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center text-sm">
                  <span className="font-mono text-xs font-bold text-slate-800">/tool/{item.slug}</span>
                  <span className="font-bold text-blue-600">{item.count} clicks</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No outbound clicks recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
