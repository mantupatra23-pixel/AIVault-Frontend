// components/AdBanner.tsx
"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdBanner({
  slotId = "1234567890",
  format = "auto",
}: {
  slotId?: string;
  format?: string;
}) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense Error:", e);
    }
  }, []);

  return (
    <div className="my-6 flex w-full justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-2 text-center">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
