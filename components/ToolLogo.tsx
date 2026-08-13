"use client";

import React, { useEffect, useMemo, useState } from "react";

export type ToolLogoInput = {
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
};

type ToolLogoProps = {
  /*
   * Existing API.
   *
   * IMPORTANT:
   * Keep this broad enough so existing DatabaseToolRecord
   * objects can be passed without TypeScript index-signature errors.
   */
  tool?: ToolLogoInput | Record<string, unknown> | null;

  /*
   * Direct logo API
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
};

/* ============================================================
   HELPERS
   ============================================================ */

function readString(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getToolValue(
  tool: ToolLogoInput | Record<string, unknown> | null | undefined,
  key: string
): string {
  if (!tool) return "";

  return readString(
    (tool as Record<string, unknown>)[key]
  );
}

function normalizeUrl(
  value: string
): string | null {
  const input = value.trim();

  if (!input) {
    return null;
  }

  if (
    input.startsWith("/") ||
    input.startsWith("./") ||
    input.startsWith("../")
  ) {
    return input;
  }

  if (
    input.startsWith("https://") ||
    input.startsWith("http://")
  ) {
    return input;
  }

  if (input.startsWith("//")) {
    return `https:${input}`;
  }

  /*
   * Domain such as:
   * example.com
   */
  return `https://${input}`;
}

function getDomain(
  value: string
): string | null {
  const normalized = normalizeUrl(value);

  if (!normalized) {
    return null;
  }

  try {
    const parsed = new URL(normalized);

    return parsed.hostname
      .replace(/^www\./i, "")
      .toLowerCase();
  } catch {
    return null;
  }
}

/* ============================================================
   LOGO RESOLVER
   ============================================================ */

export function resolveToolLogo(
  tool?: ToolLogoInput | Record<string, unknown> | null,
  directSrc?: string | null,
  directFallbackSrc?: string | null
): string | null {
  /*
   * 1. Direct src
   */
  const direct = normalizeUrl(
    readString(directSrc)
  );

  if (direct) {
    return direct;
  }

  /*
   * 2. Official/database logo_url
   */
  const logoUrl = normalizeUrl(
    getToolValue(tool, "logo_url")
  );

  if (logoUrl) {
    return logoUrl;
  }

  /*
   * 3. image_url
   */
  const imageUrl = normalizeUrl(
    getToolValue(tool, "image_url")
  );

  if (imageUrl) {
    return imageUrl;
  }

  /*
   * 4. icon_url
   */
  const iconUrl = normalizeUrl(
    getToolValue(tool, "icon_url")
  );

  if (iconUrl) {
    return iconUrl;
  }

  /*
   * 5. Explicit fallback
   */
  const explicitFallback = normalizeUrl(
    readString(directFallbackSrc)
  );

  if (explicitFallback) {
    return explicitFallback;
  }

  /*
   * 6. Website/domain fallback
   */
  const website =
    getToolValue(tool, "website_url") ||
    getToolValue(tool, "website") ||
    getToolValue(tool, "url") ||
    getToolValue(tool, "domain");

  const domain = getDomain(website);

  if (domain) {
    /*
     * Google favicon fallback.
     *
     * This is only used when an actual logo URL
     * is not available.
     */
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      domain
    )}&sz=128`;
  }

  return null;
}

/* ============================================================
   INITIALS
   ============================================================ */

function getInitials(
  name: string
): string {
  const cleanName = name.trim();

  if (!cleanName) {
    return "AI";
  }

  const words = cleanName
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return words
    .slice(0, 2)
    .map(
      (word) =>
        word.charAt(0).toUpperCase()
    )
    .join("");
}

/* ============================================================
   SIZE SYSTEM
   ============================================================ */

const sizeClasses: Record<
  NonNullable<ToolLogoProps["size"]>,
  string
> = {
  sm: "h-10 w-10 rounded-xl text-sm",
  md: "h-16 w-16 rounded-2xl text-lg",
  lg: "h-20 w-20 rounded-2xl text-2xl",
  xl: "h-24 w-24 rounded-2xl text-3xl",
};

/* ============================================================
   TOOL LOGO
   ============================================================ */

export const ToolLogo: React.FC<
  ToolLogoProps
> = ({
  tool,
  src,
  fallbackSrc,
  name,
  size = "md",
  className = "",
}) => {
  const [failed, setFailed] =
    useState(false);

  /*
   * Resolve name from direct prop first,
   * then database/tool object.
   */
  const toolName =
    readString(name) ||
    getToolValue(tool, "name") ||
    "AI Tool";

  /*
   * Resolve logo.
   */
  const resolvedUrl = useMemo(
    () =>
      resolveToolLogo(
        tool,
        src,
        fallbackSrc
      ),
    [tool, src, fallbackSrc]
  );

  /*
   * Reset error when a different tool/logo
   * is rendered during navigation.
   */
  useEffect(() => {
    setFailed(false);
  }, [resolvedUrl]);

  const initials =
    getInitials(toolName);

  const dimensions =
    sizeClasses[size] ||
    sizeClasses.md;

  /* ==========================================================
     FALLBACK
     ========================================================== */

  if (!resolvedUrl || failed) {
    return (
      <div
        className={[
          dimensions,
          "flex shrink-0 items-center justify-center",
          "overflow-hidden select-none",
          "bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600",
          "font-bold text-white shadow-sm",
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

  /* ==========================================================
     REAL LOGO
     ========================================================== */

  return (
    <div
      className={[
        dimensions,
        "flex shrink-0 items-center justify-center",
        "overflow-hidden",
        "border border-slate-100",
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
          setFailed(true);
        }}
      />
    </div>
  );
};

export default ToolLogo;
