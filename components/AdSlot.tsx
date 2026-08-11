"use client";

import { useEffect } from "react";

interface AdSlotProps {
  slotId?: string;
  format?: "auto" | "fluid" | "rectangle";
  className?: string;
}

export function AdSlot({ slotId = "default-slot", format = "auto", className = "" }: AdSlotProps) {
  const pubClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (pubClient && typeof window !== "undefined") {
      try {
        ((window as unknown as Record<string, unknown[]>).adsbygoogle =
          (window as unknown as Record<string, unknown[]>).adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense execution error:", e);
      }
    }
  }, [pubClient]);

  if (!pubClient) {
    return null; // Do not render empty ad blocks if publisher ID is missing
  }

  return (
    <div className={`my-6 text-center overflow-hidden border border-slate-100/60 rounded-2xl p-2 bg-slate-50/50 ${className}`}>
      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
        Sponsored Advertisement
      </span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={pubClient}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
