"use client";

import React, { useEffect, useState } from "react";

type ToolLogoProps = {
  src?: string | null;
  fallbackSrc?: string | null;
  websiteUrl?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | number;
  className?: string;
};

function getInitials(name?: string | null): string {
  const value = String(name ?? "").trim();

  if (!value) return "AI";

  const words = value
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`
      .toUpperCase();
  }

  return value.slice(0, 2).toUpperCase();
}

function normalizeUrl(value?: string | null): string {
  if (!value) return "";

  const trimmed = value.trim();

  if (!trimmed) return "";

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function getDomain(value?: string | null): string {
  try {
    const url = normalizeUrl(value);

    if (!url) return "";

    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function sizeClass(
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

function pixelSize(
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

export default function ToolLogo({
  src,
  fallbackSrc,
  websiteUrl,
  name,
  size = "md",
  className = "",
}: ToolLogoProps) {
  const [failed, setFailed] = useState(false);

  const primarySrc = normalizeUrl(src);
  const backupSrc = normalizeUrl(fallbackSrc);
  const domain = getDomain(websiteUrl);

  const logoUrl =
    !failed && primarySrc
      ? primarySrc
      : !failed && backupSrc
        ? backupSrc
        : "";

  const dimension = pixelSize(size);

  useEffect(() => {
    setFailed(false);
  }, [src, fallbackSrc, websiteUrl]);

  if (!logoUrl) {
    return (
      <div
        aria-label={`${name ?? "AI tool"} logo`}
        title={name ?? "AI tool"}
        className={[
          "flex shrink-0 items-center justify-center",
          "rounded-2xl bg-gradient-to-br",
          "from-blue-600 via-indigo-600 to-purple-600",
          "font-bold text-white shadow-sm",
          sizeClass(size),
          className,
        ].join(" ")}
        style={
          typeof size === "number"
            ? {
                width: dimension,
                height: dimension,
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
        "overflow-hidden rounded-2xl bg-white",
        "border border-slate-200",
        "shadow-sm",
        sizeClass(size),
        className,
      ].join(" ")}
      style={
        typeof size === "number"
          ? {
              width: dimension,
              height: dimension,
            }
          : undefined
      }
    >
      <img
        src={logoUrl}
        alt={`${name ?? "AI tool"} logo`}
        width={dimension}
        height={dimension}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="h-full w-full object-contain p-2"
        onError={() => {
          if (
            backupSrc &&
            logoUrl !== backupSrc
          ) {
            setFailed(false);
          } else {
            setFailed(true);
          }
        }}
      />

      {domain && (
        <span className="sr-only">
          Official website: {domain}
        </span>
      )}
    </div>
  );
}
