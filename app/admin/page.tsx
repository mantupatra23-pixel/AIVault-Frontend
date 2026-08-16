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
  overview?: string | null;
  description?: string | null;
  [key: string]: unknown;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AFFILIATE_NETWORKS = [
  "Direct",
  "PartnerStack",
  "Impact",
  "Rewardful",
  "FirstPromoter",
  "CJ",
  "ShareASale",
];
const CATEGORIES = [
  "Marketing",
  "Productivity",
  "Coding",
  "Chatbot",
  "Image",
  "Writing",
  "Audio",
  "Video",
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"affiliate" | "catalog">("affiliate");
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(false);

  // Configure Modal State
  const [selectedTool, setSelectedTool] = useState<ToolRecord | null>(null);
  const [editWebsiteUrl, setEditWebsiteUrl] = useState("");
  const [editAffiliateUrl, setEditAffiliateUrl] = useState("");
  const [editNetwork, setEditNetwork] = useState("Direct");
  const [saving, setSaving] = useState(false);

  // Add/Edit Tool Modal State
  const [editingToolRecord, setEditingToolRecord] = useState<ToolRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Productivity");
  const [formPricing, setFormPricing] = useState("Freemium");
  const [formWebsite, setFormWebsite] = useState("");
  const [formOverview, setFormOverview] = useState("");
  const [formScore, setFormScore] = useState("92");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  async function loadAdminData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ai_tools")
        .select("*")
        .order("name", { ascending: true });
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

  const filteredTools = useMemo(() => {
    return tools.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (t.name || "").toLowerCase().includes(q) ||
        (t.slug || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const isMonetized = Boolean(t.affiliate_url && t.affiliate_url.trim().length > 0);
      if (statusFilter === "monetized") return isMonetized;
      if (statusFilter === "discovery_required") return !isMonetized;
      return true;
    });
  }, [tools, search, statusFilter]);

  const metrics = useMemo(() => {
    const total = tools.length;
    const active = tools.filter((t) => t.affiliate_url && t.affiliate_url.trim().length > 0).length;
    const pending = total - active;
    const clicks = tools.reduce((acc, t) => acc + Number(t.click_count || 0), 0);
    const revenue = tools.reduce((acc, t) => acc + Number(t.revenue_usd || 0), 0);

    return { total, active, pending, clicks, revenue };
  }, [tools]);

  // 1-Click Auto Discover & Monetize 750 Tools Handler
  const handleAutoDiscover = async () => {
    try {
      setDiscovering(true);
      showToast("⚡ Scanning and resolving official domains for all 750 tools...");

      const res = await fetch("/api/admin/auto-discover", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Batch auto-discover failed");
      }

      await loadAdminData();
      showToast(`✓ All ${data.total_updated || 750} tools converted to Direct Official & Monetized links!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Auto-discover failed";
      alert(msg);
    } finally {
      setDiscovering(false);
    }
  };

  const handleOpenConfigure = (t: ToolRecord) => {
    setSelectedTool(t);
    setEditWebsiteUrl(t.website_url || "");
    setEditAffiliateUrl(t.affiliate_url || "");
    setEditNetwork(t.affiliate_network || "Direct");
  };

  const handleSaveAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool) return;

    try {
      setSaving(true);
      const affUrl = editAffiliateUrl.trim();
      const webUrl = editWebsiteUrl.trim();

      const res = await fetch("/api/admin/update-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTool.id,
          slug: selectedTool.slug,
          website_url: webUrl,
          affiliate_url: affUrl,
          affiliate_network: editNetwork,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update tool");
      }

      await loadAdminData();
      setSelectedTool(null);
      showToast(`✓ Official & Monetized URLs saved for ${selectedTool.name}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error saving affiliate settings";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToolRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      setSaving(true);
      const slug = formName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

      const payload = {
        name: formName.trim(),
        slug,
        category: formCategory,
        pricing: formPricing,
        website_url: formWebsite.trim(),
        description: formOverview.trim(),
        overview: formOverview.trim(),
        score: Number(formScore) || 90,
        updated_at: new Date().toISOString(),
      };

      if (editingToolRecord) {
        const { error } = await supabase.from("ai_tools").update(payload).eq("id", editingToolRecord.id);
        if (error) throw error;
        showToast(`✓ Updated ${formName}`);
      } else {
        const { error } = await supabase.from("ai_tools").insert([payload]);
        if (error) throw error;
        showToast(`✓ Added new tool: ${formName}`);
      }

      await loadAdminData();
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save tool.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTool = async (tool: ToolRecord) => {
    if (!confirm(`Are you sure you want to delete ${tool.name}?`)) return;
    try {
      const { error } = await supabase.from("ai_tools").delete().eq("id", tool.id);
      if (error) throw error;
      setTools((prev) => prev.filter((t) => t.id !== tool.id));
      showToast(`Deleted ${tool.name}`);
    } catch (err) {
      console.error(err);
      alert("Failed to delete tool.");
    }
  };

  return (
    <main className="min-h-screen bg-[#050714] text-slate-100 pb-20">
      {/* Dynamic Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-2xl animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#070a1e]/90 backdrop-blur-xl px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-black tracking-tight text-white">
              AI Vault<span className="text-blue-500">.</span>
            </Link>
            <span className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-400">
              Master Admin Suite
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
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-8">
          <button
            onClick={() => setActiveTab("affiliate")}
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === "affiliate" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            📊 Affiliate & Monetization Hub
          </button>

          <button
            onClick={() => setActiveTab("catalog")}
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              activeTab === "catalog" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            🛠️ Catalog & Tool Manager ({tools.length})
          </button>
        </div>

        {/* TAB 1: AFFILIATE COMMAND CENTER */}
        {activeTab === "affiliate" && (
          <div>
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

            {/* BATCH AUTO DISCOVERY ACTION BAR */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0c102b] p-4 mb-8">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">
                  Pending Opportunities Queue ({metrics.pending})
                </span>
                <h3 className="text-sm font-black text-white mt-0.5">Affiliate Discovery & Automation Engine</h3>
              </div>

              <button
                onClick={handleAutoDiscover}
                disabled={discovering}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {discovering ? "Scanning & Monetizing 750 Tools..." : "AUTO DISCOVER AFFILIATES ⚙"}
              </button>
            </div>

            {/* DIRECTORY TABLE SECTION */}
            <section className="rounded-3xl border border-slate-800 bg-[#070a1e] p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-lg font-black text-white">Affiliate Links Index</h2>

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
                    placeholder="Search by name or category..."
                    className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Loading directory index...</div>
              ) : filteredTools.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="pb-3">Tool Name</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Clicks</th>
                        <th className="pb-3">Network</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {filteredTools.map((t) => {
                        const isMonetized = Boolean(t.affiliate_url && t.affiliate_url.trim().length > 0);
                        const slug = String(t.slug || "");

                        return (
                          <tr key={t.id} className="hover:bg-slate-900/40 transition">
                            <td className="py-3.5 pr-4 font-bold text-white">
                              <div>
                                <p>{t.name}</p>
                                <p className="text-[10px] font-normal text-slate-500">/tool/{slug}</p>
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

                            <td className="py-3.5 text-right space-x-1.5">
                              <a
                                href={`/go/${encodeURIComponent(slug)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-300 hover:bg-blue-600 hover:text-white transition"
                              >
                                Test /go ↗
                              </a>

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
        )}

        {/* TAB 2: TOOL CATALOG MANAGER */}
        {activeTab === "catalog" && (
          <section className="rounded-3xl border border-slate-800 bg-[#070a1e] p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black text-white">Full Catalog Tool Manager</h2>
                <p className="text-xs text-slate-400">Add, edit details, scores, or remove tools from production</p>
              </div>

              <button
                onClick={() => {
                  setEditingToolRecord(null);
                  setFormName("");
                  setFormCategory("Productivity");
                  setFormPricing("Freemium");
                  setFormWebsite("");
                  setFormOverview("");
                  setFormScore("92");
                  setIsAddModalOpen(true);
                }}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20"
              >
                + Add New Tool
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="pb-3">Tool</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Pricing</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {tools.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 pr-4 font-bold text-white">
                        <p>{t.name}</p>
                        <p className="text-[10px] text-slate-500">/tool/{t.slug}</p>
                      </td>
                      <td className="py-3.5 pr-4 capitalize text-slate-400">{t.category || "AI"}</td>
                      <td className="py-3.5 pr-4 text-slate-300">{t.pricing || "Freemium"}</td>
                      <td className="py-3.5 pr-4 font-black text-blue-400">{t.score || 90}/100</td>
                      <td className="py-3.5 text-right space-x-2">
                        <Link
                          href={`/tool/${encodeURIComponent(String(t.slug || ""))}`}
                          target="_blank"
                          className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
                        >
                          View ↗
                        </Link>
                        <button
                          onClick={() => {
                            setEditingToolRecord(t);
                            setFormName(t.name || "");
                            setFormCategory(t.category || "Productivity");
                            setFormPricing(t.pricing || "Freemium");
                            setFormWebsite(t.website_url || "");
                            setFormOverview(t.overview || t.description || "");
                            setFormScore(String(t.score || "92"));
                            setIsAddModalOpen(true);
                          }}
                          className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTool(t)}
                          className="rounded-lg bg-rose-600/20 border border-rose-600/30 px-2.5 py-1 text-[11px] font-bold text-rose-400 hover:bg-rose-600 hover:text-white"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* CONFIGURE MODAL */}
      {selectedTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0c102b] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">Configure Links & Tracking</h3>
                <p className="text-xs text-slate-400">{selectedTool.name} (/tool/{selectedTool.slug})</p>
              </div>
              <button onClick={() => setSelectedTool(null)} className="text-slate-400 hover:text-white font-bold text-sm">
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
                  placeholder="https://investorfinder.co"
                  value={editWebsiteUrl}
                  onChange={(e) => setEditWebsiteUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-black uppercase text-blue-400">
                    Monetized Affiliate Redirect URL
                  </label>
                  <span className="text-[9px] font-bold text-emerald-400">Primary Redirect</span>
                </div>
                <input
                  type="text"
                  placeholder="https://investorfinder.co/?ref=aivault"
                  value={editAffiliateUrl}
                  onChange={(e) => setEditAffiliateUrl(e.target.value)}
                  className="w-full rounded-xl border border-blue-500 bg-slate-900 px-3.5 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Users visiting `/go/{selectedTool.slug}` will be routed directly to this URL.
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
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
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

      {/* ADD / EDIT TOOL MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0c102b] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">
                {editingToolRecord ? `Edit ${editingToolRecord.name}` : "Add New AI Tool"}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveToolRecord} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Tool Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ChatEngine Pro"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Pricing Tier</label>
                  <select
                    value={formPricing}
                    onChange={(e) => setFormPricing(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none"
                  >
                    <option value="Free">Free</option>
                    <option value="Freemium">Freemium</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://example.ai"
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">AI Vault Score</label>
                  <input
                    type="number"
                    min="60"
                    max="99"
                    value={formScore}
                    onChange={(e) => setFormScore(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Overview / Description</label>
                <textarea
                  rows={3}
                  placeholder="Short description of capabilities..."
                  value={formOverview}
                  onChange={(e) => setFormOverview(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2 font-black text-white hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? "Saving..." : "Save Tool"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
