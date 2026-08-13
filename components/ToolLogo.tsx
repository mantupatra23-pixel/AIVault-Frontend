"use client";

import React, { useEffect, useMemo, useState } from "react";

export type ToolLogoProps = {
  /*
   * Existing usage supported:
   *
   * <ToolLogo tool={tool} size="lg" />
   *
   * Direct usage supported:
   *
   * <ToolLogo
   *   src="https://example.com/logo.png"
   *   websiteUrl="https://example.com"
   *   name="Example"
   * />
   */

  tool?: unknown;

  src?: string | null;
  fallbackSrc?: string | null;
  websiteUrl?: string | null;
  name?: string | null;

  size?: "sm" | "md" | "lg" | "xl" | number;

  className?: string;
};

type ToolLike = {
  name?: unknown;

  logo?: unknown;
  logo_url?: unknown;
  logoUrl?: unknown;

  image?: unknown;
  image_url?: unknown;
  imageUrl?: unknown;

  website?: unknown;
  website_url?: unknown;
  websiteUrl?: unknown;

  url?: unknown;
  official_url?: unknown;
  officialUrl?: unknown;
};

function asTool(value: unknown): ToolLike {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as ToolLike;
  }

  return {};
}

function clean(value: unknown): string {
  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return "";
  }

  return String(value).trim();
}

/**
 * Converts a database URL into a safe image/website URL.
 */
function normalizeUrl(value: unknown): string {
  const raw = clean(value);

  if (!raw) {
    return "";
  }

  const lower = raw.toLowerCase();

  if (
    lower === "null" ||
    lower === "undefined" ||
    lower === "n/a" ||
    lower === "none" ||
    raw === "#" ||
    raw === "/"
  ) {
    return "";
  }

  /*
   * Already absolute URL.
   */
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://")
  ) {
    return raw;
  }

  /*
   * Protocol-relative URL.
   */
  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }

  /*
   * Local/public asset.
   */
  if (raw.startsWith("/")) {
    return raw;
  }

  /*
   * Domain without protocol.
   */
  if (
    raw.includes(".") &&
    !raw.includes(" ")
  ) {
    return `https://${raw}`;
  }

  /*
   * Unknown value.
   */
  return "";
}

/**
 * Extract hostname from website URL.
 */
