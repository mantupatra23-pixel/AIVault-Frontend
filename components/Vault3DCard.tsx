"use client";

import {
  CSSProperties,
  ReactNode,
  useState,
} from "react";

type Vault3DCardProps = {
  children: ReactNode;
  className?: string;
  href?: string;
};

export default function Vault3DCard({
  children,
  className = "",
}: Vault3DCardProps) {
  const [
    hovered,
    setHovered,
  ] = useState(false);

  const style: CSSProperties =
    {
      transform:
        hovered
          ? "perspective(1200px) rotateX(1deg) rotateY(-1deg) translateY(-5px)"
          : "perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0)",
    };

  return (
    <div
      className={`group relative ${className}`}
      onMouseEnter={() =>
        setHovered(true)
      }
      onMouseLeave={() =>
        setHovered(false)
      }
    >
      {/* DEPTH */}

      <div
        className="absolute -inset-[1px] rounded-[25px] bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-violet-500/0 opacity-0 blur-xl transition duration-500 group-hover:from-blue-500/20 group-hover:to-violet-500/20 group-hover:opacity-100"
      />

      {/* CARD */}

      <div
        style={style}
        className="relative h-full overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/95 shadow-[0_8px_35px_rgba(15,23,42,0.06)] transition-all duration-500 ease-out group-hover:border-blue-200 group-hover:shadow-[0_25px_70px_rgba(37,99,235,0.14)]"
      >

        {/* GLASS LIGHT */}

        <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-blue-500/5 blur-3xl transition duration-700 group-hover:bg-blue-500/15" />

        <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl transition duration-700 group-hover:bg-violet-500/10" />

        {children}

      </div>
    </div>
  );
}
