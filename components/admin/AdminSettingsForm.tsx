"use client";

import { useState } from "react";

interface NetworkSetting {
  id: string;
  network_name: string;
  publisher_id: string | null;
  tracking_default: string | null;
  is_enabled: boolean;
}

export function AdminSettingsForm({ initialSettings }: { initialSettings: NetworkSetting[] }) {
  const [networkName, setNetworkName] = useState("Impact");
  const [publisherId, setPublisherId] = useState("");
  const [trackingDefault, setTrackingDefault] = useState("aivault");
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/admin/affiliates/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network_name: networkName,
          publisher_id: publisherId,
          tracking_default: trackingDefault,
          is_enabled: isEnabled,
        }),
      });

      if (!res.ok) throw new Error("Failed to save credentials");

      setMsg({ type: "success", text: `✓ Configured credentials for ${networkName}` });
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : "Error saving settings";
      setMsg({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
      {msg && (
        <div className={`p-4 rounded-xl text-xs font-bold ${msg.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="font-bold text-slate-300">Affiliate Network</label>
          <select
            value={networkName}
            onChange={(e) => setNetworkName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-blue-500"
          >
            <option value="Impact">Impact Radius</option>
            <option value="ShareASale">ShareASale</option>
            <option value="PartnerStack">PartnerStack</option>
            <option value="CJ Affiliate">CJ Affiliate</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-slate-300">Publisher Account ID / API Token</label>
          <input
            type="text"
            placeholder="e.g. PUB-12345"
            value={publisherId}
            onChange={(e) => setPublisherId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-slate-300">Default SubID / Tracking Parameter</label>
          <input
            type="text"
            value={trackingDefault}
            onChange={(e) => setTrackingDefault(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="is_enabled"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
            className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
          />
          <label htmlFor="is_enabled" className="font-bold text-slate-300">
            Enable Credentials for Automatic Discovery Scan
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          {loading ? "SAVING..." : "SAVE NETWORK CREDENTIALS →"}
        </button>
      </form>

      {initialSettings.length > 0 && (
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <h3 className="font-bold text-sm text-white">Configured Networks</h3>
          <div className="divide-y divide-slate-800">
            {initialSettings.map((s) => (
              <div key={s.id} className="py-2 flex justify-between items-center">
                <span className="font-bold text-slate-200">{s.network_name}</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                  {s.publisher_id ? `ID: ${s.publisher_id}` : "No ID"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
