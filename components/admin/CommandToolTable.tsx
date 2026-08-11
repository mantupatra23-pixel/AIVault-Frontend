"use client";

import { useState } from "react";
import { ControlHubToolRow } from "@/types/affiliate-command";

export function CommandToolTable({ initialTools }: { initialTools: ControlHubToolRow[] }) {
  const [tools, setTools] = useState(initialTools);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTool, setSelectedTool] = useState<ControlHubToolRow | null>(null);
  const [affiliateUrlInput, setAffiliateUrlInput] = useState("");
  const [networkInput, setNetworkInput] = useState("Direct");
  const [loading, setLoading] = useState(false);

  const filteredTools = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenConfigure = (tool: ControlHubToolRow) => {
    setSelectedTool(tool);
    setAffiliateUrlInput(tool.affiliate_url || "");
    setNetworkInput(tool.affiliate_network || "Direct");
  };

  const handleSaveAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool) return;

    setLoading(true);

    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: selectedTool.id,
          affiliateUrl: affiliateUrlInput,
          networkName: networkInput,
          status: affiliateUrlInput ? "ACTIVE" : "NO_LINK",
        }),
      });

      if (res.ok) {
        setTools((prev) =>
          prev.map((t) =>
            t.id === selectedTool.id
              ? {
                  ...t,
                  affiliate_url: affiliateUrlInput,
                  affiliate_status: affiliateUrlInput ? "ACTIVE" : "NO_LINK",
                  affiliate_network: networkInput,
                }
              : t
          )
        );
        setSelectedTool(null);
      }
    } catch {
      // Fallback handle
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-black text-white font-serif">Directory Tools Index</h2>
        <input
          type="text"
          placeholder="Search tools by name, slug, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-white text-xs px-4 py-2.5 rounded-xl w-full sm:w-80 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-4">Tool Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Status</th>
              <th className="p-4">Network</th>
              <th className="p-4 text-center">Clicks</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredTools.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/30 transition">
                <td className="p-4 font-bold text-white">
                  {t.name}
                  <span className="block text-[10px] text-slate-500 font-mono">/tool/{t.slug}</span>
                </td>
                <td className="p-4 text-slate-400">{t.category}</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      t.affiliate_status === "ACTIVE"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {t.affiliate_status}
                  </span>
                </td>
                <td className="p-4">{t.affiliate_network}</td>
                <td className="p-4 text-center font-bold text-white">{t.clicks}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleOpenConfigure(t)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition"
                  >
                    {t.affiliate_url ? "EDIT" : "CONFIGURE"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Configure Modal */}
      {selectedTool && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-lg w-full space-y-6 shadow-2xl">
            <h3 className="text-lg font-black text-white font-serif">Configure Affiliate for {selectedTool.name}</h3>

            <form onSubmit={handleSaveAffiliate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Approved Affiliate URL</label>
                <input
                  type="url"
                  placeholder="https://partner.com/link?aff=real_id"
                  value={affiliateUrlInput}
                  onChange={(e) => setAffiliateUrlInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Affiliate Network</label>
                <select
                  value={networkInput}
                  onChange={(e) => setNetworkInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="Direct">Direct Program</option>
                  <option value="Impact">Impact Radius</option>
                  <option value="ShareASale">ShareASale</option>
                  <option value="PartnerStack">PartnerStack</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTool(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition"
                >
                  {loading ? "SAVING..." : "SAVE AFFILIATE LINK →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
