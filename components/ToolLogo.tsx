"use client";

import React, { useEffect, useState } from "react";

export type ToolLogoProps = {
  /*
   * Supports the existing usage:
   *
   * <ToolLogo tool={tool} size="lg" />
   *
   * and also direct usage:
   *
   * <ToolLogo src="..." name="ChatGPT" />
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
  slug?: unknown;
  logo?: unknown;
  logo_url?: unknown;
  logoUrl?: unknown;
  image?: unknown;
  image_url?: unknown;
  imageUrl?: unknown;
  website?: unknown;
  website_url?: unknown;
  websiteUrl?: unknown;
};

function asTool(value: unknown): ToolLike {
  if (
    value &&
    typeof value === "object"
  ) {
    return value as ToolLike;
  }

  return {};
}

function normalizeUrl(
  value?: unknown
): string {
  const raw = String(value ?? "").trim();

  if (!raw) return "";

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://")
  ) {
    return raw;
  }

  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }

  return `https://${raw}`;
}

function getInitials(
  name?: unknown
): string {
  const value = String(name ?? "").trim();

  if (!value) {
    return "AI";
  }

  const words = value
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return (
      words[0].charAt(0) +
      words[1].charAt(0)
    ).toUpperCase();
  }

  return value
    .slice(0, 2)
    .toUpperCase();
}

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

function getFaviconUrl(
  websiteUrl: string
): string {
  if (!websiteUrl) return "";

  try {
    const url = new URL(
      normalizeUrl(websiteUrl)
    );

    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      url.hostname
    )}&sz=128`;
  } catch {
    return "";
  }
}

/* =========================================================
   TOOL LOGO
========================================================= */

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
   * Resolve name from either:
   *
   * tool.name
   * OR
   * name prop
   */
  const resolvedName =
    String(
      name ??
        toolData.name ??
        ""
    ).trim() || "AI Tool";

  /*
   * Resolve website.
   */
  const resolvedWebsite =
    normalizeUrl(
      websiteUrl ??
        toolData.websiteUrl ??
        toolData.website_url ??
        toolData.website
    );

  /*
   * Resolve logo.
   *
   * Supports multiple database field names so
   * existing AI Vault records don't break.
   */
  const primaryLogo =
    normalizeUrl(
      src ??
        toolData.logoUrl ??
        toolData.logo_url ??
        toolData.logo ??
        toolData.imageUrl ??
        toolData.image_url ??
        toolData.image
    );

  const backupLogo =
    normalizeUrl(fallbackSrc) ||
    getFaviconUrl(resolvedWebsite);

  const [failedPrimary, setFailedPrimary] =
    useState(false);

  const [failedBackup, setFailedBackup] =
    useState(false);

  useEffect(() => {
    setFailedPrimary(false);
    setFailedBackup(false);
  }, [
    primaryLogo,
    backupLogo,
    resolvedWebsite,
  ]);

  const activeLogo =
    !failedPrimary && primaryLogo
      ? primaryLogo
      : !failedBackup && backupLogo
        ? backupLogo
        : "";

  const pixelSize =
    getPixelSize(size);

  /*
   * Initial fallback.
   */
  if (!activeLogo) {
    return (
      <div
        role="img"
        aria-label={`${resolvedName} logo`}
        title={resolvedName}
        className={[
          "flex shrink-0 items-center justify-center",
          "overflow-hidden rounded-2xl",
          "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600",
          "font-bold text-white shadow-sm",
          getSizeClass(size),
          className,
        ].join(" ")}
        style={
          typeof size === "number"
            ? {
                width: pixelSize,
                height: pixelSize,
              }
            : undefined
        }
      >
        {getInitials(resolvedName)}
      </div>
    );
  }

  return (
    <div
      className={[
        "relative flex shrink-0 items-center justify-center",
        "overflow-hidden rounded-2xl",
        "border border-slate-200 bg-white",
        "shadow-sm",
        getSizeClass(size),
        className,
      ].join(" ")}
      style={
        typeof size === "number"
          ? {
              width: pixelSize,
              height: pixelSize,
            }
          : undefined
      }
    >
      <img
        src={activeLogo}
        alt={`${resolvedName} logo`}
        width={pixelSize}
        height={pixelSize}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="h-full w-full object-contain p-2"
        onError={() => {
          if (
            !failedPrimary &&
            primaryLogo &&
            activeLogo === primaryLogo
          ) {
            setFailedPrimary(true);
            return;
          }

          setFailedBackup(true);
        }}
      />
    </div>
  );
}

/*
 * Default export compatibility.
 *
 * Both imports work:
 *
 * import ToolLogo from "@/components/ToolLogo";
 *
 * import { ToolLogo } from "@/components/ToolLogo";
 */
export default ToolLogo;
