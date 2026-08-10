"use client";

import React, { useState, useEffect } from "react";
import { resolveToolLogo, ToolLogoInput } from "@/lib/tool-logo";

interface ToolLogoProps {
  tool: ToolLogoInput;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs rounded-lg",
  md: "w-12 h-12 text-base rounded-xl",
  lg: "w-20 h-20 text-2xl rounded-2xl",
  xl: "w-24 h-24 text-3xl rounded-2xl",
};

export const ToolLogo: React.FC<ToolLogoProps> = ({
  tool,
  size = "md",
  className = "",
}) => {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = resolveToolLogo(tool);
  const toolName = tool?.name?.trim() || "Tool";
  const firstLetter = toolName.charAt(0).toUpperCase() || "A";

  useEffect(() => {
    setHasError(false);
  }, [resolvedUrl]);

  const containerStyle = `${sizeClasses[size]} flex items-center justify-center font-bold font-serif flex-shrink-0 overflow-hidden select-none ${className}`;

  // Premium Monogram Fallback
  const FallbackMonogram = () => (
    <div
      className={`${containerStyle} bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm border border-slate-100`}
      aria-label={`${toolName} logo`}
    >
      <span>{firstLetter}</span>
    </div>
  );

  if (!resolvedUrl || hasError) {
    return <FallbackMonogram />;
  }

  return (
    <div className={`${containerStyle} bg-white border border-slate-100 relative`}>
      <img
        src={resolvedUrl}
        alt={`${toolName} logo`}
        className="w-full h-full object-contain p-1.5"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
