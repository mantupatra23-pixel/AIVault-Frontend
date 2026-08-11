"use client";

import { useEffect, useState } from "react";
import { AffiliateNotification } from "@/types/affiliate";

export function AffiliateNotificationModal() {
  const [activeNotification, setActiveNotification] = useState<AffiliateNotification | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUnreadNotifications = async () => {
    try {
      const res = await fetch("/api/admin/affiliate/notifications?unreadOnly=true");
      if (res.ok) {
        const data = await res.json();
        if (data.notifications && data.notifications.length > 0) {
          setActiveNotification(data.notifications[0]);
        }
      }
    } catch {
      // Non-blocking background fetch
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (!activeNotification) return null;

  const handleMarkAsRead = async () => {
    setLoading(true);
    try {
      await fetch(`/api/admin/affiliate/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeNotification.id }),
      });
      setActiveNotification(null);
    } catch {
      // Fallback dismiss
      setActiveNotification(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 text-white p-6 rounded-3xl shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30">
            {activeNotification.type.replace(/_/g, " ")}
          </span>
          <h3 className="text-base font-bold text-white font-serif">
            {activeNotification.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {activeNotification.message}
          </p>
        </div>
        <button
          onClick={handleMarkAsRead}
          className="text-slate-400 hover:text-white transition text-sm font-bold"
        >
          ✕
        </button>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-end gap-3 text-xs">
        <button
          onClick={handleMarkAsRead}
          disabled={loading}
          className="px-4 py-2 font-bold text-slate-400 hover:text-white transition"
        >
          DISMISS
        </button>
        <a
          href="/admin/affiliate"
          onClick={handleMarkAsRead}
          className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-md"
        >
          MANAGE IN CENTER →
        </a>
      </div>
    </div>
  );
}
