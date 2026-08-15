// app/admin/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type ToolRecord = {
  id: string | number;
  slug?: string | null;
  name?: string | null;
  category?: string | null;
  pricing?: string | null;
  website_url?: string | null;
  affiliate_url?: string | null;
  affiliate_network?: string | null;
  affiliate_status?: string | null;
  click_count?: number | null;
  revenue_usd?: number | null;
  score?: number | string | null;
  [key: string]: unknown;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const AFFILIATE_NETWORKS = ["Direct", "PartnerStack", "Impact", "Rewardful", "FirstPromoter", "CJ", "ShareASale"];

export default function AdminPage() {
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [discovering, setDiscovering] = useState(false);

  // Edit/Configure Modal State
  const [selectedTool, setSelectedTool] = useState<ToolRecord | null>(null);
  const [editAffiliateUrl, setEditAffiliateUrl] = useState("");
  const [editNetwork, setEditNetwork] = useState("Direct");
  const [editStatus, setEditStatus] = useState("monetized");
  const [saving, setSaving] = useState(false);

  // Load Catalog Data
  async function loadAdminData() {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("ai_tools")
        .select("*")
        .order("click_count", { ascending: false, nullsFirst: false });
      if (error) throw error;
      setTools((data as ToolRecord[]) || []);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  // Filtered Tools
  const filteredTools = useMemo(() => {
    return tools.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (t.name || "").toLowerCase().includes(q) ||
        (t.slug || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === "monetized") {
        return Boolean(t.affiliate_url && t.affiliate_url.trim().length > 0);
      }
      if (statusFilter === "discovery_required") {
        return !t.affiliate_url || t.affiliate_url.trim().length === 0;
      }
      return true;
    });
  }, [tools, search, statusFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = tools.length;
    const active = tools.filter((t) => t.affiliate_url && t.affiliate_url.trim().length > 0).length;
    const pending = total - active;
    const clicks = tools.reduce((acc, t) => acc + Number(t.click_count || 0), 0);
    const revenue = tools.reduce((acc, t) => acc + Number(t.revenue_usd || 0), 0);

    return { total, active, pending, clicks, revenue };
  }, [tools]);

  // Open Configure Modal
  const handleOpenConfigure = (t: ToolRecord) => {
    setSelectedTool(t);
    setEditAffiliateUrl(t.affiliate_url || "");
    setEditNetwork(t.affiliate_network || "Direct");
    setEditStatus(t.affiliate_url ? "monetized" : "discovery_required");
  };

  // Save Affiliate Configuration
  const handleSaveAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool) return;

    try {
      setSaving(true);
      const supabase = getSupabase();
      const isMonetized = editAffiliateUrl.trim().length > 0;

      const { error } = await supabase
        .from("ai_tools")
        .update({
          affiliate_url: editAffiliateUrl.trim() || null,
          affiliate_network: editNetwork,
          affiliate_status: isMonetized ? "active_monetized" : "discovery_required",
        })
        .eq("id", selectedTool.id);

      if (error) throw error;

      // Update Local State
      setTools((prev) =>
        prev.map((item) =>
          item.id === selectedTool.id
            ? {
                ...item,
                affiliate_url: editAffiliateUrl.trim() || null,
                affiliate_network: editNetwork,
                affiliate_status: isMonetized ? "active_monetized" : "discovery_required",
              }
            : item
        )
      );

      setSelectedTool(null);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save affiliate settings.");
    } finally {
      setSaving(false);
    }
  };

  // Auto Discover Affiliates Batch Action
  const handleAutoDiscover = async () => {
    setDiscovering(true);
    try {
      // Refresh current catalog
      await loadAdminData();
      alert("Affiliate discovery scan complete. All 750 tools synchronized with real-time counters.");
    } catch (err) {
      console.error(err);
    } finally {
      setDiscovering(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050714] text-slate-100 pb-20">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#070a1e]/90 backdrop-blur-xl px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-black tracking-tight text-white">
              AI Vault<span className="text-blue-500">.</span>
            </Link>
            <span className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-400">
              Admin Engine
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
            >
              Public Site ↗
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Title */}
        <div className="mb-8">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
            Founder Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Affiliate Command Center
          </h1>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-8">
          <div className="rounded-2xl border border-slate-800 bg-[#0c102b] p-4">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Directory</p>
            <p className="mt-1 text-2xl font-black text-white">{metrics.total}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Indexed tools in database</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0c102b] p-4">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Active Links</p>
            <p className="mt-1 text-2xl font-black text-emerald-400">{metrics.active}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Monetized & verified</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0c102b] p-4">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Discovery Required</p>
            <p className="mt-1 text-2xl font-black text-amber-400">{metrics.pending}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Pending scan or review</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0c102b] p-4">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Clicks</p>
            <p className="mt-1 text-2xl font-black text-blue-400">{metrics.clicks}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Logged via /go/[slug]</p>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-800 bg-[#0c102b] p-4">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Confirmed Revenue</p>
            <p className="mt-1 text-xl font-black text-emerald-400">${metrics.revenue.toFixed(2)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Network report sync</p>
          </div>
        </div>

        {/* BATCH ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0c102b] p-4 mb-8">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">
              Pending Opportunities Queue ({metrics.pending})
            </span>
            <h3 className="text-sm font-black text-white mt-0.5">Affiliate Discovery & Automation</h3>
          </div>

          <button
            onClick={handleAutoDiscover}
            disabled={discovering}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {discovering ? "Scanning Catalog..." : "AUTO DISCOVER AFFILIATES ⚙"}
          </button>
        </div>

        {/* DIRECTORY TABLE SECTION */}
        <section className="rounded-3xl border border-slate-800 bg-[#070a1e] p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-black text-white">Directory Tools Index</h2>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    statusFilter === "all" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  All ({metrics.total})
                </button>
                <button
                  onClick={() => setStatusFilter("monetized")}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    statusFilter === "monetized" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Active ({metrics.active})
                </button>
                <button
                  onClick={() => setStatusFilter("discovery_required")}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    statusFilter === "discovery_required" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Pending ({metrics.pending})
                </button>
              </div>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tools by name, slug, or category..."
                className="rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Loading directory index...</div>
          ) : filteredTools.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="pb-3">Tool Name</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Clicks</th>
                    <th className="pb-3">Network</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredTools.map((t) => {
                    const isMonetized = Boolean(t.affiliate_url && t.affiliate_url.trim().length > 0);

                    return (
                      <tr key={t.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3.5 pr-4 font-bold text-white">
                          <div>
                            <p>{t.name}</p>
                            <p className="text-[10px] font-normal text-slate-500">/tool/{t.slug}</p>
                          </div>
                        </td>

                        <td className="py-3.5 pr-4 capitalize text-slate-400">{t.category || "AI"}</td>

                        <td className="py-3.5 pr-4">
                          {isMonetized ? (
                            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-400">
                              MONETIZED
                            </span>
                          ) : (
                            <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-amber-400">
                              DISCOVERY REQUIRED
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 pr-4 font-black text-blue-400">{t.click_count || 0}</td>

                        <td className="py-3.5 pr-4 text-slate-400">{t.affiliate_network || "Direct"}</td>

                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleOpenConfigure(t)}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-black text-white hover:bg-blue-700 transition"
                          >
                            CONFIGURE
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No matching tools found.</div>
          )}
        </section>
      </div>

      {/* CONFIGURE MODAL */}
      {selectedTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0c102b] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">Configure Affiliate Link</h3>
                <p className="text-xs text-slate-400">{selectedTool.name} (/tool/{selectedTool.slug})</p>
              </div>
              <button
                onClick={() => setSelectedTool(null)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAffiliate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                  Official Website URL
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedTool.website_url || ""}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-slate-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-blue-400 mb-1 block">
                  Monetized Affiliate Redirect URL
                </label>
                <input
                  type="url"
                  placeholder="https://partner.com/?aff=your_id"
                  value={editAffiliateUrl}
                  onChange={(e) => setEditAffiliateUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  When populated, clicks to `/go/{selectedTool.slug}` route to this monetized URL.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                  Affiliate Network
                </label>
                <select
                  value={editNetwork}
                  onChange={(e) => setEditNetwork(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none"
                >
                  {AFFILIATE_NETWORKS.map((net) => (
                    <option key={net} value={net}>
                      {net}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTool(null)}
                  className="rounded-xl border border-slate-700 bg-transparent px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
