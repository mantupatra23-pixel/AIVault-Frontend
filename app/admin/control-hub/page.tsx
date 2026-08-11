import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { CommandToolTable } from "@/components/admin/CommandToolTable";
import { ControlHubAlertPopup } from "@/components/admin/ControlHubAlertPopup";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Founder Control Hub & Affiliate Command Center | AI Vault Admin",
  robots: { index: false, follow: false },
};

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export default async function ControlHubPage() {
  const supabase = getSupabaseClient();

  let totalTools = 0;
  let activeLinks = 0;
  let missingCount = 0;
  let totalClicks = 0;
  let uniqueClicks = 0;
  let totalConversions = 0;
  let confirmedCommission: number | null = null;

  let toolRows: any[] = [];

  if (supabase) {
    const { count: tCount } = await supabase.from("ai_tools").select("id", { count: "exact", head: true });
    totalTools = tCount || 0;

    const { count: aCount } = await supabase.from("ai_tools").select("id", { count: "exact", head: true }).eq("affiliate_status", "ACTIVE");
    activeLinks = aCount || 0;

    missingCount = totalTools - activeLinks;

    const { count: cCount } = await supabase.from("affiliate_clicks").select("id", { count: "exact", head: true });
    totalClicks = cCount || 0;

    const { data: rawTools } = await supabase
      .from("ai_tools")
      .select("id, name, slug, category, website_url, affiliate_url, affiliate_status, affiliate_network")
      .limit(100);

    const { data: rawClicks } = await supabase.from("affiliate_clicks").select("tool_id, visitor_hash");

    const clickCounts: Record<string, number> = {};
    const uniqueHashes: Record<string, Set<string>> = {};

    if (rawClicks) {
      rawClicks.forEach((c) => {
        if (c.tool_id) {
          clickCounts[c.tool_id] = (clickCounts[c.tool_id] || 0) + 1;
          if (!uniqueHashes[c.tool_id]) uniqueHashes[c.tool_id] = new Set();
          if (c.visitor_hash) uniqueHashes[c.tool_id].add(c.visitor_hash);
        }
      });
      uniqueClicks = Object.values(uniqueHashes).reduce((acc, set) => acc + set.size, 0);
    }

    if (rawTools) {
      toolRows = rawTools.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        category: t.category || "Software",
        official_url: t.website_url,
        affiliate_url: t.affiliate_url,
        affiliate_status: t.affiliate_status || (t.affiliate_url ? "ACTIVE" : "NO_LINK"),
        affiliate_network: t.affiliate_network || "Direct",
        clicks: clickCounts[t.id] || 0,
        unique_clicks: uniqueHashes[t.id]?.size || 0,
        conversions: 0,
        commission_confirmed: null,
      }));
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10 font-sans selection:bg-blue-600 selection:text-white">
      {/* Real-time Unread Alerts Modal Popup */}
      <ControlHubAlertPopup missingCount={missingCount} />

      <div className="max-w-7xl mx-auto space-y-10">
        {/* Navigation Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
              Founder Portal
            </span>
            <h1 className="text-3xl font-black text-white font-serif mt-2">
              Affiliate Command Center
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/admin/affiliates/export"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition"
            >
              EXPORT CSV 📥
            </a>
            <Link
              href="/admin/affiliates/missing"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition"
            >
              MISSING LINKS ({missingCount})
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-600/20"
            >
              PUBLIC SITE ↗
            </Link>
          </div>
        </header>

        {/* Real Overview Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Directory</span>
            <div className="text-3xl font-black text-white">{totalTools}</div>
            <p className="text-[11px] text-slate-500">Indexed tools</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Active Links</span>
            <div className="text-3xl font-black text-emerald-400">{activeLinks}</div>
            <p className="text-[11px] text-slate-500">Monetized tools</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">Missing Links</span>
            <div className="text-3xl font-black text-amber-400">{missingCount}</div>
            <p className="text-[11px] text-slate-500">Unmonetized</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">Total Clicks</span>
            <div className="text-3xl font-black text-purple-400">{totalClicks}</div>
            <p className="text-[11px] text-slate-500">{uniqueClicks} unique sessions</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">Confirmed Revenue</span>
            <div className="text-3xl font-black text-blue-400">
              {confirmedCommission !== null ? `$${confirmedCommission}` : "Not reported"}
            </div>
            <p className="text-[11px] text-slate-500">Network sync</p>
          </div>
        </section>

        {/* Searchable Tool Table */}
        <CommandToolTable initialTools={toolRows} />
      </div>
    </div>
  );
}
