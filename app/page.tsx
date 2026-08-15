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

import ToolLogo from "@/components/ToolLogo";
import Vault3DCard from "@/components/Vault3DCard";

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
  [key: string]: unknown;
};

/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const getSupabase = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  return createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
};

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

const getCanonicalSlug = (
  tool: ToolRecord
): string => {
  if (typeof tool.slug !== "string") {
    return "";
  }

  return tool.slug.trim();
};

const getToolHref = (
  tool: ToolRecord
): string | null => {
  const slug = getCanonicalSlug(tool);

  if (!slug) {
    return null;
  }

  return `/tool/${encodeURIComponent(slug)}`;
};

const getToolName = (
  tool: ToolRecord
): string => {
  if (
    typeof tool.name === "string" &&
    tool.name.trim()
  ) {
    return tool.name.trim();
  }

  return "AI Tool";
};

const cleanGeneratedContent = (
  value: unknown
): string => {
  if (typeof value !== "string") {
    return "";
  }

  let text = value.trim();

  if (!text) {
    return "";
  }

  const patterns = [
    /As a Senior SEO & AI Analyst for Visora AI,?\s*/gi,
    /As a Senior SEO and AI Analyst for Visora AI,?\s*/gi,
    /In this professional review,?\s*/gi,
    /Our professional review aims to provide an in-depth analysis of the tool,?\s*/gi,
  ];

  for (const pattern of patterns) {
    text = text.replace(pattern, "");
  }

  return text
    .replace(/\s{2,}/g, " ")
    .trim();
};

const getToolDescription = (
  tool: ToolRecord
): string => {
  const candidates = [
    tool.description,
    tool.short_description,
    tool.overview,
  ];

  for (const candidate of candidates) {
    const cleaned =
      cleanGeneratedContent(candidate);

    if (cleaned) {
      return cleaned;
    }
  }

  return "Description not specified.";
};

const getToolCategory = (
  tool: ToolRecord
): string => {
  if (
    typeof tool.category === "string" &&
    tool.category.trim()
  ) {
    return tool.category.trim();
  }

  return "General AI";
};

/* =========================================================
   PRICING
========================================================= */

const normalizePricing = (
  value: unknown
): string => {
  if (typeof value !== "string") {
    return "Unknown";
  }

  const raw = value.trim();

  if (!raw) {
    return "Unknown";
  }

  const v = raw.toLowerCase();

  if (v.includes("freemium")) {
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

  if (v.includes("enterprise")) {
    return "Enterprise";
  }

  if (
    v.includes("paid") ||
    v.includes("subscription")
  ) {
    return "Paid";
  }

  return raw;
};

const getToolPricing = (
  tool: ToolRecord
): string => {
  const model =
    typeof tool.pricing_model === "string"
      ? tool.pricing_model.trim()
      : "";

  const pricing =
    typeof tool.pricing === "string"
      ? tool.pricing.trim()
      : "";

  return normalizePricing(
    model || pricing
  );
};

/* =========================================================
   SCORE
========================================================= */

const getToolScore = (
  tool: ToolRecord
): number => {
  const raw =
    tool.ai_vault_score ??
    tool.score;

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value)
    )
  );
};

/* =========================================================
   LOGO
========================================================= */

