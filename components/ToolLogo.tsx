"use client";

import React, { useEffect, useMemo, useState } from "react";

type ToolLogoProps = {
  src?: string | null;
  fallbackSrc?: string | null;
  websiteUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClasses: Record<NonNullable<ToolLogoProps["size"]>, string> = {
  sm: "h-10 w-10 rounded-xl text-sm",
  md: "h-16 w-16 rounded-2xl text-lg",
  lg: "h-20 w-20 rounded-2xl text-2xl",
  xl: "h-24 w-24 rounded-2xl text-3xl",
};

function normalizeUrl(value?: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();

  if (!trimmed) return null;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("//")
  ) {
    return trimmed.startsWith("//")
      ? `https:${trimmed}`
      : trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function getHostname(value?: string | null): string | null {
  if (!value) return null;

  try {
    const normalized = normalizeUrl(value);

    if (!normalized || normalized.startsWith("/")) {
      return null;
    }

    const url = new URL(normalized);

    return url.hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
}

function buildLogoCandidates(
  src?: string | null,
  fallbackSrc?: string | null,
  websiteUrl?: string | null
): string[] {
  const candidates: string[] = [];

  const primary = normalizeUrl(src);
  const fallback = normalizeUrl(fallbackSrc);
  const hostname = getHostname(websiteUrl);

  if (primary) {
    candidates.push(primary);
  }

  if (fallback && !candidates.includes(fallback)) {
    candidates.push(fallback);
  }

  if (hostname) {
    // Official website favicon
    candidates.push(`https://${hostname}/favicon.ico`);

    // Google favicon resolver as a second automatic fallback.
    candidates.push(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
        hostname
      )}&sz=128`
    );
  }

  return [...new Set(candidates)];
}

function getInitials(name: string): string {
  const cleanName = name.trim();

  if (!cleanName) {
    return "AI";
  }

  const words = cleanName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  const initials = words
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials || "AI";
}

export const ToolLogo: React.FC<ToolLogoProps> = ({
  src,
  fallbackSrc,
  websiteUrl,
  name,
  size = "md",
  className = "",
}) => {
  const [candidateIndex, setCandidateIndex] = useState(0);

  const candidates = useMemo(
    () => buildLogoCandidates(src, fallbackSrc, websiteUrl),
    [src, fallbackSrc, websiteUrl]
  );

  useEffect(() => {
    setCandidateIndex(0);
  }, [src, fallbackSrc, websiteUrl]);

  const currentImage = candidates[candidateIndex] ?? null;
  const initials = getInitials(name);

  const baseClasses = sizeClasses[size];

  const fallbackLogo = (
    <div
      className={`${baseClasses} flex shrink-0 items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 font-bold text-white shadow-sm ${className}`}
      aria-label={`${name} logo`}
      title={name}
    >
      {initials}
    </div>
  );

  if (!currentImage) {
    return fallbackLogo;
  }

  return (
    <div
      className={`${baseClasses} flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white shadow-sm ${className}`}
      aria-label={`${name} logo`}
      title={name}
    >
      <img
        key={currentImage}
        src={currentImage}
        alt={`${name} logo`}
        className="h-full w-full object-contain p-2"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => {
          setCandidateIndex((current) => {
            if (current < candidates.length - 1) {
              return current + 1;
            }

            return candidates.length;
          });
        }}
      />
    </div>
  );
};

export default ToolLogo;
