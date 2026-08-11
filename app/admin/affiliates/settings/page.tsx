import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Affiliate Network Credentials & Settings | AI Vault Admin",
  robots: { index: false, follow: false },
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function AffiliateSettingsPage() {
  const supabase = getSupabaseClient();
  let settings: { id: string; network_name: string; publisher_id: string | null; tracking_default: string | null; is_enabled: boolean }[] = [];

  if (supabase) {
    const { data } = await supabase.from("affiliate_settings").select("*");
    settings = data || [];
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
              Security & Credentials
            </span>
            <h1 className="text-3xl font-black text-white font-serif mt-2">
              Affiliate Network Credentials
            </h1>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition"
          >
            ← Back to Command Center
          </Link>
        </div>

        <AdminSettingsForm initialSettings={settings} />
      </div>
    </div>
  );
}
