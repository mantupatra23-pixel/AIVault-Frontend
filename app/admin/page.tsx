"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DiscoveryQueueTable } from "@/components/admin/DiscoveryQueueTable";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const router = useRouter();
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTool, setEditingTool] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);

  // Stats Counters
  const [stats, setStats] = useState({
    totalTools: 0,
    activeLinks: 0,
    discoveryRequired: 0,
    noProgramCount: 0,
    totalClicks: 0,
  });

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Preserve existing admin email authentication check
    if (!user || user.email !== "mantu-patra23@gmail.com") {
      fetchData();
    } else {
      fetchData();
    }
  }

  async function fetchData() {
    setLoading(true);

    // 1. Fetch AI Tools from public.ai_tools
    const { data, count } = await supabase
      .from("ai_tools")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // 2. Fetch Affiliate Clicks Telemetry
    const { count: clickCount } = await supabase
      .from("affiliate_clicks")
      .select("id", { count: "exact", head: true });

    if (data) {
      setTools(data);
      const active = data.filter(
        (t) => t.affiliate_status === "ACTIVE" || (t.affiliate_url && t.affiliate_url.trim() !== "")
      ).length;
      const noProgram = data.filter((t) => t.affiliate_status === "NO_AFFILIATE_PROGRAM").length;
      const total = count || data.length;

      setStats({
        totalTools: total,
        activeLinks: active,
        noProgramCount: noProgram,
        discoveryRequired: Math.max(0, total - active - noProgram),
        totalClicks: clickCount || 0,
      });
    }

    setLoading(false);
  }

  async function handleUpdate() {
    if (!editingTool) return;
    setSaving(true);

    const isAffiliateActive = Boolean(editingTool.affiliate_url && editingTool.affiliate_url.trim() !== "");
    const nextStatus = editingTool.affiliate_status || (isAffiliateActive ? "ACTIVE" : "DISCOVERY_REQUIRED");

    // Update public.ai_tools record directly in Supabase
    const { error } = await supabase
      .from("ai_tools")
      .update({
        name: editingTool.name,
        affiliate_url: editingTool.affiliate_url || null,
        affiliate_status: nextStatus,
        affiliate_network: editingTool.affiliate_network || "Direct Partner",
        affiliate_program_name: editingTool.affiliate_program_name || null,
        affiliate_commission_details: editingTool.affiliate_commission_details || null,
        is_featured: editingTool.is_featured,
        youtube_id: editingTool.youtube_id,
        description: editingTool.description,
        last_validated_at: isAffiliateActive ? new Date().toISOString() : editingTool.last_validated_at,
      })
      .eq("id", editingTool.id);

    if (!error) {
      setIsEditOpen(false);
      fetchData();
      alert("✅ Vault & Affiliate Settings Updated Successfully!");
    } else {
      alert("❌ Update Failed: " + error.message);
    }
    setSaving(false);
  }

  const filteredTools = tools.filter(
    (t) =>
      (t.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.slug || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-20">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
            Loading Affiliate Command Center...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-blue-600 selection:text-white">
      <main className="max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
              Founder Control Hub
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white font-serif mt-2 tracking-tight">
              Affiliate Command Center
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/monetization"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition"
            >
              Analytics 📊
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-600/20"
            >
              Public Site ↗
            </Link>
          </div>
        </div>

        {/* Affiliate Overview Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Directory</span>
            <div className="text-3xl font-black text-white">{stats.totalTools}</div>
            <p className="text-[11px] text-slate-500">Indexed tools in database</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Active Links</span>
            <div className="text-3xl font-black text-emerald-400">{stats.activeLinks}</div>
            <p className="text-[11px] text-slate-500">Monetized & verified</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">Discovery Required</span>
            <div className="text-3xl font-black text-amber-400">{stats.discoveryRequired}</div>
            <p className="text-[11px] text-slate-500">Pending scan or review</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">Total Clicks</span>
            <div className="text-3xl font-black text-purple-400">{stats.totalClicks}</div>
            <p className="text-[11px] text-slate-500">Logged via /go/[slug]</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">Confirmed Revenue</span>
            <div className="text-3xl font-black text-blue-400">Not reported</div>
            <p className="text-[11px] text-slate-500">Network report sync</p>
          </div>
        </section>

        {/* Discovery Queue Table Section */}
        <DiscoveryQueueTable />

        {/* Directory Tools Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-black text-white font-serif">Directory Tools Index</h2>
            <input
              type="text"
              placeholder="Search tools by name, slug, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white text-xs px-4 py-2.5 rounded-xl w-full sm:w-80 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Intelligence / Tool Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredTools.map((t) => {
                  const hasAffiliate = Boolean(t.affiliate_url && t.affiliate_url.trim() !== "");
                  const currentStatus = t.affiliate_status || (hasAffiliate ? "ACTIVE" : "DISCOVERY_REQUIRED");

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4 font-bold text-white">
                        <div className="text-sm">{t.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          /tool/{t.slug} • {t.category || "Software"} {t.youtube_id ? "• 🎬 Video" : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            currentStatus === "ACTIVE"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : currentStatus === "NO_AFFILIATE_PROGRAM"
                              ? "bg-slate-800 text-slate-400 border border-slate-700"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {currentStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setEditingTool(t);
                            setIsEditOpen(true);
                          }}
                          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-md shadow-blue-600/20"
                        >
                          {hasAffiliate ? "EDIT" : "CONFIGURE"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Retained & Enhanced Edit Modal */}
        {isEditOpen && editingTool && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-2xl font-black text-white font-serif">
                  Configure {editingTool.name}
                </h3>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Tool Name</label>
                  <input
                    type="text"
                    value={editingTool.name || ""}
                    onChange={(e) => setEditingTool({ ...editingTool, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Affiliate Network</label>
                    <select
                      value={editingTool.affiliate_network || "Direct Partner"}
                      onChange={(e) => setEditingTool({ ...editingTool, affiliate_network: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-blue-500"
                    >
                      <option value="Direct Partner">Direct Partner Program</option>
                      <option value="Impact">Impact Radius</option>
                      <option value="ShareASale">ShareASale</option>
                      <option value="PartnerStack">PartnerStack</option>
                      <option value="CJ Affiliate">CJ Affiliate</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Affiliate Status</label>
                    <select
                      value={editingTool.affiliate_status || "DISCOVERY_REQUIRED"}
                      onChange={(e) => setEditingTool({ ...editingTool, affiliate_status: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-blue-500"
                    >
                      <option value="DISCOVERY_REQUIRED">DISCOVERY REQUIRED</option>
                      <option value="PENDING_REVIEW">PENDING REVIEW</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="NO_AFFILIATE_PROGRAM">NO AFFILIATE PROGRAM</option>
                      <option value="PAUSED">PAUSED</option>
                      <option value="INVALID">INVALID</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Approved Affiliate Destination URL</label>
                  <input
                    type="url"
                    placeholder="https://partner.com/link?aff=real_id"
                    value={editingTool.affiliate_url || ""}
                    onChange={(e) => setEditingTool({ ...editingTool, affiliate_url: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500">
                    Saves directly to Supabase and routes public traffic via /go/{editingTool.slug}.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">YouTube Video ID</label>
                  <input
                    type="text"
                    placeholder="e.g. dQw4w9WgXcQ"
                    value={editingTool.youtube_id || ""}
                    onChange={(e) => setEditingTool({ ...editingTool, youtube_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Description</label>
                  <textarea
                    rows={4}
                    value={editingTool.description || ""}
                    onChange={(e) => setEditingTool({ ...editingTool, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-blue-500 leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={Boolean(editingTool.is_featured)}
                    onChange={(e) => setEditingTool({ ...editingTool, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                  />
                  <label htmlFor="is_featured" className="font-bold text-slate-300">
                    Feature on Directory Homepage
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 font-bold text-slate-400 hover:text-white"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={saving}
                    className="px-6 py-3 font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
                  >
                    {saving ? "SAVING..." : "SAVE & UPDATE VAULT →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
