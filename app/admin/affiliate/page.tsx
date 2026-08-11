import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { AffiliateMetrics, AffiliateOpportunity } from "@/types/affiliate";
import { AffiliateNotificationModal } from "@/components/admin/AffiliateNotificationModal";
import { AdminConnectActionForm } from "@/components/admin/AdminConnectActionForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Affiliate Management Center | AI Vault Admin",
  robots: { index: false, follow: false },
};

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export default async function AffiliateAdminCenterPage() {
  const supabase = getSupabaseClient();

  const metrics: AffiliateMetrics = {
    totalTools: 0,
    affiliateActiveTools: 0,
    opportunitiesFound: 0,
    pendingApplications: 0,
    brokenLinksCount: 0,
    noProgramCount: 0,
    totalOutboundClicks: 0,
    totalConversions: 0,
    pendingCommission: 0.0,
    approvedCommission: 0.0,
    paidCommission: 0.0,
  };

  let opportunities: AffiliateOpportunity[] = [];
  let toolsNeedingConnection: { id: string; name: string; slug: string; website_url: string | null; affiliate_status: string }[] = [];

  if (supabase) {
    const { count: tCount } = await supabase.from("ai_tools").select("id", { count: "exact", head: true });
    metrics.totalTools = tCount || 0;

    const { count: aCount } = await supabase.from("ai_tools").select("id", { count: "exact", head: true }).eq("affiliate_status", "ACTIVE");
    metrics.affiliateActiveTools = aCount || 0;

    const { count: bCount } = await supabase.from("ai_tools").select("id", { count: "exact", head: true }).eq("affiliate_status", "LINK_INVALID");
    metrics.brokenLinksCount = bCount || 0;

    const { count: cCount } = await supabase.from("affiliate_clicks").select("id", { count: "exact", head: true });
    metrics.totalOutboundClicks = cCount || 0;

    // Opportunities
    const { data: opps } = await supabase.from("affiliate_opportunities").select("*").order("created_at", { ascending: false }).limit(10);
    opportunities = (opps as AffiliateOpportunity[]) || [];
    metrics.opportunitiesFound = opportunities.length;

    // Fetch un-connected tools
    const { data: rawTools } = await supabase
      .from("ai_tools")
      .select("id, name, slug, website_url, affiliate_status")
      .or("affiliate_status.eq.NO_PROGRAM,affiliate_status.eq.PROGRAM_FOUND,affiliate_status.eq.LINK_INVALID")
      .limit(15);

    toolsNeedingConnection = rawTools || [];
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10 font-sans selection:bg-blue-600 selection:text-white">
      {/* Real-time Admin Notification Modal */}
      <AffiliateNotificationModal />

      <div className="max-w-7xl mx-auto space-y-10">
        {/* Navigation Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
              Admin Operations
            </span>
            <h1 className="text-3xl font-black text-white font-serif mt-2">
              Affiliate Management Center
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/monetization"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition"
            >
              Traffic Analytics
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-600/20"
            >
              Public Directory ↗
            </Link>
          </div>
        </header>

        {/* Real Metrics Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Directory Index</span>
            <div className="text-3xl font-black text-white">{metrics.totalTools}</div>
            <p className="text-[11px] text-slate-500">Verified tools in database</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Active Affiliate Links</span>
            <div className="text-3xl font-black text-emerald-400">{metrics.affiliateActiveTools}</div>
            <p className="text-[11px] text-slate-500">Routing via /go/[slug]</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">Detected Opportunities</span>
            <div className="text-3xl font-black text-amber-400">{metrics.opportunitiesFound}</div>
            <p className="text-[11px] text-slate-500">Programs ready for connection</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">Total Outbound Clicks</span>
            <div className="text-3xl font-black text-purple-400">{metrics.totalOutboundClicks}</div>
            <p className="text-[11px] text-slate-500">Recorded outbound redirects</p>
          </div>
        </section>

        {/* Main Grid: Management Form & Program Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Connection Action Form */}
            <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white font-serif">
                  Connect & Activate Approved Affiliate Link
                </h2>
                <p className="text-xs text-slate-400">
                  Select a directory tool, enter its approved affiliate destination URL, and set status to ACTIVE.
                </p>
              </div>

              <AdminConnectActionForm tools={toolsNeedingConnection} />
            </section>

            {/* Opportunities Table */}
            <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-black text-white font-serif">
                Detected Affiliate Opportunities
              </h2>

              {opportunities.length > 0 ? (
                <div className="divide-y divide-slate-800">
                  {opportunities.map((opp) => (
                    <div key={opp.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">{opp.tool_name}</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            {opp.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate">
                          Program: {opp.affiliate_program_name || "Official Partner Program"}
                        </p>
                      </div>

                      {opp.signup_url && (
                        <a
                          href={opp.signup_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition"
                        >
                          OPEN SIGNUP ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 italic border border-dashed border-slate-800 rounded-2xl">
                  No pending opportunities detected.
                </div>
              )}
            </section>
          </div>

          {/* System Specs Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-10">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                System Rules & Security
              </h3>

              <ul className="space-y-3 text-xs text-slate-300 leading-relaxed list-disc list-inside">
                <li>Never invents fake referral parameters (`?ref=fake`).</li>
                <li>Outbound clicks route through `/go/[slug]` to prevent open redirects.</li>
                <li>Public tool pages show disclosure: <em>"Some links may be affiliate links."</em></li>
                <li>Invalid links trigger alerts and fall back to `website_url`.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