function getHostname(value: unknown): string {
  const normalized = normalizeUrl(value);

  if (!normalized) {
    return "";
  }

  try {
    const url = new URL(normalized);

    return url.hostname
      .replace(/^www\./i, "")
      .trim()
      .toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Create clean initials for the final fallback.
 */
function getInitials(name: unknown): string {
  const value = clean(name);

  if (!value) {
    return "AI";
  }

  /*
   * Remove unnecessary symbols from names like:
   * "/monitor by Firecrawl"
   */
  const cleaned = value
    .replace(/^[/\\]+/, "")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned
    .split(" ")
    .filter(Boolean);

  if (words.length >= 2) {
    return (
      words[0].charAt(0) +
      words[1].charAt(0)
    ).toUpperCase();
  }

  return cleaned
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase() || "AI";
}

/**
 * Size classes for Tailwind.
 */
function getSizeClass(
  size: ToolLogoProps["size"]
): string {
  if (typeof size === "number") {
    return "";
  }

  switch (size) {
    case "sm":
      return "h-10 w-10 text-sm";

    case "lg":
      return "h-16 w-16 text-xl";

    case "xl":
      return "h-20 w-20 text-2xl";

    case "md":
    default:
      return "h-12 w-12 text-base";
  }
}

/**
 * Pixel size used for <img width/height>.
 */
function getPixelSize(
  size: ToolLogoProps["size"]
): number {
  if (typeof size === "number") {
    return size;
  }

  switch (size) {
    case "sm":
      return 40;

    case "lg":
      return 64;

    case "xl":
      return 80;

    case "md":
    default:
      return 48;
  }
}

/**
 * Google favicon fallback.
 */
function getGoogleFavicon(
  website: unknown
): string {
  const hostname = getHostname(website);

  if (!hostname) {
    return "";
  }

  return (
    "https://www.google.com/s2/favicons" +
    `?domain=${encodeURIComponent(hostname)}` +
    "&sz=128"
  );
}

/**
 * DuckDuckGo favicon fallback.
 */
function getDuckFavicon(
  website: unknown
): string {
  const hostname = getHostname(website);

  if (!hostname) {
    return "";
  }

  return (
    "https://icons.duckduckgo.com/ip3/" +
    `${encodeURIComponent(hostname)}.ico`
  );
}

/**
 * Remove duplicate/empty URLs.
 */
function uniqueUrls(
  urls: string[]
): string[] {
  return Array.from(
    new Set(
      urls.filter(Boolean)
    )
  );
}

export function ToolLogo({
  tool,
  src,
  fallbackSrc,
  websiteUrl,
  name,
  size = "md",
  className = "",
}: ToolLogoProps) {
  const toolData = asTool(tool);

  /*
   * Resolve tool name from every supported field.
   */
  const resolvedName = useMemo(() => {
    return (
      clean(name) ||
      clean(toolData.name) ||
      "AI Tool"
    );
  }, [name, toolData.name]);

  /*
   * Resolve official website.
   */
  const resolvedWebsite = useMemo(() => {
    return normalizeUrl(
      websiteUrl ??
        toolData.websiteUrl ??
        toolData.website_url ??
        toolData.website ??
        toolData.officialUrl ??
        toolData.official_url ??
        toolData.url
    );
  }, [
    websiteUrl,
    toolData.websiteUrl,
    toolData.website_url,
    toolData.website,
    toolData.officialUrl,
    toolData.official_url,
    toolData.url,
  ]);

  /*
   * Resolve database logo.
   *
   * Supports multiple historical AI Vault fields.
   */
  const primaryLogo = useMemo(() => {
    return normalizeUrl(
      src ??
        toolData.logoUrl ??
        toolData.logo_url ??
        toolData.logo ??
        toolData.imageUrl ??
        toolData.image_url ??
        toolData.image
    );
  }, [
    src,
    toolData.logoUrl,
    toolData.logo_url,
    toolData.logo,
    toolData.imageUrl,
    toolData.image_url,
    toolData.image,
  ]);

  /*
   * Build complete fallback chain.
   *
   * 1. Primary database logo
   * 2. Explicit fallback logo
   * 3. Google favicon
   * 4. DuckDuckGo favicon
   * 5. Initials
   */
  const logoSources = useMemo(() => {
    const google =
      getGoogleFavicon(
        resolvedWebsite
      );

    const duck =
      getDuckFavicon(
        resolvedWebsite
      );

    return uniqueUrls([
      primaryLogo,
      normalizeUrl(fallbackSrc),
      google,
      duck,
    ]);
  }, [
    primaryLogo,
    fallbackSrc,
    resolvedWebsite,
  ]);

  const [sourceIndex, setSourceIndex] =
    useState(0);

  const [imageLoaded, setImageLoaded] =
    useState(false);

  /*
   * Reset image state whenever tool/logo changes.
   */
  useEffect(() => {
    setSourceIndex(0);
    setImageLoaded(false);
  }, [
    resolvedName,
    primaryLogo,
    resolvedWebsite,
    fallbackSrc,
  ]);

  const activeSource =
    logoSources[sourceIndex] || "";

  const pixelSize =
    getPixelSize(size);

  const sizeClass =
    getSizeClass(size);

  /*
   * If current image fails:
   *
   * Move to next fallback.
   *
   * Once all URLs fail, remain on initials.
   */
  const handleImageError = () => {
    setImageLoaded(false);

    setSourceIndex((current) => {
      if (
        current + 1 <
        logoSources.length
      ) {
        return current + 1;
      }

      return current;
    });
  };

  /*
   * IMPORTANT:
   *
   * Initials are ALWAYS rendered underneath.
   *
   * Therefore the browser will NEVER show
   * a broken-image icon to the user.
   */
  return (
    <div
      role="img"
      aria-label={`${resolvedName} logo`}
      title={resolvedName}
      className={[
        "relative flex shrink-0",
        "items-center justify-center",
        "overflow-hidden rounded-2xl",
        "border border-slate-200",
        "bg-white shadow-sm",
        sizeClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        typeof size === "number"
          ? {
              width: size,
              height: size,
              minWidth: size,
              minHeight: size,
            }
          : undefined
      }
    >
      {/* ALWAYS-VISIBLE SAFE FALLBACK */}
      <div
        className={[
          "absolute inset-0",
          "flex items-center justify-center",
          "bg-gradient-to-br",
          "from-blue-600 via-indigo-600 to-purple-600",
          "font-bold text-white",
          "select-none",
        ].join(" ")}
      >
        {getInitials(resolvedName)}
      </div>

      {/* REAL LOGO */}
      {activeSource && (
        <img
          key={activeSource}
          src={activeSource}
          alt=""
          width={pixelSize}
          height={pixelSize}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          className={[
            "relative z-10",
            "h-full w-full",
            "object-contain p-2",
            "bg-white",
            "transition-opacity duration-200",
            imageLoaded
              ? "opacity-100"
              : "opacity-0",
          ].join(" ")}
          onLoad={() => {
            setImageLoaded(true);
          }}
          onError={handleImageError}
        />
      )}
    </div>
  );
}

export default ToolLogo;
