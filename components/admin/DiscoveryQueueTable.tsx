"use client";

import { useState, useEffect } from "react";

export interface CandidateRow {
  id: string;
  tool_id: string;
  tool_name: string;
  tool_slug: string;
  official_url: string | null;
  network: string;
  program_name: string | null;
  candidate_url: string;
  evidence_url: string | null;
  commission_rate: string | null;
  cookie_duration_days: number;
  confidence: number;
  status: string;
}

export function DiscoveryQueueTable() {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<CandidateRow | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCandidates = async () => {
    try {
      const res = await fetch("/api/admin/affiliates/candidates");
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleRunScan = async () => {
    setScanning(true);
    setProgressMsg("Scanning directory tools... Step 1/5: Querying database index...");

    try {
      setTimeout(() => setProgressMsg("Scanning directory tools... Step 3/5: Checking active network credentials..."), 800);

      const res = await fetch("/api/admin/affiliates/discover", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setProgressMsg(`✓ ${data.message}`);
        fetchCandidates();
      } else {
        setProgressMsg(`Discovery error: ${data.error || "Failed to execute scan"}`);
      }
    } catch {
      setProgressMsg("Discovery API connection error.");
    } finally {
      setScanning(false);
    }
  };

  const handleCandidateAction = async (candidateId: string, action: "APPROVE" | "REJECT", customUrl?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/affiliates/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, action, customUrl }),
      });

      if (res.ok) {
        setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
        setEditingCandidate(null);
      }
    } catch {
      // Non-blocking
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            Affiliate Discovery Queue ({candidates.length})
          </span>
          <h2 className="text-xl font-black text-white font-serif mt-1">
            Pending Opportunities Queue
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunScan}
            disabled={scanning}
            className="px-5 py-2.5 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {scanning ? "DISCOVERING..." : "AUTO DISCOVER AFFILIATES 🔍"}
          </button>
        </div>
      </div>

      {progressMsg && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-300 font-mono">
          {progressMsg}
        </div>
      )}

      {candidates.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Tool</th>
                <th className="p-4">Network / Program</th>
                <th className="p-4">Candidate URL</th>
                <th className="p-4 text-center">Confidence</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {candidates.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4 font-bold text-white">
                    {c.tool_name}
                    <span className="block text-[10px] text-slate-500 font-mono">/tool/{c.tool_slug}</span>
                  </td>
                  <td className="p-4">
                    <div className="text-white font-bold">{c.network}</div>
                    <div className="text-[10px] text-slate-400">{c.program_name || "Merchant Program"}</div>
                  </td>
                  <td className="p-4 font-mono text-[11px] text-blue-400 truncate max-w-xs">
                    {c.candidate_url}
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400">
                      {c.confidence}%
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleCandidateAction(c.id, "APPROVE")}
                      disabled={actionLoading}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition"
                    >
                      APPROVE
                    </button>
                    <button
                      onClick={() => {
                        setEditingCandidate(c);
                        setCustomUrlInput(c.candidate_url);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleCandidateAction(c.id, "REJECT")}
                      disabled={actionLoading}
                      className="px-3 py-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition"
                    >
                      REJECT
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-slate-500 italic border border-dashed border-slate-800 rounded-2xl">
          No pending affiliate candidates in queue. Click &quot;AUTO DISCOVER AFFILIATES&quot; to scan unmonetized tools.
        </div>
      )}

      {/* Edit Candidate Modal */}
      {editingCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-lg w-full space-y-6 shadow-2xl">
            <h3 className="text-lg font-black text-white font-serif">
              Edit & Approve Candidate for {editingCandidate.tool_name}
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Verified Affiliate URL</label>
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCandidate(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={() => handleCandidateAction(editingCandidate.id, "APPROVE", customUrlInput)}
                  disabled={actionLoading}
                  className="px-5 py-2.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition"
                >
                  APPROVE & ACTIVATE →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
