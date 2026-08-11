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
  confidence: number;
  status: string;
}

export function DiscoveryQueueTable({ onScanComplete }: { onScanComplete?: () => void }) {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "info" | "success" | "error"; text: string } | null>(null);
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
      // Non-blocking background fetch
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleRunScan = async () => {
    if (isDiscovering) return; // Duplicate click protection

    setIsDiscovering(true);
    setFeedback({
      type: "info",
      text: "AUTO DISCOVERING... Initiating multi-stage affiliate discovery scan...",
    });

    try {
      let offset = 0;
      const batchSize = 100;
      let hasMore = true;
      let totalScanned = 0;
      let totalDiscovered = 0;
      let totalNoProgram = 0;
      let modeText = "PUBLIC DISCOVERY MODE";
      let requestCount = 0;
      const maxBatchRequests = 20;

      while (hasMore && requestCount < maxBatchRequests) {
        requestCount++;
        const currentStart = offset + 1;
        const currentEnd = offset + batchSize;

        setFeedback({
          type: "info",
          text: `[${modeText}] — Scanning tools ${currentStart}–${currentEnd}...`,
        });

        let attempts = 0;
        let batchSuccess = false;
        let data: any = null;

        // Up to 2 retries for transient batch network failures
        while (attempts < 2 && !batchSuccess) {
          attempts++;
          try {
            const res = await fetch("/api/admin/affiliates/discover", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ batchSize, offset }),
            });

            if (res.ok) {
              data = await res.json();
              batchSuccess = true;
            } else {
              if (attempts < 2) await new Promise((r) => setTimeout(r, 1000));
            }
          } catch {
            if (attempts < 2) await new Promise((r) => setTimeout(r, 1000));
          }
        }

        if (!batchSuccess || !data) {
          setFeedback({
            type: "error",
            text: `Affiliate discovery failed at tools ${currentStart}–${currentEnd}. Scan stopped safely.`,
          });
          return;
        }

        if (data.mode) {
          modeText = data.mode.toUpperCase();
        }

        const scannedInBatch = data.scanned || 0;
        totalScanned += scannedInBatch;
        totalDiscovered += data.candidatesFound || 0;
        totalNoProgram += data.noProgramFound || 0;

        if (Boolean(data.hasMore) && scannedInBatch === 0) {
          hasMore = false;
        } else {
          hasMore = Boolean(data.hasMore);
        }

        offset += data.batchSize || batchSize;
      }

      setFeedback({
        type: "success",
        text: `DISCOVERY COMPLETE — Scanned ${totalScanned} tools. Found ${totalDiscovered} verified affiliate candidates. ${totalNoProgram} tools have no verified affiliate program.`,
      });

      await fetchCandidates();
      if (onScanComplete) {
        onScanComplete();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network connection error";
      setFeedback({
        type: "error",
        text: `Affiliate discovery failed: ${msg}`,
      });
    } finally {
      setIsDiscovering(false); // Release button state
    }
  };

  const handleCandidateAction = async (candidateId: string, action: "APPROVE" | "REJECT", customUrl?: string) => {
    if (actionLoading) return;
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
        await fetchCandidates();
        if (onScanComplete) {
          onScanComplete();
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            Pending Opportunities Queue ({candidates.length})
          </span>
          <h2 className="text-xl font-black text-white font-serif mt-1">
            Affiliate Discovery & Candidates
          </h2>
        </div>

        <button
          onClick={handleRunScan}
          disabled={isDiscovering}
          className="px-6 py-3 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50 active:scale-98"
        >
          {isDiscovering ? "AUTO DISCOVERING..." : "AUTO DISCOVER AFFILIATES 🔍"}
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold font-mono ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : feedback.type === "error"
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
          }`}
        >
          {feedback.text}
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
                      className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition shadow-sm disabled:opacity-50"
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
                      className="px-3 py-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition disabled:opacity-50"
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
          No pending affiliate candidates in queue. Click &quot;AUTO DISCOVER AFFILIATES&quot; to scan for merchant programs.
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
                <label className="text-xs font-bold text-slate-300">Verified Affiliate Destination URL</label>
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
                  className="px-5 py-2.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition disabled:opacity-50"
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
