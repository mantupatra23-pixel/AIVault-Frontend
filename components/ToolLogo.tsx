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
  md: "h-11 w-11 text-sm font-black rounded-xl",
  lg: "h-16 w-16 text-xl font-black rounded-2xl",
  xl: "h-20 w-20 text-2xl font-black rounded-3xl",
};

const PIXEL_MAP: Record<string, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 80,
};

// Verified Authentic AI Domains Directory
const DOMAIN_MAP: Record<string, string> = {
  deepseek: "deepseek.com",
  cursor: "cursor.com",
  claude: "anthropic.com",
  "claude-3-5-sonnet": "anthropic.com",
  lovable: "lovable.dev",
  "bolt-new": "bolt.new",
  bolt: "bolt.new",
  midjourney: "midjourney.com",
  "flux-ai": "blackforestlabs.ai",
  flux: "blackforestlabs.ai",
  perplexity: "perplexity.ai",
  elevenlabs: "elevenlabs.io",
  suno: "suno.com",
  runway: "runwayml.com",
  "kling-ai": "klingai.com",
  kling: "klingai.com",
  v0: "v0.dev",
  windsurf: "codeium.com",
  chatgpt: "openai.com",
  openai: "openai.com",
  groq: "groq.com",
  gemini: "google.com",
  "github-copilot": "github.com",
  jasper: "jasper.ai",
  writesonic: "writesonic.com",
  "copy-ai": "copy.ai",
  leonardo: "leonardo.ai",
  udio: "udio.com",
  recraft: "recraft.ai",
  manus: "manus.im",
  reka: "reka.ai",
  meilisearch: "meilisearch.com",
  unsloth: "unsloth.ai",
  firecrawl: "firecrawl.dev",
  modelscope: "modelscope.cn",
  venice: "venice.ai",
  chutes: "chutes.ai",
  jan: "jan.ai",
  pollinations: "pollinations.ai",
  huggingface: "huggingface.co",
  anthropic: "anthropic.com",
  stability: "stability.ai",
  replicate: "replicate.com",
  fal: "fal.ai",
  mistral: "mistral.ai",
  cohere: "cohere.com",
};

// Dynamic Brand Gradient Palettes for Synthetic / Missing Logos
const BRAND_GRADIENTS = [
  { bg: "from-[#051a0e] via-[#082917] to-[#041209]", border: "border-[#00FF66]/50", text: "text-[#00FF66]", glow: "shadow-[0_0_12px_rgba(0,255,102,0.25)]" },
  { bg: "from-[#081528] via-[#0c2445] to-[#050f1d]", border: "border-[#38bdf8]/50", text: "text-[#38bdf8]", glow: "shadow-[0_0_12px_rgba(56,189,248,0.25)]" },
  { bg: "from-[#1a0826] via-[#2d0e42] to-[#12041b]", border: "border-[#c084fc]/50", text: "text-[#c084fc]", glow: "shadow-[0_0_12px_rgba(192,132,252,0.25)]" },
  { bg: "from-[#241404] via-[#3d2307] to-[#170c02]", border: "border-[#fbbf24]/50", text: "text-[#fbbf24]", glow: "shadow-[0_0_12px_rgba(251,191,36,0.25)]" },
  { bg: "from-[#220712] via-[#3d0d21] to-[#17040b]", border: "border-[#f43f5e]/50", text: "text-[#f43f5e]", glow: "shadow-[0_0_12px_rgba(244,63,94,0.25)]" },
];

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
        !host.includes("vercel.app") &&
        !host.includes("google.com")
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

  // Deterministic theme selection based on name
  const theme = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < cleanName.length; i++) {
      hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % BRAND_GRADIENTS.length;
    return BRAND_GRADIENTS[idx];
  }, [cleanName]);

  // Multi-tier Fallback with strict 404 validation (no grey globes)
  const candidateUrls = useMemo(() => {
    const list: string[] = [];

    // 1. Direct valid database image
    if (
      directLogo &&
      typeof directLogo === "string" &&
      directLogo.trim().startsWith("http") &&
      !directLogo.includes("placeholder")
    ) {
      list.push(directLogo.trim());
    }

    // 2. Strict Unavatar & Clearbit (Returns 404 instead of grey globe)
    if (domain) {
      list.push(`https://unavatar.io/${domain}?fallback=false`);
      list.push(`https://logo.clearbit.com/${domain}`);
      // Google S2 API without generic globe fallback
      list.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
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

  // High-End Cyberpunk Monogram Card (Replaces the ugly grey globe)
  if (loadFailed || !candidateUrls[currentIndex]) {
    return (
      <div
        style={isNumericSize ? { width: size, height: size } : undefined}
        className={`flex shrink-0 items-center justify-center bg-gradient-to-br ${theme.bg} border ${theme.border} ${theme.text} ${theme.glow} select-none font-black tracking-tight transition-transform group-hover:scale-105 ${dimensionClass} ${className}`}
      >
        <span>{initials}</span>
      </div>
    );
  }

  return (
    <div
      style={isNumericSize ? { width: size, height: size } : undefined}
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-slate-200/90 bg-white p-1 shadow-sm transition-transform group-hover:scale-105 ${dimensionClass} ${className}`}
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
