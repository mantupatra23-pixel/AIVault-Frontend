"use client";

import React, { useEffect, useState } from "react";

export type ToolLogoProps = {
  src?: string | null;
  fallbackSrc?: string | null;
  websiteUrl?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | number;
  className?: string;
};

function normalizeUrl(value?: string | null): string {
  if (!value) return "";

  const url = value.trim();

  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `https://${url}`;
}

function getInitials(name?: string | null): string {
  const value = String(name ?? "").trim();

  if (!value) return "AI";

  const words = value
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return (
      `${words[0].charAt(0)}${words[1].charAt(0)}`
    ).toUpperCase();
  }

  return value.slice(0, 2).toUpperCase();
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

/* =========================================================
   TOOL LOGO
========================================================= */

export function ToolLogo({
  src,
  fallbackSrc,
  websiteUrl,
  name,
  size = "md",
  className = "",
}: ToolLogoProps) {
  const [imageFailed, setImageFailed] =
    useState(false);

  const primarySrc = normalizeUrl(src);
  const backupSrc = normalizeUrl(fallbackSrc);

  const pixelSize = getPixelSize(size);

  const activeSrc =
    !imageFailed && primarySrc
      ? primarySrc
      : !imageFailed && backupSrc
        ? backupSrc
        : "";

  useEffect(() => {
    setImageFailed(false);
  }, [src, fallbackSrc, websiteUrl]);

  /*
   * No logo available:
   * show beautiful initials fallback.
   */
  if (!activeSrc) {
    return (
      <div
        role="img"
        aria-label={`${name || "AI tool"} logo`}
        title={name || "AI tool"}
        className={[
          "flex shrink-0 items-center justify-center",
          "overflow-hidden rounded-2xl",
          "bg-gradient-to-br",
          "from-blue-600 via-indigo-600 to-purple-600",
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
        {getInitials(name)}
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
        src={activeSrc}
        alt={`${name || "AI tool"} logo`}
        width={pixelSize}
        height={pixelSize}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="h-full w-full object-contain p-2"
        onError={() => {
          /*
           * If primary logo fails and a fallback exists,
           * try fallback first.
           */
          if (
            primarySrc &&
            backupSrc &&
            activeSrc === primarySrc
          ) {
            setImageFailed(true);
            return;
          }

          /*
           * Otherwise show initials.
           */
          setImageFailed(true);
        }}
      />
    </div>
  );
}

/*
 * Keep default export too.
 *
 * This supports BOTH:
 *
 * import ToolLogo from "@/components/ToolLogo";
 *
 * AND
 *
 * import { ToolLogo } from "@/components/ToolLogo";
 */
export default ToolLogo;
