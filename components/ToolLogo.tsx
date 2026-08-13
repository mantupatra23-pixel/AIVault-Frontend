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
  websiteUrl?: string | null;
  website_url?: string | null;

  [key: string]: unknown;
};

export type ToolLogoProps = {
  /*
   * Modern direct props
   */
  src?: string | null;
  fallbackSrc?: string | null;
  name?: string | null;

  /*
   * Backward compatibility
   *
   * Existing code can continue using:
   *
   * <ToolLogo tool={tool} />
   */
  tool?: ToolData | null;

  /*
   * Some existing pages may already pass this.
   * It is intentionally accepted so TypeScript does not
   * break existing pages.
   */
  websiteUrl?: string | null;

  /*
   * Supported sizes
   */
  size?: "sm" | "md" | "lg" | "xl";

  /*
   * Optional custom classes
   */
  className?: string;
};

const SIZE_CLASSES: Record<
  NonNullable<ToolLogoProps["size"]>,
  string
> = {
  sm: "h-10 w-10 rounded-xl text-xs",
  md: "h-16 w-16 rounded-2xl text-lg",
  lg: "h-20 w-20 rounded-2xl text-2xl",
  xl: "h-24 w-24 rounded-3xl text-3xl",
};

function getString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  return cleaned.length > 0 ? cleaned : null;
}

function getInitials(name: string): string {
  const cleaned = name.trim();

  if (!cleaned) {
    return "AI";
  }

  const words = cleaned
    .split(/\s+/)
    .map((word) => word.trim())
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
    .join("")
    .toUpperCase();
}

export function ToolLogo({
  src,
  fallbackSrc,
  name,
  tool,
  websiteUrl: _websiteUrl,
  size = "md",
  className = "",
}: ToolLogoProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  /*
   * Resolve the tool name from all supported formats.
   */
  const resolvedName = useMemo(() => {
    return (
      getString(name) ||
      getString(tool?.name) ||
      "AI Tool"
    );
  }, [name, tool?.name]);

  /*
   * Resolve logo URL.
   *
   * Priority:
   *
   * 1. src
   * 2. fallbackSrc
   * 3. tool.logo_url
   * 4. tool.logo
   * 5. tool.image_url
   * 6. tool.icon_url
   */
  const resolvedLogo = useMemo(() => {
    const candidates = [
      src,
      fallbackSrc,
      tool?.logo_url,
      tool?.logo,
      tool?.image_url,
      tool?.icon_url,
    ];

    for (const candidate of candidates) {
      const value = getString(candidate);

      if (value) {
        return value;
      }
    }

    return null;
  }, [
    src,
    fallbackSrc,
    tool?.logo_url,
    tool?.logo,
    tool?.image_url,
    tool?.icon_url,
  ]);

  /*
   * Reset image failure when the URL changes.
   */
  useEffect(() => {
    setFailedUrl(null);
  }, [resolvedLogo]);

  const initials = useMemo(
    () => getInitials(resolvedName),
    [resolvedName]
  );

  const sizeClass =
    SIZE_CLASSES[size] || SIZE_CLASSES.md;

  const shouldShowFallback =
    !resolvedLogo ||
    failedUrl === resolvedLogo;

  /*
   * Beautiful fallback logo.
   *
   * This is intentionally kept because some tools in the
   * database may not have a valid logo URL.
   */
  if (shouldShowFallback) {
    return (
      <div
        className={[
          sizeClass,
          "flex shrink-0 items-center justify-center",
          "bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600",
          "font-bold text-white shadow-sm",
          "select-none",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={`${resolvedName} logo`}
        title={resolvedName}
      >
        <span>{initials}</span>
      </div>
    );
  }

  return (
    <div
      className={[
        sizeClass,
        "flex shrink-0 items-center justify-center",
        "overflow-hidden",
        "border border-slate-100",
        "bg-white",
        "shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
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
          setFailedUrl(resolvedLogo);
        }}
      />
    </div>
  );
}

/*
 * IMPORTANT:
 *
 * Named export:
 *
 * import { ToolLogo } from "@/components/ToolLogo";
 *
 * Default export:
 *
 * import ToolLogo from "@/components/ToolLogo";
 *
 * BOTH are supported.
 */
export default ToolLogo;