const getToolLogo = (
  tool: ToolRecord
): string | null => {
  const candidates = [
    tool.logo_url,
    tool.logo,
    tool.image_url,
    tool.icon_url,
  ];

  for (const value of candidates) {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return null;
};

/* =========================================================
   CSS 3D HERO
   Production-safe:
   - No WebGL
   - No Canvas
   - No Three runtime
   - No external assets
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

  const particles = useMemo(() => {
    return Array.from(
      { length: 42 },
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
              rgba(255,255,255,0.035) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,0.035) 1px,
              transparent 1px
            );
          background-size: 48px 48px;
          mask-image: radial-gradient(
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
          transform: translate(-50%, -50%);
          border-radius: 9999px;
          background:
            radial-gradient(
              circle,
              rgba(99,102,241,0.25),
              rgba(79,70,229,0.12) 35%,
              transparent 70%
            );
          filter: blur(20px);
          animation: vaultPulse 4s ease-in-out infinite;
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
          border: 1px solid rgba(147,197,253,0.7);
          box-shadow:
            0 0 20px rgba(96,165,250,0.9),
            0 0 70px rgba(99,102,241,0.65),
            0 0 150px rgba(79,70,229,0.38),
            inset -20px -25px 45px rgba(0,0,0,0.55),
            inset 15px 15px 30px rgba(255,255,255,0.25);
          animation: coreFloat 3.8s ease-in-out infinite;
        }

        .vaultCore::before {
          content: "";
          position: absolute;
          inset: 17px;
          border-radius: 50%;
          border: 1px solid rgba(191,219,254,0.7);
          box-shadow:
            0 0 30px rgba(129,140,248,0.8),
            inset 0 0 22px rgba(255,255,255,0.15);
        }

        .vaultCore::after {
          content: "";
          position: absolute;
          left: 23px;
          top: 18px;
          width: 30px;
          height: 20px;
          border-radius: 50%;
          background: rgba(255,255,255,0.45);
          filter: blur(8px);
          transform: rotate(-25deg);
        }

        .ring {
          position: absolute;
          left: 50%;
          top: 50%;
          border-radius: 50%;
          border: 1px solid rgba(129,140,248,0.58);
          transform-style: preserve-3d;
          box-shadow:
            0 0 22px rgba(99,102,241,0.22),
            inset 0 0 16px rgba(99,102,241,0.08);
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
            ringOne 9s linear infinite;
        }

        .ringTwo {
          width: 270px;
          height: 270px;
          margin-left: -135px;
          margin-top: -135px;
          border-color: rgba(96,165,250,0.42);
          transform:
            rotateX(68deg)
            rotateY(18deg)
            translateZ(-5px);
          animation:
            ringTwo 13s linear infinite;
        }

        .ringThree {
          width: 355px;
          height: 355px;
          margin-left: -177.5px;
          margin-top: -177.5px;
          border-color: rgba(167,139,250,0.28);
          transform:
            rotateX(74deg)
            rotateY(-22deg);
          animation:
            ringThree 17s linear infinite;
        }

        .ringFour {
          width: 410px;
          height: 410px;
          margin-left: -205px;
          margin-top: -205px;
          border-color: rgba(59,130,246,0.18);
          transform:
            rotateX(75deg)
            rotateY(30deg);
          animation:
            ringFour 22s linear infinite;
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
          border-top: 3px solid rgba(125,211,252,0.9);
          border-right: 3px solid transparent;
          border-bottom: 3px solid rgba(139,92,246,0.75);
          border-left: 3px solid transparent;
          filter: drop-shadow(
            0 0 12px rgba(96,165,250,0.8)
          );
          transform:
            rotateX(70deg)
            rotateZ(-25deg);
          animation:
            energySpin 5s linear infinite;
        }

        .energyArcTwo {
          width: 245px;
          height: 245px;
          margin-left: -122.5px;
          margin-top: -122.5px;
          border-top-color: transparent;
          border-right-color: rgba(167,139,250,0.9);
          border-bottom-color: transparent;
          border-left-color: rgba(96,165,250,0.7);
          animation-duration: 3.8s;
          animation-direction: reverse;
        }

        .particle {
          position: absolute;
          border-radius: 9999px;
          background: #93c5fd;
          box-shadow:
            0 0 8px rgba(96,165,250,0.95),
            0 0 20px rgba(99,102,241,0.7);
          animation:
            particleFloat
            var(--duration)
            ease-in-out
            infinite;
          animation-delay: var(--delay);
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
            100px 20px
            70px;
          text-align: center;
          pointer-events: none;
        }

        .heroBadge {
          pointer-events: auto;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(147,197,253,0.18);
          border-radius: 9999px;
          background: rgba(15,23,42,0.55);
          padding: 8px 13px;
          color: #bfdbfe;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          backdrop-filter: blur(14px);
          box-shadow:
            0 10px 40px rgba(0,0,0,0.22);
        }

        .heroTitle {
          margin-top: 25px;
          max-width: 920px;
          font-size: clamp(
            38px,
            7vw,
            76px
          );
          line-height: 0.98;
          font-weight: 950;
          letter-spacing: -0.055em;
          color: white;
          text-shadow:
            0 0 30px rgba(99,102,241,0.2);
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
            titleGradient
            5s linear infinite;
        }

        .heroText {
          max-width: 650px;
          margin-top: 22px;
          color: rgba(203,213,225,0.76);
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
            rgba(148,163,184,0.16);
          background:
            rgba(15,23,42,0.58);
          backdrop-filter: blur(16px);
          border-radius: 14px;
          padding: 9px 13px;
          color: rgba(226,232,240,0.8);
          font-size: 10px;
          font-weight: 800;
        }

        .heroStat strong {
          color: white;
        }

        @keyframes vaultPulse {
          0%, 100% {
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
          0%, 100% {
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
          0%, 100% {
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
              85px 16px
              50px;
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

      <section className="vaultHero">
        <div className="vaultNoise" />
        <div className="vaultGlow" />

        {particles.map((particle) => (
          <span
            key={particle.id}
            className="particle"
            style={
              {
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                "--delay": `${particle.delay}s`,
                "--duration": `${particle.duration}s`,
              } as React.CSSProperties
            }
          />
        ))}

        <div className="vaultStage">
          <div className="ring ringFour" />
          <div className="ring ringThree" />
          <div className="ring ringTwo" />
          <div className="ring ringOne" />

          <div className="energyArc" />
          <div className="energyArc energyArcTwo" />

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
            <span>Right AI.</span>
          </h1>

          <p className="heroText">
            Search, compare and discover verified AI
            software from one intelligent directory.
            Explore tools for productivity, coding,
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
              <strong>VERIFIED</strong>{" "}
              DIRECTORY
            </div>

            <div className="heroStat">
              <strong>AI VAULT</strong>{" "}
              SCORE
            </div>
          </div>
        </div>
      </section>
    </>
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

  const [localSearch, setLocalSearch] =
    useState("");

  const impressionSent =
    useRef<Set<string>>(new Set());

  /* =======================================================
     CATEGORY
  ======================================================= */

  const activeCat =
    searchParams
      .get("cat")
      ?.trim() || "ALL";

  const isAllCategory =
    activeCat.toLowerCase() ===
    "all";

  /* =======================================================
     FETCH TOOLS
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function fetchTools() {
      setLoading(true);
      setErrorMessage("");

      try {
        const supabase =
          getSupabase();

        let countQuery =
          supabase
            .from("ai_tools")
            .select("id", {
              count: "exact",
              head: true,
            });

        if (!isAllCategory) {
          countQuery =
            countQuery.ilike(
              "category",
              activeCat
            );
        }

        const countResult =
          await countQuery;

        let query =
          supabase
            .from("ai_tools")
            .select("*")
            .order("name", {
              ascending: true,
              nullsFirst: false,
            });

        if (!isAllCategory) {
          query =
            query.ilike(
              "category",
              activeCat
            );
        }

        const {
          data,
          error,
        } = await query;

        if (error) {
          throw error;
        }

        const rawData =
          Array.isArray(data)
            ? (data as ToolRecord[])
            : [];

        const uniqueMap =
          new Map<
            string,
            ToolRecord
          >();

        rawData.forEach(
          (tool, index) => {
            const slug =
              getCanonicalSlug(tool);

            const key = slug
              ? `slug:${slug}`
              : tool.id != null
                ? `id:${String(
                    tool.id
                  )}`
                : `missing:${index}`;

            if (!uniqueMap.has(key)) {
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

        if (cancelled) {
          return;
        }

        setTools(uniqueList);

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

        if (!cancelled) {
          setTools([]);
          setTotalCount(0);

          setErrorMessage(
            "Unable to load the AI tool directory. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
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
     SEARCH
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
            name.includes(term) ||
            description.includes(term) ||
            category.includes(term) ||
            slug.includes(term)
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
      (tool, index) => {
        const slug =
          getCanonicalSlug(tool);

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
            getToolName(tool),
            getToolCategory(tool),
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

  const totalDisplay =
    totalCount;

  /* =======================================================
     WEBSITE SCHEMA
  ======================================================= */

  const websiteSchema = {
    "@context":
      "https://schema.org",

    "@type": "WebSite",

    name: "AI Vault",

    url: SITE_URL,

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
  };

  /* =======================================================
     VIEW ALL
  ======================================================= */

  const handleViewAll = () => {
    setLocalSearch("");

    window.history.replaceState(
      null,
      "",
      "/"
    );

    window.location.reload();
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

      <main className="min-h-screen bg-[#f8faff] text-slate-950">

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-2xl">
          <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">

            <Link
              href="/"
              className="group flex items-center gap-2"
            >
              <span className="text-xl font-black tracking-[-0.04em]">
                AI Vault
                <span className="text-blue-600">
                  .
                </span>
              </span>
            </Link>

            <div className="hidden items-center gap-6 md:flex">
              {categories
                .slice(0, 5)
                .map(
                  (category) => {
                    const active =
                      activeCat.toLowerCase() ===
                      category.name.toLowerCase();

                    return (
                      <Link
                        key={
                          category.name
                        }
                        href={
                          category.name ===
                          "All"
                            ? "/"
                            : `/?cat=${encodeURIComponent(
                                category.name
                              )}`
                        }
                        className={`text-sm font-semibold transition ${
                          active
                            ? "text-blue-600"
                            : "text-slate-500 hover:text-blue-600"
                        }`}
                      >
                        {
                          category.name
                        }
                      </Link>
                    );
                  }
                )}
            </div>

            <div className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-blue-500/20">
              {totalDisplay.toLocaleString()}
            </div>
          </div>
        </nav>

        {/* =================================================
            HERO
        ================================================= */}

        <Vault3DHero
          toolCount={
            totalDisplay
          }
        />

        {/* =================================================
            SEARCH
        ================================================= */}

        <section className="relative z-20 -mt-8 px-4">
          <div className="mx-auto max-w-4xl rounded-[28px] border border-white/80 bg-white/95 p-3 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">

            <div className="relative">
              <input
                type="text"
                value={
                  localSearch
                }
                onChange={(
                  event
                ) =>
                  setLocalSearch(
                    event.target.value
                  )
                }
                placeholder={
                  totalDisplay
                    ? `Search ${totalDisplay.toLocaleString()}+ AI tools...`
                    : "Search AI tools..."
                }
                aria-label="Search AI tools"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-5 pr-14 text-sm font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

              <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
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
                  <path d="m20 20-4-4" />
                </svg>
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {categories.map(
                (category) => {
                  const active =
                    activeCat.toLowerCase() ===
                    category.name.toLowerCase();

                  return (
                    <Link
                      key={
                        category.name
                      }
                      href={
                        category.name ===
                        "All"
                          ? "/"
                          : `/?cat=${encodeURIComponent(
                              category.name
                            )}`
                      }
                      className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition ${
                        active
                          ? "border-slate-950 bg-slate-950 text-white shadow-lg"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
                      }`}
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

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">

          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                AI DISCOVERY ENGINE
              </div>

              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                {isAllCategory
                  ? "Verified AI Directory"
                  : `${activeCat} AI Tools`}

                <span className="ml-2 text-blue-600">
                  (
                  {totalDisplay.toLocaleString()}
                  )
                </span>
              </h2>
            </div>

            {localSearch && (
              <button
                type="button"
                onClick={() =>
                  setLocalSearch("")
                }
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-600"
              >
                Clear search
              </button>
            )}
          </div>

          {/* ERROR */}

          {errorMessage ? (
            <div className="rounded-[30px] border border-red-100 bg-white px-6 py-20 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-red-500">
                !
              </div>

              <h3 className="mt-5 text-xl font-black">
                Directory unavailable
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {errorMessage}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white"
              >
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="py-24 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-5 text-sm font-bold text-slate-500">
                Loading Intelligence Vault...
              </p>
            </div>
          ) : filteredTools.length ===
            0 ? (
            <div className="rounded-[30px] border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                🔎
              </div>

              <h3 className="mt-5 text-xl font-black">
                No AI tools found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Try another search term or choose another category.
              </p>

              <button
                type="button"
                onClick={
                  handleViewAll
                }
                className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white"
              >
                View All Tools
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

              {filteredTools.map(
                (
                  tool,
                  index
                ) => {
                  const href =
                    getToolHref(
                      tool
                    );

                  const name =
                    getToolName(
                      tool
                    );

                  const description =
                    getToolDescription(
                      tool
                    );

                  const category =
                    getToolCategory(
                      tool
                    );

                  const pricing =
                    getToolPricing(
                      tool
                    );

                  const logoUrl =
                    getToolLogo(
                      tool
                    );

                  const score =
                    getToolScore(
                      tool
                    );

                  if (!href) {
                    return (
                      <Vault3DCard
                        key={
                          tool.id !=
                          null
                            ? String(
                                tool.id
                              )
                            : `missing-${index}`
                        }
                      >
                        <div className="p-6">

                          <div className="flex items-center gap-4">
                            <ToolLogo
                              src={
                                logoUrl
                              }
                              fallbackSrc={
                                typeof tool.logo ===
                                "string"
                                  ? tool.logo
                                  : null
                              }
                              name={
                                name
                              }
                              size="md"
                            />

                            <div>
                              <h3 className="font-black">
                                {
                                  name
                                }
                              </h3>

                              <p className="text-xs text-slate-500">
                                {
                                  category
                                }
                              </p>
                            </div>
                          </div>

                          <p className="mt-5 text-sm text-slate-500">
                            Canonical database URL unavailable.
                          </p>
                        </div>
                      </Vault3DCard>
                    );
                  }

                  return (
                    <Vault3DCard
                      key={
                        tool.id !=
                        null
                          ? String(
                              tool.id
                            )
                          : getCanonicalSlug(
                              tool
                            )
                      }
                    >
                      <Link
                        href={
                          href
                        }
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
                          } catch (
                            error
                          ) {
                            console.error(
                              "[TRAFFIC_CLICK_ERR]",
                              error
                            );
                          }
                        }}
                        className="group block h-full p-6"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex min-w-0 items-center gap-4">

                            <div className="relative">
                              <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-lg opacity-0 transition group-hover:opacity-100" />

                              <ToolLogo
                                src={
                                  logoUrl
                                }
                                fallbackSrc={
                                  typeof tool.logo ===
                                  "string"
                                    ? tool.logo
                                    : null
                                }
                                name={
                                  name
                                }
                                size="md"
                              />
                            </div>

                            <div className="min-w-0">
                              <h3 className="truncate text-base font-black text-slate-950">
                                {
                                  name
                                }
                              </h3>

                              <p className="mt-1 truncate text-xs font-semibold text-slate-400">
                                {
                                  category
                                }
                              </p>
                            </div>
                          </div>

                          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black text-slate-600">
                            {
                              pricing
                            }
                          </span>
                        </div>

                        <p className="mt-5 line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-500">
                          {
                            description
                          }
                        </p>

                        <div className="mt-5">

                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                              AI Vault Score
                            </span>

                            <span className="text-xs font-black text-blue-600">
                              {
                                score
                              }
                              /100
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-700"
                              style={{
                                width: `${score}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                            Verified AI Tool
                          </span>

                          <span className="text-sm font-black text-blue-600 transition group-hover:translate-x-1">
                            Explore →
                          </span>
                        </div>

                      </Link>
                    </Vault3DCard>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* =================================================
            PREMIUM CTA
        ================================================= */}

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">

          <div className="relative overflow-hidden rounded-[36px] bg-[#050714] px-6 py-16 text-center text-white shadow-[0_30px_100px_rgba(15,23,42,0.15)] sm:px-10">

            <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[100px]" />

            <div className="relative">

              <div className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-blue-300">
                THE INTELLIGENCE VAULT
              </div>

              <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
                Find the right AI.
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                Search, compare and discover the next generation of AI software from one intelligent directory.
              </p>

              <Link
                href="/ai-finder"
                className="mt-8 inline-flex rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-1"
              >
                Find My AI Tool →
              </Link>
            </div>
          </div>
        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="border-t border-slate-200 bg-white">

          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">

            <p>
              ©{" "}
              {new Date().getFullYear()}{" "}
              AI Vault. All rights reserved.
            </p>

            <div className="flex flex-wrap gap-5">

              <Link
                href="/"
                className="hover:text-blue-600"
              >
                AI Tools
              </Link>

              <Link
                href="/ai-finder"
                className="hover:text-blue-600"
              >
                AI Finder
              </Link>

              <Link
                href="/compare"
                className="hover:text-blue-600"
              >
                Compare
              </Link>

              <Link
                href="/saved"
                className="hover:text-blue-600"
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
        <main className="flex min-h-screen items-center justify-center bg-[#050714]">

          <div className="text-center">

            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-blue-500" />

            <p className="mt-5 text-sm font-bold text-slate-400">
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
