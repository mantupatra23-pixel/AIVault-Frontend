"use client";

import { useState } from "react";

interface ToolOption {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  affiliate_status: string;
}

export function AdminConnectActionForm({ tools }: { tools: ToolOption[] }) {
  const [selectedToolId, setSelectedToolId] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [networkName, setNetworkName] = useState("Direct Program");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToolId || !affiliateUrl) {
      setMessage({ type: "error", text: "Please select a tool and enter an approved affiliate URL." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/affiliate/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: selectedToolId,
          affiliateUrl,
          networkName,
          action: "CONNECT",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update affiliate connection");
      }

      setMessage({ type: "success", text: "Tool affiliate URL connected and status set to ACTIVE!" });
      setAffiliateUrl("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission error";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {message && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-1">
        <label className="font-bold text-slate-300">Select Directory Tool</label>
        <select
          value={selectedToolId}
          onChange={(e) => setSelectedToolId(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500"
        >
          <option value="">-- Choose Tool --</option>
          {tools.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.slug}) — Status: {t.affiliate_status}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="font-bold text-slate-300">Approved Affiliate URL</label>
        <input
          type="url"
          placeholder="https://partner.com/link?aff=real_id"
          value={affiliateUrl}
          onChange={(e) => setAffiliateUrl(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500 font-mono"
        />
      </div>

      <div className="space-y-1">
        <label className="font-bold text-slate-300">Affiliate Network / Partner Program</label>
        <input
          type="text"
          placeholder="Impact, ShareASale, CJ, or Direct"
          value={networkName}
          onChange={(e) => setNetworkName(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
      >
        {loading ? "ACTIVATING..." : "SAVE & ACTIVATE AFFILIATE LINK →"}
      </button>
    </form>
  );
}
