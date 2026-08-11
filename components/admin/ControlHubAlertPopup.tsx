"use client";

import { useState } from "react";
import Link from "next/link";

export function ControlHubAlertPopup({ missingCount }: { missingCount: number }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || missingCount === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 border border-amber-500/30 text-white p-6 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
            Affiliate Attention Required
          </span>
          <h3 className="text-base font-bold text-white font-serif mt-2">
            {missingCount} tools have no active affiliate link
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Configure approved affiliate URLs to monetize outbound traffic.
          </p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-slate-400 hover:text-white font-bold">
          ✕
        </button>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
        <button onClick={() => setDismissed(true)} className="text-xs font-bold text-slate-400 hover:text-white">
          DISMISS
        </button>
        <Link
          href="/admin/affiliates/missing"
          className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition"
        >
          CONFIGURE NOW →
        </Link>
      </div>
    </div>
  );
}
