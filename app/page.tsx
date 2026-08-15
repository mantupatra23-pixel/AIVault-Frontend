"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";

import ToolLogo from "@/components/ToolLogo";

import {
  trackToolClick,
  trackToolImpression,
} from "@/lib/traffic-tracker";

import { SITE_URL } from "@/lib/site-url";

/* =========================================================
   TYPES
========================================================= */

type ToolRecord = {
  id?: string | number | null;

  slug?: string | null;

  name?: string | null;

  description?: string | null;

  short_description?: string | null;

  overview?: string | null;

  category?: string | null;

  pricing?: string | null;

  pricing_model?: string | null;

  score?: number | string | null;

  ai_vault_score?: number | string | null;

  logo_url?: string | null;

  logo?: string | null;

  image_url?: string | null;

  icon_url?: string | null;

  verified?: boolean | null;

  [key: string]: unknown;
};

/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getSupabase() {
  if (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  return createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}

/* =========================================================
   CATEGORIES
========================================================= */

const categories = [
  {
    name: "All",
    icon: "⚡",
  },
  {
    name: "Chatbot",
    icon: "🤖",
  },
  {
    name: "Coding",
    icon: "💻",
  },
  {
    name: "Image",
    icon: "🎨",
  },
  {
    name: "Writing",
    icon: "✍️",
  },
  {
    name: "Audio",
    icon: "🎵",
  },
  {
    name: "Video",
    icon: "🎬",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function getCanonicalSlug(
  tool: ToolRecord
): string {
  if (
    typeof tool.slug !== "string"
  ) {
    return "";
  }

  return tool.slug.trim();
}

function getToolHref(
  tool: ToolRecord
): string | null {
  const slug =
    getCanonicalSlug(tool);

  if (!slug) {
    return null;
  }

  return `/tool/${encodeURIComponent(
    slug
  )}`;
}

function getToolName(
  tool: ToolRecord
): string {
  if (
    typeof tool.name === "string" &&
    tool.name.trim()
  ) {
    return tool.name.trim();
  }

  return "AI Tool";
}

/* =========================================================
   CONTENT CLEANER
========================================================= */

function cleanGeneratedContent(
  value: unknown
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  let text = value.trim();

  if (!text) {
    return "";
  }

  const patterns = [
    /As a Senior SEO & AI Analyst for Visora AI,?\s*/gi,

    /As a Senior SEO and AI Analyst for Visora AI,?\s*/gi,

    /As a Senior SEO & AI Analyst,?\s*/gi,

    /As a Senior SEO and AI Analyst,?\s*/gi,

    /In this professional review,?\s*/gi,

    /Our professional review aims to provide an in-depth analysis of the tool,?\s*/gi,

    /I have conducted an in-depth analysis of\s*/gi,

    /I have conducted an in-depth analysis of this\s*/gi,

    /I have analyzed\s*/gi,

    /We will delve into\s*/gi,

    /we will delve into\s*/gi,

    /With the ever-evolving landscape of\s*/gi,

    /our Professional Review of\s*/gi,

    /Best .*? Alternatives available in the market/gi,
  ];

  for (
    const pattern of patterns
  ) {
    text = text.replace(
      pattern,
      ""
    );
  }

  return text
    .replace(/\s+/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
}

function getToolDescription(
  tool: ToolRecord
): string {
  const candidates = [
    tool.short_description,
    tool.description,
    tool.overview,
  ];

  for (
    const candidate of candidates
  ) {
    const cleaned =
      cleanGeneratedContent(
        candidate
      );

    if (cleaned) {
      return cleaned;
    }
  }

  return `Explore ${getToolName(
    tool
  )}, its capabilities, pricing, platforms and use cases.`;
}

function getToolCategory(
  tool: ToolRecord
): string {
  if (
    typeof tool.category === "string" &&
    tool.category.trim()
  ) {
    return tool.category.trim();
  }

  return "General AI";
}

/* =========================================================
   PRICING
========================================================= */

function normalizePricing(
  value: unknown
): string {
  if (
    typeof value !== "string"
  ) {
    return "Unknown";
  }

  const raw =
    value.trim();

  if (!raw) {
    return "Unknown";
  }

  const v =
    raw.toLowerCase();

  if (
    v.includes("freemium")
  ) {
    return "Freemium";
  }

  if (
    v === "free" ||
    v.includes("free plan") ||
    v.includes("free to use")
  ) {
    return "Free";
  }

  if (
    v.includes("free trial") ||
    v.includes("trial")
  ) {
    return "Free Trial";
  }

  if (
    v.includes("contact sales") ||
    v.includes("contact us")
  ) {
    return "Contact Sales";
  }

  if (
    v.includes("open source") ||
    v.includes("opensource")
  ) {
    return "Open Source";
  }

  if (
    v.includes("enterprise")
  ) {
    return "Enterprise";
  }

  if (
    v.includes("paid") ||
    v.includes("subscription")
  ) {
    return "Paid";
  }

  return raw;
}

function getToolPricing(
  tool: ToolRecord
): string {
  const model =
    typeof tool.pricing_model ===
    "string"
      ? tool.pricing_model.trim()
      : "";

  const pricing =
    typeof tool.pricing ===
    "string"
      ? tool.pricing.trim()
      : "";

  return normalizePricing(
    model || pricing
  );
}

/* =========================================================
   SCORE
========================================================= */

function getToolScore(
  tool: ToolRecord
): number {
  const raw =
    tool.ai_vault_score ??
    tool.score ??
    0;

  const value =
    Number(raw);

  if (
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value)
    )
  );
}

/* =========================================================
   LOGO
========================================================= */

function getToolLogo(
  tool: ToolRecord
): string | null {
  const candidates = [
    tool.logo_url,
    tool.logo,
    tool.image_url,
    tool.icon_url,
  ];

  for (
    const value of candidates
  ) {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return null;
}

/* =========================================================
   3D HERO
========================================================= */

function Vault3DHero({
  toolCount,
}: {
  toolCount?: number;
}) {
  const count =
    typeof toolCount === "number"
      ? toolCount
      : 0;

  const particles =
    useMemo(() => {
      return Array.from(
        {
          length: 42,
        },
        (_, index) => ({
          id: index,

          left:
            8 +
            ((index * 37) % 84),

          top:
            8 +
            ((index * 61) % 84),

          delay:
            (index % 9) * 0.35,

          duration:
            3.5 +
            (index % 6) * 0.7,

          size:
            2 +
            (index % 3),
        })
      );
    }, []);

  return (
    <>
      <style jsx>{`
        .vaultHero {
          position: relative;
          min-height: 620px;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 50% 46%,
              rgba(88, 80, 236, 0.28),
              rgba(12, 15, 38, 0.8) 30%,
              rgba(3, 5, 18, 1) 70%
            );
          isolation: isolate;
        }

        .vaultNoise {
          position: absolute;
          inset: 0;
          opacity: 0.16;
          background-image:
            linear-gradient(
              rgba(255, 255, 255, 0.035) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.035) 1px,
              transparent 1px
            );
          background-size: 48px 48px;
          mask-image:
            radial-gradient(
              circle at center,
              black,
              transparent 78%
            );
        }

        .vaultGlow {
          position: absolute;
          left: 50%;
          top: 48%;
          width: 520px;
          height: 520px;
          transform:
            translate(-50%, -50%);
          border-radius: 9999px;
          background:
            radial-gradient(
              circle,
              rgba(99, 102, 241, 0.25),
              rgba(79, 70, 229, 0.12) 35%,
              transparent 70%
            );
          filter: blur(20px);
          animation:
            vaultPulse 4s
            ease-in-out infinite;
        }

        .vaultStage {
          position: absolute;
          left: 50%;
          top: 48%;
          width: 440px;
          height: 440px;
          transform:
            translate(-50%, -50%)
            perspective(900px)
            rotateX(8deg);
          transform-style: preserve-3d;
        }

        .vaultCore {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 118px;
          height: 118px;
          transform:
            translate(-50%, -50%)
            translateZ(50px);
          transform-style: preserve-3d;
          border-radius: 50%;
          background:
            radial-gradient(
              circle at 35% 30%,
              #dbeafe 0%,
              #8b5cf6 15%,
              #4f46e5 35%,
              #1e1b4b 70%,
              #08091a 100%
            );
          border:
            1px solid
            rgba(147, 197, 253, 0.7);
          box-shadow:
            0 0 20px
              rgba(96, 165, 250, 0.9),
            0 0 70px
              rgba(99, 102, 241, 0.65),
            0 0 150px
              rgba(79, 70, 229, 0.38),
            inset -20px -25px 45px
              rgba(0, 0, 0, 0.55),
            inset 15px 15px 30px
              rgba(255, 255, 255, 0.25);
          animation:
            coreFloat 3.8s
            ease-in-out infinite;
        }

        .vaultCore::before {
          content: "";
          position: absolute;
          inset: 17px;
          border-radius: 50%;
          border:
            1px solid
            rgba(191, 219, 254, 0.7);
          box-shadow:
            0 0 30px
              rgba(129, 140, 248, 0.8),
            inset 0 0 22px
              rgba(255, 255, 255, 0.15);
        }

        .vaultCore::after {
          content: "";
          position: absolute;
          left: 23px;
          top: 18px;
          width: 30px;
          height: 20px;
          border-radius: 50%;
          background:
            rgba(255, 255, 255, 0.45);
          filter: blur(8px);
          transform: rotate(-25deg);
        }

        .ring {
          position: absolute;
          left: 50%;
          top: 50%;
          border-radius: 50%;
          border:
            1px solid
            rgba(129, 140, 248, 0.58);
          transform-style: preserve-3d;
          box-shadow:
            0 0 22px
              rgba(99, 102, 241, 0.22),
            inset 0 0 16px
              rgba(99, 102, 241, 0.08);
        }

        .ringOne {
          width: 190px;
          height: 190px;
          margin-left: -95px;
          margin-top: -95px;
          transform:
            rotateX(72deg)
            rotateZ(12deg)
            translateZ(12px);
          animation:
            ringOne 9s
            linear infinite;
        }

        .ringTwo {
          width: 270px;
          height: 270px;
          margin-left: -135px;
          margin-top: -135px;
          border-color:
            rgba(96, 165, 250, 0.42);
          transform:
            rotateX(68deg)
            rotateY(18deg)
            translateZ(-5px);
          animation:
            ringTwo 13s
            linear infinite;
        }

        .ringThree {
          width: 355px;
          height: 355px;
          margin-left: -177.5px;
          margin-top: -177.5px;
          border-color:
            rgba(167, 139, 250, 0.28);
          transform:
            rotateX(74deg)
            rotateY(-22deg);
          animation:
            ringThree 17s
            linear infinite;
        }

        .ringFour {
          width: 410px;
          height: 410px;
          margin-left: -205px;
          margin-top: -205px;
          border-color:
            rgba(59, 130, 246, 0.18);
          transform:
            rotateX(75deg)
            rotateY(30deg);
          animation:
            ringFour 22s
            linear infinite;
        }

        .energyArc {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 300px;
          height: 300px;
          margin-left: -150px;
          margin-top: -150px;
          border-radius: 50%;
          border-top:
            3px solid
            rgba(125, 211, 252, 0.9);
          border-right:
            3px solid transparent;
          border-bottom:
            3px solid
            rgba(139, 92, 246, 0.75);
          border-left:
            3px solid transparent;
          filter:
            drop-shadow(
              0 0 12px
              rgba(96, 165, 250, 0.8)
            );
          transform:
            rotateX(70deg)
            rotateZ(-25deg);
          animation:
            energySpin 5s
            linear infinite;
        }

        .energyArcTwo {
          width: 245px;
          height: 245px;
          margin-left: -122.5px;
          margin-top: -122.5px;
          border-top-color: transparent;
          border-right-color:
            rgba(167, 139, 250, 0.9);
          border-bottom-color: transparent;
          border-left-color:
            rgba(96, 165, 250, 0.7);
          animation-duration: 3.8s;
          animation-direction: reverse;
        }

        .particle {
          position: absolute;
          border-radius: 9999px;
          background: #93c5fd;
          box-shadow:
            0 0 8px
              rgba(96, 165, 250, 0.95),
            0 0 20px
              rgba(99, 102, 241, 0.7);
          animation:
            particleFloat
            var(--duration)
            ease-in-out
            infinite;
          animation-delay:
            var(--delay);
        }

        .heroContent {
          position: relative;
          z-index: 10;
          display: flex;
          min-height: 620px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding:
            100px 20px 70px;
          text-align: center;
          pointer-events: none;
        }

        .heroBadge {
          pointer-events: auto;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border:
            1px solid
            rgba(147, 197, 253, 0.18);
          border-radius: 9999px;
          background:
            rgba(15, 23, 42, 0.55);
          padding: 8px 13px;
          color: #bfdbfe;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          backdrop-filter: blur(14px);
          box-shadow:
            0 10px 40px
            rgba(0, 0, 0, 0.22);
        }

        .heroTitle {
          margin-top: 25px;
          max-width: 920px;
          font-size:
            clamp(38px, 7vw, 76px);
          line-height: 0.98;
          font-weight: 950;
          letter-spacing: -0.055em;
          color: white;
        }

        .heroTitle span {
          background:
            linear-gradient(
              90deg,
              #93c5fd,
              #a78bfa,
              #60a5fa,
              #c4b5fd
            );
          background-size: 220% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation:
            titleGradient 5s
            linear infinite;
        }

        .heroText {
          max-width: 650px;
          margin-top: 22px;
          color:
            rgba(203, 213, 225, 0.76);
          font-size: 14px;
          line-height: 1.8;
        }

        .heroStats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 28px;
          flex-wrap: wrap;
        }

        .heroStat {
          border:
            1px solid
            rgba(148, 163, 184, 0.16);
          background:
            rgba(15, 23, 42, 0.58);
          backdrop-filter: blur(16px);
          border-radius: 14px;
          padding: 9px 13px;
          color:
            rgba(226, 232, 240, 0.8);
          font-size: 10px;
          font-weight: 800;
        }

        .heroStat strong {
          color: white;
        }

        @keyframes vaultPulse {
          0%,
          100% {
            transform:
              translate(-50%, -50%)
              scale(0.94);
            opacity: 0.72;
          }

          50% {
            transform:
              translate(-50%, -50%)
              scale(1.08);
            opacity: 1;
          }
        }

        @keyframes coreFloat {
          0%,
          100% {
            transform:
              translate(-50%, -50%)
              translateZ(42px)
              scale(0.97);
          }

          50% {
            transform:
              translate(-50%, -50%)
              translateZ(70px)
              scale(1.04);
          }
        }

        @keyframes ringOne {
          from {
            transform:
              rotateX(72deg)
              rotateZ(12deg)
              translateZ(12px);
          }

          to {
            transform:
              rotateX(72deg)
              rotateZ(372deg)
              translateZ(12px);
          }
        }

        @keyframes ringTwo {
          from {
            transform:
              rotateX(68deg)
              rotateY(18deg)
              rotateZ(0deg)
              translateZ(-5px);
          }

          to {
            transform:
              rotateX(68deg)
              rotateY(18deg)
              rotateZ(-360deg)
              translateZ(-5px);
          }
        }

        @keyframes ringThree {
          from {
            transform:
              rotateX(74deg)
              rotateY(-22deg)
              rotateZ(0deg);
          }

          to {
            transform:
              rotateX(74deg)
              rotateY(-22deg)
              rotateZ(360deg);
          }
        }

        @keyframes ringFour {
          from {
            transform:
              rotateX(75deg)
              rotateY(30deg)
              rotateZ(0deg);
          }

          to {
            transform:
              rotateX(75deg)
              rotateY(30deg)
              rotateZ(-360deg);
          }
        }

        @keyframes energySpin {
          from {
            transform:
              rotateX(70deg)
              rotateZ(0deg);
          }

          to {
            transform:
              rotateX(70deg)
              rotateZ(360deg);
          }
        }

        @keyframes particleFloat {
          0%,
          100% {
            opacity: 0.18;
            transform:
              translate3d(0, 8px, 0)
              scale(0.7);
          }

          50% {
            opacity: 1;
            transform:
              translate3d(0, -12px, 0)
              scale(1.25);
          }
        }

        @keyframes titleGradient {
          from {
            background-position: 0% center;
          }

          to {
            background-position: 220% center;
          }
        }

        @media (max-width: 640px) {
          .vaultHero {
            min-height: 570px;
          }

          .heroContent {
            min-height: 570px;
            padding:
              85px 16px 50px;
          }

          .vaultStage {
            width: 330px;
            height: 330px;
            top: 45%;
          }

          .ringOne {
            width: 145px;
            height: 145px;
            margin-left: -72.5px;
            margin-top: -72.5px;
          }

          .ringTwo {
            width: 205px;
            height: 205px;
            margin-left: -102.5px;
            margin-top: -102.5px;
          }

          .ringThree {
            width: 270px;
            height: 270px;
            margin-left: -135px;
            margin-top: -135px;
          }

          .ringFour {
            width: 310px;
            height: 310px;
            margin-left: -155px;
            margin-top: -155px;
          }

          .energyArc {
            width: 225px;
            height: 225px;
            margin-left: -112.5px;
            margin-top: -112.5px;
          }

          .energyArcTwo {
            width: 185px;
            height: 185px;
            margin-left: -92.5px;
            margin-top: -92.5px;
          }

          .vaultCore {
            width: 92px;
            height: 92px;
          }

          .heroTitle {
            margin-top: 20px;
            font-size: 39px;
          }

          .heroText {
            font-size: 12px;
            max-width: 340px;
          }

          .heroStats {
            gap: 6px;
          }

          .heroStat {
            padding: 7px 9px;
            font-size: 9px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .vaultGlow,
          .vaultCore,
          .ring,
          .energyArc,
          .particle,
          .heroTitle span {
            animation: none !important;
          }
        }
      `}</style>

      <section
        className="vaultHero"
        aria-label="AI Vault hero"
      >
        <div className="vaultNoise" />

        <div className="vaultGlow" />

        {particles.map(
          (particle) => (
            <span
              key={particle.id}
              className="particle"
              style={
                {
                  left:
                    `${particle.left}%`,

                  top:
                    `${particle.top}%`,

                  width:
                    `${particle.size}px`,

                  height:
                    `${particle.size}px`,

                  "--delay":
                    `${particle.delay}s`,

                  "--duration":
                    `${particle.duration}s`,
                } as CSSProperties
              }
            />
          )
        )}

        <div className="vaultStage">
          <div className="ring ringFour" />

          <div className="ring ringThree" />

          <div className="ring ringTwo" />

          <div className="ring ringOne" />

          <div className="energyArc" />

          <div
            className="energyArc energyArcTwo"
          />

          <div className="vaultCore" />
        </div>

        <div className="heroContent">
          <div className="heroBadge">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />

            AI INTELLIGENCE VAULT
          </div>

          <h1 className="heroTitle">
            Discover the
            <br />

            <span>
              Right AI.
            </span>
          </h1>

          <p className="heroText">
            Search, compare and discover
            verified AI software from one
            intelligent directory. Explore
            tools for productivity, coding,
            creativity and more.
          </p>

          <div className="heroStats">
            <div className="heroStat">
              <strong>
                {count.toLocaleString()}
              </strong>{" "}
              AI TOOLS
            </div>

            <div className="heroStat">
              <strong>
                VERIFIED
              </strong>{" "}
              DIRECTORY
            </div>

            <div className="heroStat">
              <strong>
                AI VAULT
              </strong>{" "}
              SCORE
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* =========================================================
   TOOL CARD
========================================================= */

function ToolCard({
  tool,
  index,
}: {
  tool: ToolRecord;
  index: number;
}) {
  const href =
    getToolHref(tool);

  const name =
    getToolName(tool);

  const description =
    getToolDescription(tool);

  const category =
    getToolCategory(tool);

  const pricing =
    getToolPricing(tool);

  const logo =
    getToolLogo(tool);

  const score =
    getToolScore(tool);

  const cardKey =
    tool.id != null
      ? String(tool.id)
      : getCanonicalSlug(tool) ||
        `tool-${index}`;

  if (!href) {
    return (
      <article
        key={cardKey}
        className="
          flex h-full flex-col
          rounded-[25px]
          border border-slate-200
          bg-white
          p-6
          shadow-[0_12px_40px_rgba(15,23,42,0.05)]
        "
      >
        <div className="flex items-center gap-4">
          <div
            className="
              h-12 w-12 shrink-0
              overflow-hidden
              rounded-2xl
              border border-slate-200
              bg-slate-50
            "
          >
            <ToolLogo
              name={name}
              logoUrl={logo}
            />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-slate-950">
              {name}
            </h3>

            <p className="mt-1 text-xs font-semibold text-slate-400">
              {category}
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </article>
    );
  }

  return (
    <article
      key={cardKey}
      className="
        group relative flex h-full
        flex-col overflow-hidden
        rounded-[25px]
        border border-slate-200/90
        bg-white
        shadow-[0_10px_40px_rgba(15,23,42,0.045)]
        transition-all duration-300
        hover:-translate-y-1
        hover:border-blue-200
        hover:shadow-[0_25px_65px_rgba(37,99,235,0.11)]
      "
    >
      <Link
        href={href}
        onClick={() => {
          try {
            const slug =
              getCanonicalSlug(
                tool
              );

            if (!slug) {
              return;
            }

            trackToolClick(
              slug,
              name,
              category,
              index
            );
          } catch (error) {
            console.error(
              "[TRAFFIC_CLICK_ERR]",
              error
            );
          }
        }}
        className="
          flex h-full
          flex-col
          p-5
          sm:p-6
        "
      >
        {/* HEADER */}

        <div
          className="
            flex items-start
            justify-between
            gap-3
          "
        >
          <div
            className="
              flex min-w-0
              items-center
              gap-3
            "
          >
            <div
              className="
                h-12 w-12
                shrink-0
                overflow-hidden
                rounded-2xl
                border border-slate-200
                bg-slate-50
              "
            >
              <ToolLogo
                name={name}
                logoUrl={logo}
              />
            </div>

            <div className="min-w-0">
              <h3
                className="
                  truncate
                  text-[16px]
                  font-black
                  tracking-tight
                  text-slate-950
                "
              >
                {name}
              </h3>

              <p
                className="
                  mt-1
                  truncate
                  text-xs
                  font-semibold
                  text-slate-400
                "
              >
                {category}
              </p>
            </div>
          </div>

          <span
            className="
              shrink-0
              rounded-full
              border border-slate-200
              bg-slate-50
              px-2.5 py-1
              text-[9px]
              font-black
              text-slate-600
            "
          >
            {pricing}
          </span>
        </div>

        {/* DESCRIPTION */}

        <p
          className="
            mt-5
            line-clamp-3
            min-h-[72px]
            text-[13px]
            leading-6
            text-slate-500
          "
        >
          {description}
        </p>

        {/* SCORE */}

        <div className="mt-5">
          <div
            className="
              mb-2
              flex items-center
              justify-between
            "
          >
            <span
              className="
                text-[9px]
                font-black
                uppercase
                tracking-[0.16em]
                text-slate-400
              "
            >
              AI Vault Score
            </span>

            <span
              className="
                text-xs
                font-black
                text-blue-600
              "
            >
              {score}/100
            </span>
          </div>

          <div
            className="
              h-1.5
              overflow-hidden
              rounded-full
              bg-slate-100
            "
          >
            <div
              className="
                h-full
                rounded-full
                bg-gradient-to-r
                from-blue-500
                via-indigo-500
                to-violet-500
                transition-all
                duration-700
              "
              style={{
                width:
                  `${score}%`,
              }}
            />
          </div>
        </div>

        {/* FOOTER */}

        <div
          className="
            mt-5
            flex items-center
            justify-between
            border-t
            border-slate-100
            pt-4
          "
        >
          <span
            className="
              text-[9px]
              font-black
              uppercase
              tracking-[0.16em]
              text-slate-400
            "
          >
            Verified AI Tool
          </span>

          <span
            className="
              text-xs
              font-black
              text-blue-600
              transition-transform
              duration-200
              group-hover:translate-x-1
            "
          >
            Explore →
          </span>
        </div>
      </Link>

      {/* SCORE ACCENT */}

      <div
        className="
          absolute
          bottom-0 left-0 right-0
          h-[3px]
          bg-slate-100
        "
      >
        <div
          className="
            h-full
            rounded-r-full
            bg-gradient-to-r
            from-blue-500
            to-violet-500
          "
          style={{
            width:
              `${score}%`,
          }}
        />
      </div>
    </article>
  );
}

/* =========================================================
   HOME CONTENT
========================================================= */

function HomeContent() {
  const searchParams =
    useSearchParams();

  const [tools, setTools] =
    useState<ToolRecord[]>([]);

  const [totalCount, setTotalCount] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const initialQuery =
    searchParams
      .get("q")
      ?.trim() ?? "";

  const [localSearch, setLocalSearch] =
    useState(initialQuery);

  const impressionSent =
    useRef<Set<string>>(
      new Set()
    );

  /* =======================================================
     ACTIVE CATEGORY
  ======================================================= */

  const activeCat =
    searchParams
      .get("cat")
      ?.trim() || "All";

  const isAllCategory =
    activeCat.toLowerCase() ===
    "all";

  /* =======================================================
     SYNC URL SEARCH
  ======================================================= */

  useEffect(() => {
    const query =
      searchParams
        .get("q")
        ?.trim() ?? "";

    setLocalSearch(
      query
    );
  }, [searchParams]);

  /* =======================================================
     FETCH
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    async function fetchTools() {
      setLoading(true);

      setErrorMessage("");

      try {
        const supabase =
          getSupabase();

        /* -----------------------------------------------
           COUNT
        ------------------------------------------------ */

        let countBuilder =
          supabase
            .from("ai_tools")
            .select("id", {
              count: "exact",
              head: true,
            });

        if (
          !isAllCategory
        ) {
          countBuilder =
            countBuilder.ilike(
              "category",
              activeCat
            );
        }

        const countResult =
          await countBuilder;

        /* -----------------------------------------------
           DATA
        ------------------------------------------------ */

        let dataBuilder =
          supabase
            .from("ai_tools")
            .select("*")
            .order("name", {
              ascending: true,
              nullsFirst: false,
            });

        if (
          !isAllCategory
        ) {
          dataBuilder =
            dataBuilder.ilike(
              "category",
              activeCat
            );
        }

        const {
          data,
          error,
        } =
          await dataBuilder;

        if (error) {
          throw error;
        }

        const rawData =
          Array.isArray(data)
            ? (data as ToolRecord[])
            : [];

        /* -----------------------------------------------
           REMOVE DUPLICATES
        ------------------------------------------------ */

        const uniqueMap =
          new Map<
            string,
            ToolRecord
          >();

        rawData.forEach(
          (
            tool,
            index
          ) => {
            const slug =
              getCanonicalSlug(
                tool
              );

            let key: string;

            if (slug) {
              key =
                `slug:${slug}`;
            } else if (
              tool.id != null
            ) {
              key =
                `id:${String(
                  tool.id
                )}`;
            } else {
              key =
                `missing:${index}`;
            }

            if (
              !uniqueMap.has(
                key
              )
            ) {
              uniqueMap.set(
                key,
                tool
              );
            }
          }
        );

        const uniqueList =
          Array.from(
            uniqueMap.values()
          );

        if (
          cancelled
        ) {
          return;
        }

        setTools(
          uniqueList
        );

        if (
          !countResult.error &&
          typeof countResult.count ===
            "number"
        ) {
          setTotalCount(
            countResult.count
          );
        } else {
          setTotalCount(
            uniqueList.length
          );
        }
      } catch (error) {
        console.error(
          "[HOME_FETCH_ERR]",
          error
        );

        if (
          !cancelled
        ) {
          setTools(
            []
          );

          setTotalCount(
            0
          );

          setErrorMessage(
            "Unable to load the AI tool directory. Please try again."
          );
        }
      } finally {
        if (
          !cancelled
        ) {
          setLoading(
            false
          );
        }
      }
    }

    fetchTools();

    return () => {
      cancelled = true;
    };
  }, [
    activeCat,
    isAllCategory,
  ]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredTools =
    useMemo(() => {
      const term =
        localSearch
          .toLowerCase()
          .trim();

      if (!term) {
        return tools;
      }

      return tools.filter(
        (tool) => {
          const name =
            getToolName(
              tool
            ).toLowerCase();

          const description =
            getToolDescription(
              tool
            ).toLowerCase();

          const category =
            getToolCategory(
              tool
            ).toLowerCase();

          const slug =
            getCanonicalSlug(
              tool
            ).toLowerCase();

          return (
            name.includes(
              term
            ) ||
            description.includes(
              term
            ) ||
            category.includes(
              term
            ) ||
            slug.includes(
              term
            )
          );
        }
      );
    }, [
      tools,
      localSearch,
    ]);

  /* =======================================================
     IMPRESSIONS
  ======================================================= */

  useEffect(() => {
    if (loading) {
      return;
    }

    filteredTools.forEach(
      (
        tool,
        index
      ) => {
        const slug =
          getCanonicalSlug(
            tool
          );

        if (!slug) {
          return;
        }

        if (
          impressionSent.current.has(
            slug
          )
        ) {
          return;
        }

        impressionSent.current.add(
          slug
        );

        try {
          trackToolImpression(
            slug,
            getToolName(
              tool
            ),
            getToolCategory(
              tool
            ),
            index
          );
        } catch (error) {
          console.error(
            "[TRAFFIC_IMPRESSION_ERR]",
            error
          );
        }
      }
    );
  }, [
    filteredTools,
    loading,
  ]);

  /* =======================================================
     SCHEMA
  ======================================================= */

  const websiteSchema =
    useMemo(
      () => ({
        "@context":
          "https://schema.org",

        "@type":
          "WebSite",

        name:
          "AI Vault",

        url:
          SITE_URL,

        potentialAction: {
          "@type":
            "SearchAction",

          target: {
            "@type":
              "EntryPoint",

            urlTemplate:
              `${SITE_URL}/?q={search_term_string}`,
          },

          "query-input":
            "required name=search_term_string",
        },
      }),
      []
    );

  /* =======================================================
     CLEAR SEARCH
  ======================================================= */

  const clearSearch =
    () => {
      setLocalSearch("");

      const params =
        new URLSearchParams(
          searchParams.toString()
        );

      params.delete(
        "q"
      );

      const query =
        params.toString();

      window.history.replaceState(
        null,
        "",
        query
          ? `/?${query}`
          : "/"
      );
    };

  /* =======================================================
     CATEGORY URL
  ======================================================= */

  const categoryHref =
    (
      category: string
    ) => {
      if (
        category === "All"
      ) {
        return "/";
      }

      const params =
        new URLSearchParams();

      params.set(
        "cat",
        category
      );

      if (
        localSearch.trim()
      ) {
        params.set(
          "q",
          localSearch.trim()
        );
      }

      return `/?${params.toString()}`;
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              websiteSchema
            ),
        }}
      />

      <main
        className="
          min-h-screen
          bg-[#f8faff]
          text-slate-950
        "
      >

        {/* =================================================
            NAVBAR
        ================================================= */}

        <nav
          className="
            sticky top-0 z-50
            border-b
            border-slate-200/80
            bg-white/90
            backdrop-blur-2xl
          "
        >
          <div
            className="
              mx-auto
              flex
              h-[68px]
              max-w-7xl
              items-center
              justify-between
              px-4
              sm:px-6
            "
          >
            <Link
              href="/"
              className="
                text-xl
                font-black
                tracking-[-0.05em]
                text-slate-950
              "
            >
              AI Vault
              <span className="text-blue-600">
                .
              </span>
            </Link>

            <div
              className="
                hidden
                items-center
                gap-6
                md:flex
              "
            >
              {categories
                .slice(0, 5)
                .map(
                  (
                    category
                  ) => {
                    const active =
                      activeCat.toLowerCase() ===
                      category.name.toLowerCase();

                    return (
                      <Link
                        key={
                          category.name
                        }
                        href={categoryHref(
                          category.name
                        )}
                        className={`
                          text-xs
                          font-bold
                          transition
                          ${
                            active
                              ? "text-blue-600"
                              : "text-slate-500 hover:text-blue-600"
                          }
                        `}
                      >
                        {
                          category.name
                        }
                      </Link>
                    );
                  }
                )}
            </div>

            <div
              className="
                rounded-full
                bg-gradient-to-r
                from-blue-600
                to-indigo-600
                px-4 py-2
                text-[10px]
                font-black
                text-white
                shadow-lg
                shadow-blue-500/20
              "
            >
              {totalCount.toLocaleString()}
            </div>
          </div>
        </nav>

        {/* =================================================
            HERO
        ================================================= */}

        <Vault3DHero
          toolCount={
            totalCount
          }
        />

        {/* =================================================
            SEARCH
        ================================================= */}

        <section
          className="
            relative z-20
            -mt-8
            px-4
          "
        >
          <div
            className="
              mx-auto
              max-w-4xl
              rounded-[28px]
              border
              border-white/80
              bg-white/95
              p-3
              shadow-[0_25px_80px_rgba(15,23,42,0.12)]
              backdrop-blur-xl
            "
          >
            <div
              className="relative"
            >
              <input
                type="text"
                value={
                  localSearch
                }
                onChange={(
                  event
                ) => {
                  setLocalSearch(
                    event.target.value
                  );
                }}
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Escape"
                  ) {
                    clearSearch();
                  }
                }}
                placeholder={
                  totalCount
                    ? `Search ${totalCount.toLocaleString()}+ AI tools...`
                    : "Search AI tools..."
                }
                aria-label="Search AI tools"
                className="
                  h-14
                  w-full
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50/80
                  px-5
                  pr-14
                  text-sm
                  font-semibold
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:bg-white
                  focus:ring-4
                  focus:ring-blue-100
                "
              />

              {localSearch && (
                <button
                  type="button"
                  onClick={
                    clearSearch
                  }
                  aria-label="Clear search"
                  className="
                    absolute
                    right-4
                    top-1/2
                    flex
                    h-8 w-8
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-full
                    bg-slate-200
                    text-slate-700
                    transition
                    hover:bg-slate-300
                  "
                >
                  ×
                </button>
              )}

              {!localSearch && (
                <div
                  className="
                    pointer-events-none
                    absolute
                    right-5
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                >
                  <svg
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                    />

                    <path
                      d="m20 20-4-4"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* CATEGORY PILLS */}

            <div
              className="
                mt-3
                flex
                gap-2
                overflow-x-auto
                pb-1
                scrollbar-none
              "
            >
              {categories.map(
                (
                  category
                ) => {
                  const active =
                    activeCat.toLowerCase() ===
                    category.name.toLowerCase();

                  return (
                    <Link
                      key={
                        category.name
                      }
                      href={categoryHref(
                        category.name
                      )}
                      className={`
                        flex
                        shrink-0
                        items-center
                        gap-2
                        rounded-full
                        border
                        px-4 py-2
                        text-xs
                        font-bold
                        transition
                        ${
                          active
                            ? "border-slate-950 bg-slate-950 text-white shadow-lg"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
                        }
                      `}
                    >
                      <span>
                        {
                          category.icon
                        }
                      </span>

                      {
                        category.name
                      }
                    </Link>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* =================================================
            DIRECTORY
        ================================================= */}

        <section
          className="
            mx-auto
            max-w-7xl
            px-4
            py-14
            sm:px-6
          "
        >
          <div
            className="
              mb-7
              flex
              flex-wrap
              items-end
              justify-between
              gap-4
            "
          >
            <div>
              <div
                className="
                  mb-2
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.2em]
                  text-blue-600
                "
              >
                AI DISCOVERY ENGINE
              </div>

              <h2
                className="
                  text-2xl
                  font-black
                  tracking-tight
                  text-slate-950
                  sm:text-3xl
                "
              >
                {isAllCategory
                  ? "Verified AI Directory"
                  : `${activeCat} AI Tools`}

                <span
                  className="
                    ml-2
                    text-blue-600
                  "
                >
                  (
                  {
                    filteredTools.length.toLocaleString()
                  }
                  )
                </span>
              </h2>

              {localSearch && (
                <p
                  className="
                    mt-2
                    text-xs
                    font-semibold
                    text-slate-400
                  "
                >
                  Showing results for "
                  {localSearch}"
                </p>
              )}
            </div>

            {localSearch && (
              <button
                type="button"
                onClick={
                  clearSearch
                }
                className="
                  rounded-full
                  border
                  border-slate-200
                  bg-white
                  px-4 py-2
                  text-xs
                  font-bold
                  text-slate-600
                  shadow-sm
                  transition
                  hover:border-blue-300
                  hover:text-blue-600
                "
              >
                Clear Search
              </button>
            )}
          </div>

          {/* ERROR */}

          {errorMessage ? (
            <div
              className="
                rounded-[30px]
                border
                border-red-100
                bg-white
                px-6
                py-20
                text-center
                shadow-sm
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-16 w-16
                  items-center
                  justify-center
                  rounded-2xl
                  bg-red-50
                  text-xl
                  font-black
                  text-red-500
                "
              >
                !
              </div>

              <h3
                className="
                  mt-5
                  text-xl
                  font-black
                  text-slate-950
                "
              >
                Directory unavailable
              </h3>

              <p
                className="
                  mx-auto
                  mt-2
                  max-w-md
                  text-sm
                  leading-6
                  text-slate-500
                "
              >
                {errorMessage}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="
                  mt-6
                  rounded-xl
                  bg-slate-950
                  px-6 py-3
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:bg-blue-600
                "
              >
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div
              className="
                py-24
                text-center
              "
            >
              <div
                className="
                  mx-auto
                  h-12 w-12
                  animate-spin
                  rounded-full
                  border-4
                  border-slate-200
                  border-t-blue-600
                "
              />

              <p
                className="
                  mt-5
                  text-sm
                  font-bold
                  text-slate-500
                "
              >
                Loading Intelligence Vault...
              </p>
            </div>
          ) : filteredTools.length ===
            0 ? (
            <div
              className="
                rounded-[30px]
                border
                border-slate-200
                bg-white
                px-6
                py-20
                text-center
                shadow-sm
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-16 w-16
                  items-center
                  justify-center
                  rounded-2xl
                  bg-slate-100
                  text-2xl
                "
              >
                🔎
              </div>

              <h3
                className="
                  mt-5
                  text-xl
                  font-black
                  text-slate-950
                "
              >
                No AI tools found
              </h3>

              <p
                className="
                  mx-auto
                  mt-2
                  max-w-md
                  text-sm
                  leading-6
                  text-slate-500
                "
              >
                Try another search term
                or choose another category.
              </p>

              <button
                type="button"
                onClick={
                  clearSearch
                }
                className="
                  mt-6
                  rounded-xl
                  bg-slate-950
                  px-6 py-3
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:bg-blue-600
                "
              >
                View All Tools
              </button>
            </div>
          ) : (
            <div
              className="
                grid
                grid-cols-1
                gap-6
                md:grid-cols-2
                xl:grid-cols-3
              "
            >
              {filteredTools.map(
                (
                  tool,
                  index
                ) => (
                  <ToolCard
                    key={
                      tool.id != null
                        ? String(
                            tool.id
                          )
                        : getCanonicalSlug(
                            tool
                          ) ||
                          `tool-${index}`
                    }
                    tool={
                      tool
                    }
                    index={
                      index
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* =================================================
            FINAL CTA — MUST REMAIN LAST
        ================================================= */}

        <section
          className="
            mx-auto
            max-w-7xl
            px-4
            pb-16
            sm:px-6
          "
        >
          <div
            className="
              relative
              overflow-hidden
              rounded-[36px]
              bg-[#050714]
              px-6
              py-16
              text-center
              text-white
              shadow-[0_30px_100px_rgba(15,23,42,0.15)]
              sm:px-10
            "
          >
            {/* Glow */}

            <div
              className="
                absolute
                left-1/2
                top-0
                h-64 w-64
                -translate-x-1/2
                -translate-y-1/2
                rounded-full
                bg-blue-600/20
                blur-[100px]
              "
            />

            <div
              className="
                absolute
                bottom-0
                left-1/4
                h-40 w-40
                rounded-full
                bg-violet-600/10
                blur-[80px]
              "
            />

            {/* Grid */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                opacity-[0.035]
                [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)]
                [background-size:38px_38px]
              "
            />

            <div
              className="
                relative
                z-10
              "
            >
              <div
                className="
                  mb-4
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.25em]
                  text-blue-300
                "
              >
                THE INTELLIGENCE VAULT
              </div>

              <h2
                className="
                  text-4xl
                  font-black
                  tracking-[-0.045em]
                  text-white
                  sm:text-6xl
                "
              >
                Find the right AI.
              </h2>

              <p
                className="
                  mx-auto
                  mt-4
                  max-w-xl
                  text-sm
                  leading-7
                  text-slate-400
                  sm:text-base
                "
              >
                Search, compare and discover
                the next generation of AI
                software from one intelligent
                directory.
              </p>

              {/* IMPORTANT:
                  Explicit white background + black text
                  so button can NEVER appear blank. */}

              <Link
                href="/ai-finder"
                className="
                  mt-8
                  inline-flex
                  min-h-[52px]
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  bg-white
                  px-7
                  py-3.5
                  text-sm
                  font-black
                  text-slate-950
                  shadow-xl
                  shadow-black/20
                  transition
                  hover:-translate-y-1
                  hover:bg-slate-100
                "
              >
                <span className="text-slate-950">
                  Find My AI Tool
                </span>

                <span
                  aria-hidden="true"
                  className="text-slate-950"
                >
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer
          className="
            border-t
            border-slate-200
            bg-white
          "
        >
          <div
            className="
              mx-auto
              flex
              max-w-7xl
              flex-col
              gap-4
              px-4
              py-8
              text-xs
              text-slate-500
              sm:px-6
              md:flex-row
              md:items-center
              md:justify-between
            "
          >
            <p>
              ©{" "}
              {new Date().getFullYear()}{" "}
              AI Vault. All rights reserved.
            </p>

            <div
              className="
                flex
                flex-wrap
                gap-5
              "
            >
              <Link
                href="/"
                className="
                  transition
                  hover:text-blue-600
                "
              >
                AI Tools
              </Link>

              <Link
                href="/ai-finder"
                className="
                  transition
                  hover:text-blue-600
                "
              >
                AI Finder
              </Link>

              <Link
                href="/compare"
                className="
                  transition
                  hover:text-blue-600
                "
              >
                Compare
              </Link>

              <Link
                href="/saved"
                className="
                  transition
                  hover:text-blue-600
                "
              >
                Saved
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main
          className="
            flex
            min-h-screen
            items-center
            justify-center
            bg-[#050714]
          "
        >
          <div className="text-center">
            <div
              className="
                mx-auto
                h-12 w-12
                animate-spin
                rounded-full
                border-4
                border-white/10
                border-t-blue-500
              "
            />

            <p
              className="
                mt-5
                text-sm
                font-bold
                text-slate-400
              "
            >
              Loading AI Vault...
            </p>
          </div>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
