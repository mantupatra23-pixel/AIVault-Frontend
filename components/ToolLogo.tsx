// components/ToolLogo.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";

export type ToolLogoProps = {
  src?: string | null;
  logoUrl?: string | null;
  name: string;
  website?: string | null;
  websiteUrl?: string | null;
  slug?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | number;
  className?: string;
};

const SIZE_MAP: Record<string, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm font-bold",
  lg: "h-14 w-14 text-base font-bold",
  xl: "h-16 w-16 text-lg font-bold",
};

const PIXEL_MAP: Record<string, number> = {
  sm: 32,
  md: 44,
  lg: 56,
  xl: 64,
};

function extractCleanDomain(urlInput?: string | null): string {
  if (!urlInput || typeof urlInput !== "string") return "";
  try {
    const raw = urlInput.trim();
    const url = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (
      hostname.includes(".") &&
      !hostname.includes("example") &&
      !hostname.includes("localhost") &&
      !hostname.includes("vercel.app")
    ) {
      return hostname;
    }
  } catch {}
  return "";
}

export function ToolLogo({
  src,
  logoUrl,
  name,
  website,
  websiteUrl,
  size = "md",
  className = "",
}: ToolLogoProps) {
  const cleanName = (name || "AI Tool").trim();
  const directLogo = src || logoUrl;
  const targetWebsite = website || websiteUrl;
  const domain = useMemo(() => extractCleanDomain(targetWebsite), [targetWebsite]);

  // Clean 2-letter uppercase initials badge
  const initials = useMemo(() => {
    const sanitized = cleanName.replace(/[^a-zA-Z0-9\s]/g, "");
    const parts = sanitized.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (sanitized.slice(0, 2) || "AI").toUpperCase();
  }, [cleanName]);

  // Priority Pipeline (Fails fast on missing logos to trigger Neon Badge)
  const candidateUrls = useMemo(() => {
    const list: string[] = [];

    // 1. Direct DB logo
    if (
      directLogo &&
      typeof directLogo === "string" &&
      directLogo.trim().startsWith("http") &&
      !directLogo.includes("placeholder") &&
      !directLogo.includes("default_icon")
    ) {
      list.push(directLogo.trim());
    }

    if (domain) {
      // 2. Clearbit direct company logo
      list.push(`https://logo.clearbit.com/${domain}`);
      // 3. DuckDuckGo high-res icon
      list.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
      // 4. Google Favicon (with default_icon=none so missing logos fail fast to neon badge)
      list.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128&default_icon=none`);
    }

    return list;
  }, [directLogo, domain]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadFailed, setLoadFailed] = useState(candidateUrls.length === 0);

  useEffect(() => {
    setCurrentIndex(0);
    setLoadFailed(candidateUrls.length === 0);
  }, [candidateUrls]);

  const handleImgError = () => {
    if (currentIndex < candidateUrls.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setLoadFailed(true);
    }
  };

  const isNumericSize = typeof size === "number";
  const dimensionClass = !isNumericSize ? (SIZE_MAP[size as string] || SIZE_MAP.md) : "";
  const pixelSize = isNumericSize ? size : (PIXEL_MAP[size as string] || 44);

  // Modern Neon Green & Deep Black Initial Badge
  if (loadFailed || !candidateUrls[currentIndex]) {
    return (
      <div
        style={isNumericSize ? { width: size, height: size } : undefined}
        className={`flex shrink-0 items-center justify-center rounded-xl bg-[#0d1117] border border-[#00FF66]/40 text-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.2)] select-none tracking-tight font-extrabold transition-transform group-hover:scale-105 ${dimensionClass} ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      style={isNumericSize ? { width: size, height: size } : undefined}
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-800 bg-[#0d0d0d] p-1.5 shadow-sm transition-transform group-hover:scale-105 ${dimensionClass} ${className}`}
    >
      <img
        src={candidateUrls[currentIndex]}
        alt={`${cleanName} logo`}
        width={pixelSize}
        height={pixelSize}
        onError={handleImgError}
        className="h-full w-full object-contain rounded-lg"
        loading="lazy"
      />
    </div>
  );
}

export default ToolLogo;
