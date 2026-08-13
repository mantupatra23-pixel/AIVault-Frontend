"use client";

import React, { useState } from "react";

type ToolLogoProps = {
  tool?: {
    name?: string | null;
    logo_url?: string | null;
    logoUrl?: string | null;
    website_url?: string | null;
    websiteUrl?: string | null;
  } | null;

  src?: string | null;
  fallbackSrc?: string | null;

  name?: string | null;

  size?: "sm" | "md" | "lg" | "xl";

  className?: string;
};

const sizeClasses = {
  sm: "h-10 w-10 text-sm rounded-xl",
  md: "h-14 w-14 text-base rounded-2xl",
  lg: "h-20 w-20 text-xl rounded-2xl",
  xl: "h-24 w-24 text-2xl rounded-2xl",
};

function initialsFromName(name: string): string {
  const clean = name
    .replace(/^\/+/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return "AI";

  return clean
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export const ToolLogo: React.FC<ToolLogoProps> = ({
  tool,
  src,
  fallbackSrc,
  name,
  size = "md",
  className = "",
}) => {
  const [failed, setFailed] = useState(false);

  const toolName =
    name ||
    tool?.name ||
    "AI Tool";

  const logo =
    src ||
    tool?.logo_url ||
    tool?.logoUrl ||
    fallbackSrc ||
    null;

  const classes =
    `${sizeClasses[size]} flex shrink-0 items-center justify-center overflow-hidden border border-slate-100 bg-white shadow-sm ${className}`;

  const initials = initialsFromName(toolName);

  if (!logo || failed) {
    return (
      <div
        className={`${classes} bg-gradient-to-br from-blue-600 to-indigo-600 font-bold text-white`}
        aria-label={`${toolName} logo`}
        role="img"
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={classes}
      aria-label={`${toolName} logo`}
    >
      <img
        src={logo}
        alt={`${toolName} logo`}
        className="h-full w-full object-contain p-2"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </div>
  );
};

export default ToolLogo;
