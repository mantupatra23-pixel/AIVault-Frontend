"use client";

import React, { useEffect, useMemo, useState } from "react";

type ToolLogoInput = {
  id?: string | number | null;
  name?: string | null;
  slug?: string | null;

  logo_url?: string | null;
  image_url?: string | null;
  icon_url?: string | null;

  website?: string | null;
  website_url?: string | null;
  url?: string | null;

  domain?: string | null;

  [key: string]: unknown;
};

type ToolLogoProps = {
  /*
   * Existing API
   */
  tool?: ToolLogoInput | null;

  /*
   * New/direct API
   */
  src?: string | null;
  fallbackSrc?: string | null;
  name?: string | null;

  /*
   * Sizes
   */
  size?: "sm" | "md" | "lg" | "xl";

  /*
   * Optional custom classes
   */
  className?: string;
  className?: string;
};

const sizeClasses: Record<
  NonNullable<ToolLogoProps["size"]>,
  string
> = {
  sm: "h-10 w-10 text-sm rounded-xl",
  md: "h-16 w-16 text-lg rounded-2xl",
  lg: "h-20 w-20 text-2xl rounded-2xl",
  xl: "h-24 w-24 text-3xl rounded-2xl",
};

/**
 * Safely convert unknown value to string.
 */
function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Make sure a URL is usable.
 */
function normalizeUrl(value: string): string | null {
  const input = value.trim();

  if (!input) {
    return null;
  }

  try {
    if (
      input.startsWith("http://") ||
      input.startsWith("https://")
    ) {
      return input;
    }

    if (input.startsWith("//")) {
      return `https:${input}`;
    }

    if (
      input.startsWith("/") ||
      input.startsWith("./") ||
      input.startsWith("../")
    ) {
      return input;
    }

    return `https://${input}`;
  } catch {
    return null;
  }
}

/**
 * Extract hostname from a website URL/domain.
 */
function extractDomain(value: string): string | null {
  const normalized = normalizeUrl(value);

  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);
    return url.hostname
      .replace(/^www\./i, "")
      .trim()
      .toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Resolve the best available logo source.
 *
 * Priority:
 *
 * 1. logo_url
 * 2. image_url
 * 3. icon_url
 * 4. website favicon
 * 5. Google favicon service
 */
export function resolveToolLogo(
  tool?: ToolLogoInput | null,
  directSrc?: string | null,
  directFallbackSrc?: string | null
): string | null {
  /*
   * Direct src gets highest priority.
   */
  const direct = normalizeUrl(asString(directSrc));

  if (direct) {
    return direct;
  }

  /*
   * Database logo_url.
   */
  const logoUrl = normalizeUrl(
    asString(tool?.logo_url)
  );

  if (logoUrl) {
    return logoUrl;
  }

  /*
   * Database image_url.
   */
  const imageUrl = normalizeUrl(
    asString(tool?.image_url)
  );

  if (imageUrl) {
    return imageUrl;
  }

  /*
   * Database icon_url.
   */
  const iconUrl = normalizeUrl(
    asString(tool?.icon_url)
  );

  if (iconUrl) {
    return iconUrl;
  }

  /*
   * Explicit fallback.
   */
  const fallback = normalizeUrl(
    asString(directFallbackSrc)
  );

  if (fallback) {
    return fallback;
  }

  /*
   * Website/domain based logo.
   */
  const website =
    asString(tool?.website_url) ||
    asString(tool?.website) ||
    asString(tool?.url) ||
    asString(tool?.domain);

  const domain = extractDomain(website);

  if (domain) {
    /*
     * Google favicon is useful when an official logo URL
     * is not stored in Supabase.
     */
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      domain
    )}&sz=128`;
  }

  return null;
}

/**
 * Create initials from tool name.
 */
function getInitials(name: string): string {
  const cleaned = name.trim();

  if (!cleaned) {
    return "AI";
  }

  const words = cleaned
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) =>
      word.charAt(0).toUpperCase()
    )
    .join("");
}

/**
 * Main ToolLogo component.
 *
 * This remains a Client Component because image loading errors
 * need to be handled safely on the client.
 */
export const ToolLogo: React.FC<ToolLogoProps> = ({
  tool,
  src,
  fallbackSrc,
  name,
  size = "md",
  className = "",
}) => {
  const [hasError, setHasError] = useState(false);

  const toolName =
    asString(name) ||
    asString(tool?.name) ||
    "AI Tool";

  const resolvedUrl = useMemo(() => {
    return resolveToolLogo(
      tool,
      src,
      fallbackSrc
    );
  }, [tool, src, fallbackSrc]);

  /*
   * If database/tool changes because the page navigates,
   * reset the previous image error.
   */
  useEffect(() => {
    setHasError(false);
  }, [resolvedUrl]);

  const dimensions =
    sizeClasses[size] || sizeClasses.md;

  const initials = getInitials(toolName);

  /*
   * ============================================================
   * FALLBACK LOGO
   * ============================================================
   */

  if (!resolvedUrl || hasError) {
    return (
      <div
        className={[
          dimensions,
          "flex shrink-0 items-center justify-center",
          "bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600",
          "font-bold text-white shadow-sm",
          "select-none overflow-hidden",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={`${toolName} logo`}
        title={toolName}
      >
        {initials}
      </div>
    );
  }

  /*
   * ============================================================
   * REAL LOGO
   * ============================================================
   */

  return (
    <div
      className={[
        dimensions,
        "flex shrink-0 items-center justify-center",
        "overflow-hidden border border-slate-100",
        "bg-white shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={toolName}
    >
      <img
        src={resolvedUrl}
        alt={`${toolName} logo`}
        className="h-full w-full object-contain p-2"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => {
          setHasError(true);
        }}
      />
    </div>
  );
};

export default ToolLogo;
