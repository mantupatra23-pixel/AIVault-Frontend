"use client";

import React, { useState, useMemo, useEffect } from "react";

export type ToolLogoProps = {
  src?: string | null;
  logoUrl?: string | null;
  logo_url?: string | null;
  logo?: string | null;
  name?: string | null;
  website?: string | null;
  websiteUrl?: string | null;
  website_url?: string | null;
  slug?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  className?: string;
};

const SIZE_MAP: Record<string, string> = {
  xs: "h-6 w-6 text-[9px] rounded-md",
  sm: "h-8 w-8 text-xs rounded-lg",
  md: "h-11 w-11 text-sm font-bold rounded-xl",
  lg: "h-16 w-16 text-xl font-bold rounded-2xl",
  xl: "h-20 w-20 text-2xl font-bold rounded-3xl",
};

const PIXEL_MAP: Record<string, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 80,
};

const DOMAIN_MAP: Record<string, string> = {
  deepseek: "deepseek.com",
  cursor: "cursor.com",
  claude: "anthropic.com",
  "claude-3-5-sonnet": "anthropic.com",
  lovable: "lovable.dev",
  "bolt-new": "bolt.new",
  midjourney: "midjourney.com",
  "flux-ai": "blackforestlabs.ai",
  perplexity: "perplexity.ai",
  elevenlabs: "elevenlabs.io",
  suno: "suno.com",
  runway: "runwayml.com",
  "kling-ai": "klingai.com",
  v0: "v0.dev",
  windsurf: "codeium.com",
  chatgpt: "openai.com",
  openai: "openai.com",
  groq: "groq.com",
  gemini: "google.com",
  "github-copilot": "github.com",
  huggingface: "huggingface.co",
};

function extractCleanDomain(
  websiteInput?: string | null,
  slugInput?: string | null,
  nameInput?: string | null
): string {
  if (slugInput) {
    const s = slugInput.toLowerCase().trim();
    if (DOMAIN_MAP[s]) return DOMAIN_MAP[s];
  }

  if (nameInput) {
    const n = nameInput.toLowerCase().replace(/[^a-z0-9-]/g, "").trim();
    if (DOMAIN_MAP[n]) return DOMAIN_MAP[n];
    if (n.includes("claude")) return "anthropic.com";
    if (n.includes("deepseek")) return "deepseek.com";
    if (n.includes("cursor")) return "cursor.com";
    if (n.includes("midjourney")) return "midjourney.com";
    if (n.includes("perplexity")) return "perplexity.ai";
    if (n.includes("elevenlabs")) return "elevenlabs.io";
    if (n.includes("suno")) return "suno.com";
    if (n.includes("runway")) return "runwayml.com";
    if (n.includes("lovable")) return "lovable.dev";
    if (n.includes("bolt")) return "bolt.new";
  }

  if (websiteInput && typeof websiteInput === "string") {
    try {
      const raw = websiteInput.trim();
      const formatted = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
      const host = new URL(formatted).hostname.replace(/^www\./, "").toLowerCase();
      if (
        host.includes(".") &&
        !host.includes("example.com") &&
        !host.includes("localhost") &&
        !host.includes("vercel.app")
      ) {
        return host;
      }
    } catch {}
  }

  return "";
}

export function ToolLogo({
  src,
  logoUrl,
  logo_url,
  logo,
  name = "AI Tool",
  website,
  websiteUrl,
  website_url,
  slug,
  size = "md",
  className = "",
}: ToolLogoProps) {
  const cleanName = String(name || "AI Tool").trim();
  const directLogo = src || logoUrl || logo_url || logo;
  const targetWebsite = website || websiteUrl || website_url;

  const domain = useMemo(
    () => extractCleanDomain(targetWebsite, slug, cleanName),
    [targetWebsite, slug, cleanName]
  );

  const initials = useMemo(() => {
    const sanitized = cleanName.replace(/[^a-zA-Z0-9\s]/g, "").trim();
    const parts = sanitized.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (sanitized.slice(0, 2) || "AI").toUpperCase();
  }, [cleanName]);

  const candidateUrls = useMemo(() => {
    const list: string[] = [];

    // 1. Direct DB Logo URL
    if (directLogo && typeof directLogo === "string" && directLogo.trim().startsWith("http")) {
      list.push(directLogo.trim());
    }

    // 2. High-Res Google S2 Favicon API
    if (domain) {
      list.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      list.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
      list.push(`https://logo.clearbit.com/${domain}`);
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

  if (loadFailed || !candidateUrls[currentIndex]) {
    return (
      <div
        style={isNumericSize ? { width: size, height: size } : undefined}
        className={`flex shrink-0 items-center justify-center bg-[#0a0f0d] border border-[#00FF66]/40 text-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.15)] select-none font-black tracking-tight ${dimensionClass} ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      style={isNumericSize ? { width: size, height: size } : undefined}
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-slate-200/90 bg-white p-1.5 shadow-sm ${dimensionClass} ${className}`}
    >
      <img
        src={candidateUrls[currentIndex]}
        alt={`${cleanName} logo`}
        width={pixelSize}
        height={pixelSize}
        onError={handleImgError}
        className="h-full w-full object-contain rounded-md"
        loading="lazy"
      />
    </div>
  );
}

export default ToolLogo;
