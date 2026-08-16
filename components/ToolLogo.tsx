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
  md: "h-11 w-11 text-sm font-black",
  lg: "h-14 w-14 text-base font-black",
  xl: "h-16 w-16 text-lg font-black",
};

const PIXEL_MAP = {
  sm: 32,
  md: 44,
  lg: 56,
  xl: 64,
};

// Rich Tech Gradients matching modern SaaS platforms
const GRADIENTS = [
  "from-blue-600 via-indigo-600 to-violet-700",
  "from-violet-600 via-purple-600 to-fuchsia-700",
  "from-emerald-500 via-teal-600 to-cyan-700",
  "from-cyan-500 via-blue-600 to-indigo-700",
  "from-amber-500 via-orange-600 to-red-600",
  "from-fuchsia-600 via-pink-600 to-rose-600",
  "from-slate-800 via-slate-900 to-black",
];

function extractCleanDomain(website?: string | null): string {
  if (!website || typeof website !== "string") return "";
  try {
    const raw = website.trim();
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

export default function ToolLogo({
  src,
  name,
  website,
  slug,
  size = "md",
  className = "",
}: ToolLogoProps) {
  const cleanName = (name || "AI Tool").trim();
  const domain = useMemo(() => extractCleanDomain(website), [website]);

  // Generate crisp 2-letter uppercase initials
  const initials = useMemo(() => {
    const sanitized = cleanName.replace(/[^a-zA-Z0-9\s]/g, "");
    const parts = sanitized.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (sanitized.slice(0, 2) || "AI").toUpperCase();
  }, [cleanName]);

  // Distinct gradient for every tool
  const gradientClass = useMemo(() => {
    const hash = cleanName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return GRADIENTS[hash % GRADIENTS.length];
  }, [cleanName]);

  // Priority Candidates (Only use reliable direct logo endpoints)
  const candidateUrls = useMemo(() => {
    const list: string[] = [];

    // 1. Database original uploaded logo
    if (src && typeof src === "string" && src.trim().startsWith("http") && !src.includes("placeholder")) {
      list.push(src.trim());
    }

    // 2. Clearbit & DuckDuckGo (they fail fast instead of returning fake grey globe)
    if (domain) {
      list.push(`https://logo.clearbit.com/${domain}`);
      list.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
    }

    return list;
  }, [src, domain]);

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

  const dimensionClass = SIZE_MAP[size] || SIZE_MAP.md;
  const pixelSize = PIXEL_MAP[size] || 44;

  // Render Crisp Gradient Badge if image not found or failed
  if (loadFailed || !candidateUrls[currentIndex]) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientClass} text-white shadow-md ring-1 ring-white/20 select-none tracking-tight font-black transition-transform group-hover:scale-105 ${dimensionClass} ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-sm transition-transform group-hover:scale-105 ${dimensionClass} ${className}`}
    >
      <img
        src={candidateUrls[currentIndex]}
        alt={`${cleanName} logo`}
        width={pixelSize}
        height={pixelSize}
        onError={handleImgError}
        className="h-full w-full object-contain rounded-xl"
        loading="lazy"
      />
    </div>
  );
}
