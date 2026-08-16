// components/ToolLogo.tsx
"use client";

import { useState, useMemo } from "react";

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

// Vibrant gradient palette for tech badges
const GRADIENTS = [
  "from-blue-600 to-indigo-700",
  "from-violet-600 to-purple-800",
  "from-cyan-600 to-blue-700",
  "from-emerald-600 to-teal-800",
  "from-fuchsia-600 to-pink-700",
  "from-indigo-600 to-slate-900",
];

function extractCleanDomain(website?: string | null, slug?: string | null, name?: string | null): string {
  if (website && typeof website === "string" && website.trim() !== "") {
    try {
      const url = website.trim().startsWith("http") ? website.trim() : `https://${website.trim()}`;
      const hostname = new URL(url).hostname.replace(/^www\./, "");
      if (hostname && !hostname.includes("example") && hostname.includes(".")) {
        return hostname;
      }
    } catch {}
  }

  const base = (slug || name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/ai$|app$|io$|bot$/g, "");

  return base ? `${base}.com` : "";
}

export default function ToolLogo({
  src,
  name,
  website,
  slug,
  size = "md",
  className = "",
}: ToolLogoProps) {
  const domain = useMemo(() => extractCleanDomain(website, slug, name), [website, slug, name]);

  const candidateUrls = useMemo(() => {
    const urls: string[] = [];

    // 1. Direct database logo
    if (src && typeof src === "string" && src.trim() && !src.includes("placeholder") && !src.startsWith("data:")) {
      urls.push(src.trim());
    }

    if (domain) {
      // 2. Unavatar (Aggregates Clearbit + Devicon + DuckDuckGo + Favicon)
      urls.push(`https://unavatar.io/${domain}?fallback=false`);
      
      // 3. Clearbit Logo Engine
      urls.push(`https://logo.clearbit.com/${domain}`);
      
      // 4. DuckDuckGo High-Res ICO
      urls.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
    }

    return urls;
  }, [src, domain]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFailed, setIsFailed] = useState(candidateUrls.length === 0);

  const initials = useMemo(() => {
    const clean = (name || "AI").trim().replace(/[^a-zA-Z0-9\s]/g, "");
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (clean.slice(0, 2) || "AI").toUpperCase();
  }, [name]);

  // Stable gradient index based on name char codes
  const gradientClass = useMemo(() => {
    const code = (name || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return GRADIENTS[code % GRADIENTS.length];
  }, [name]);

  const handleError = () => {
    if (currentIndex < candidateUrls.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFailed(true);
    }
  };

  const dimensionClass = SIZE_MAP[size] || SIZE_MAP.md;

  if (isFailed || !candidateUrls[currentIndex]) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientClass} font-black text-white shadow-sm ring-1 ring-black/5 select-none ${dimensionClass} ${className}`}
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
        src={candidateUrls[currentIndex]}
        alt={`${name} brand logo`}
        onError={handleError}
        className="h-full w-full object-contain rounded-xl"
        loading="lazy"
      />
    </div>
  );
}
