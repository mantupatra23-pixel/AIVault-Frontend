"use client";

import React, { useEffect, useMemo, useState } from "react";

type ToolData = {
  id?: string | number | null;
  name?: string | null;
  slug?: string | null;

  logo_url?: string | null;
  logo?: string | null;
  image_url?: string | null;
  icon_url?: string | null;

  [key: string]: unknown;
};

type ToolLogoProps = {
  /*
   * New API
   */
  src?: string | null;
  fallbackSrc?: string | null;
  name?: string | null;

  /*
   * Backward-compatible API
   * Existing pages can still use:
   *
   * <ToolLogo tool={tool} />
   */
  tool?: ToolData | null;

  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClasses = {
  sm: "h-10 w-10 text-xs rounded-xl",
  md: "h-16 w-16 text-lg rounded-2xl",
  lg: "h-20 w-20 text-2xl rounded-2xl",
  xl: "h-24 w-24 text-3xl rounded-3xl",
};

function cleanUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const valueTrimmed = value.trim();

  if (!valueTrimmed) return null;

  return valueTrimmed;
}

export default function ToolLogo({
  src,
  fallbackSrc,
  name,
  tool,
  size = "md",
  className = "",
}: ToolLogoProps) {
  const [failed, setFailed] = useState(false);

  /*
   * Resolve name from either:
   *
   * 1. name prop
   * 2. tool.name
   */
  const resolvedName = useMemo(() => {
    return (
      cleanUrl(name) ||
      cleanUrl(tool?.name) ||
      "AI Tool"
    );
  }, [name, tool?.name]);

  /*
   * Build initials from tool name.
   *
   * Example:
   * Nylas CLI -> NC
   * ChatGPT -> C
   * Open AI -> OA
   */
  const initials = useMemo(() => {
    const words = resolvedName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) {
      return "AI";
    }

    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return words
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }, [resolvedName]);

  /*
   * Resolve logo from every supported database field.
   *
   * Priority:
   *
   * src
   * fallbackSrc
   * tool.logo_url
   * tool.logo
   * tool.image_url
   * tool.icon_url
   */
  const resolvedLogo = useMemo(() => {
    return (
      cleanUrl(src) ||
      cleanUrl(fallbackSrc) ||
      cleanUrl(tool?.logo_url) ||
      cleanUrl(tool?.logo) ||
      cleanUrl(tool?.image_url) ||
      cleanUrl(tool?.icon_url) ||
      null
    );
  }, [
    src,
    fallbackSrc,
    tool?.logo_url,
    tool?.logo,
    tool?.image_url,
    tool?.icon_url,
  ]);

  /*
   * Reset failed state whenever a different logo is supplied.
   */
  useEffect(() => {
    setFailed(false);
  }, [resolvedLogo]);

  const dimension = sizeClasses[size];

  /*
   * No valid image or image failed:
   * render beautiful initials fallback.
   */
  if (!resolvedLogo || failed) {
    return (
      <div
        className={`${dimension} ${className} flex shrink-0 items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 font-bold text-white shadow-sm`}
        aria-label={`${resolvedName} logo`}
        title={resolvedName}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`${dimension} ${className} flex shrink-0 items-center justify-center overflow-hidden border border-slate-100 bg-white shadow-sm`}
      aria-label={`${resolvedName} logo`}
      title={resolvedName}
    >
      <img
        src={resolvedLogo}
        alt={`${resolvedName} logo`}
        className="h-full w-full object-contain p-2"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => {
          setFailed(true);
        }}
      />
    </div>
  );
}
