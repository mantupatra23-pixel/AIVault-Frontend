// components/ToolLogo.tsx
"use client";

import { useState, useMemo, useEffect } from "react";

type ToolLogoProps = {
  src?: string | null;
  name: string;
  website?: string | null;
  slug?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZE_MAP = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-16 w-16 text-lg",
};

const PIXEL_MAP = {
  sm: 32,
  md: 44,
  lg: 56,
  xl: 64,
};

const BRAND_PALETTES = [
  "from-blue-600 to-indigo-700",
  "from-indigo-600 to-violet-800",
  "from-purple-600 to-pink-700",
  "from-cyan-600 to-blue-700",
  "from-emerald-600 to-teal-800",
  "from-amber-600 to-orange-700",
];

function getValidDomain(website?: string | null, slug?: string | null, name?: string | null): string {
  if (website && typeof website === "string" && website.trim() !== "") {
    try {
      const raw = website.trim();
      const url = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
      const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
      if (hostname.includes(".") && !hostname.includes("example") && !hostname.includes("localhost")) {
        return hostname;
      }
    } catch {}
  }

  const clean = (slug || name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");

  if (!clean) return "";

  // Common AI tool domain extensions
  return `${clean}.com`;
}

export default function ToolLogo({
  src,
  name,
  website,
  slug,
  size = "md",
  className = "",
}: ToolLogoProps) {
  const domain = useMemo(() => getValidDomain(website, slug, name), [website, slug, name]);

  const candidateUrls = useMemo(() => {
    const urls: string[] = [];

    // 1. Direct DB stored image
    if (src && typeof src === "string" && src.trim().startsWith("http") && !src.includes("placeholder")) {
      urls.push(src.trim());
    }

    if (domain) {
      // 2. Google High-Resolution v2 CDN (Direct 128px png)
      urls.push(`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAV&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`);

      // 3. Clearbit Logo Engine
      urls.push(`https://logo.clearbit.com/${domain}`);

      // 4. DuckDuckGo Icon CDN
      urls.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);

      // 5. Microlink Logo API
      urls.push(`https://api.microlink.io?url=https://${domain}&screenshot=false&meta=false&embed=logo.url`);
    }

    return urls;
  }, [src, domain]);

  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setIndex(0);
    setFailed(candidateUrls.length === 0);
  }, [candidateUrls]);

  const initials = useMemo(() => {
    const clean = (name || "AI").trim().replace(/[^a-zA-Z0-9\s]/g, "");
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (clean.slice(0, 2) || "AI").toUpperCase();
  }, [name]);

  const bgGradient = useMemo(() => {
    const hash = (name || "AI").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return BRAND_PALETTES[hash % BRAND_PALETTES.length];
  }, [name]);

  const handleNextCandidate = () => {
    if (index < candidateUrls.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      setFailed(true);
    }
  };

  const dimensionClass = SIZE_MAP[size] || SIZE_MAP.md;
  const pixelSize = PIXEL_MAP[size] || 44;

  if (failed || !candidateUrls[index]) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${bgGradient} font-black text-white shadow-sm select-none tracking-tight ${dimensionClass} ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-sm transition-all duration-200 group-hover:scale-105 ${dimensionClass} ${className}`}
    >
      <img
        src={candidateUrls[index]}
        alt={`${name} logo`}
        width={pixelSize}
        height={pixelSize}
        onError={handleNextCandidate}
        className="h-full w-full object-contain rounded-xl"
        loading="lazy"
      />
    </div>
  );
}
