"use client";

import { useState, useEffect } from "react";

interface CandidateOpportunity {
  id: string;
  tool_id: string;
  tool_name: string;
  network: string;
  program_name: string | null;
  candidate_url: string;
  confidence: number;
}

export function AffiliateOpportunityPopup({ onActionComplete }: { onScanComplete?: () => void; onActionComplete?: () => void }) {
  const [opportunity, setOpportunity] = useState<CandidateOpportunity | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUnreadOpportunity = async () => {
    try {
      const res = await fetch("/api/admin/affiliates/candidates");
      if (res.ok) {
        const data = await res.json();
        if (data.candidates && data.candidates.length > 0) {
          setOpportunity(data.candidates[0]);
        } else {
          setOpportunity(null);
        }
      }
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchUnreadOpportunity();
  }, []);

  if (!opportunity) return null;

  const handleAction = async (action: "APPROVE" | "REJECT") => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/affiliates/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: opportunity.id, action }),
      });

      if (res.ok) {
        setOpportunity(null);
        if (onActionComplete) onActionComplete();
        fetchUnreadOpportunity();
      }
    } catch {
      setOpportunity(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 border border-emerald-500/30 text-white p-6 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-5 font-sans">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            Affiliate Opportunity Found ({opportunity.confidence}% Confidence)
          </span>
          <h3 className="text-base font-bold text-white font-serif mt-2">
            Tool: {opportunity.tool_name}
          </h3>
          <p className="text-xs text-slate-300">
            Network: <strong className="text-white">{opportunity.network}</strong> — {opportunity.program_name || "Partner Program"}
          </p>
          <div className="text-[11px] font-mono text-blue-400 truncate max-w-xs pt-1">
            {opportunity.candidate_url}
          </div>
        </div>
        <button onClick={() => setOpportunity(null)} className="text-slate-400 hover:text-white font-bold">
          ✕
        </button>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-end gap-3 text-xs">
        <button
          onClick={() => handleAction("REJECT")}
          disabled={loading}
          className="px-4 py-2 font-bold text-rose-400 hover:text-rose-300 transition"
        >
          REJECT
        </button>
        <button
          onClick={() => handleAction("APPROVE")}
          disabled={loading}
          className="px-4 py-2 font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
        >
          {loading ? "ACTIVATING..." : "APPROVE & ACTIVATE →"}
        </button>
      </div>
    </div>
  );
}
