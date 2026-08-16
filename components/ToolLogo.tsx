// components/ToolLogo.tsx
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";

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

function extractDomain(url?: string | null, slug?: string | null, name?: string | null): string {
  if (url) {
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      return parsed.hostname.replace(/^www\./, "");
    } catch {}
  }
  if (slug) {
    const cleanSlug = slug.replace(/-ai$|-app$|-io$|-bot$/i, "");
    return `${cleanSlug}.com`;
  }
  if (name) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return `${cleanName}.com`;
  }
  return "";
}

export default function ToolLogo({
  src,
  name,
  website,
  slug,
  size = "md",
  className = "",
}: ToolLogoProps) {
  const domain = useMemo(() => extractDomain(website, slug, name), [website, slug, name]);

  // Priority queue of real logo providers
  const candidateUrls = useMemo(() => {
    const list: string[] = [];

    // 1. Database original logo URL
    if (src && src.trim() && !src.includes("placeholder") && !src.startsWith("data:")) {
      list.push(src.trim());
    }

    if (domain) {
      // 2. Google High-Resolution Favicon CDN (128px)
      list.push(`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAV&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`);

      // 3. Clearbit Logo Engine
      list.push(`https://logo.clearbit.com/${domain}`);

      // 4. Google Standard Favicon API
      list.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);

      // 5. DuckDuckGo High-Res Icon
      list.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
    }

    return list;
  }, [src, domain]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(candidateUrls.length === 0);

  const initials = useMemo(() => {
    const words = (name || "AI").trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return (name || "AI").slice(0, 2).toUpperCase();
  }, [name]);

  const currentUrl = candidateUrls[candidateIndex];

  const handleImageError = () => {
    if (candidateIndex < candidateUrls.length - 1) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setHasFailedAll(true);
    }
  };

  const dimensionClass = SIZE_MAP[size] || SIZE_MAP.md;
  const pixelSize = PIXEL_MAP[size] || 44;

  if (hasFailedAll || !currentUrl) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 font-black text-white shadow-sm ring-1 ring-black/5 select-none ${dimensionClass} ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm transition-transform group-hover:scale-105 ${dimensionClass} ${className}`}
    >
      <img
        src={currentUrl}
        alt={`${name} logo`}
        width={pixelSize}
        height={pixelSize}
        onError={handleImageError}
        className="h-full w-full object-contain rounded-xl"
        loading="lazy"
      />
    </div>
  );
}
