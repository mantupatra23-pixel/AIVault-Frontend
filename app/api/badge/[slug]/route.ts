import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug || "").trim().toLowerCase();

  let toolName = "AI Tool";
  let score = 95;

  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("ai_tools")
      .select("name, score, ai_vault_score, neural_score")
      .eq("slug", cleanSlug)
      .maybeSingle();

    if (data) {
      toolName = data.name || cleanSlug.toUpperCase();
      const rawScore = data.ai_vault_score ?? data.neural_score ?? data.score;
      if (rawScore) {
        score = Math.round(Number(rawScore));
      }
    } else {
      toolName = cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1);
    }
  } catch (err) {
    console.error("Badge generation error:", err);
  }

  // Generate Ultra-Crisp Vector SVG Badge
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="220" height="38" viewBox="0 0 220 38" fill="none">
    <defs>
      <linearGradient id="bg_gradient" x1="0" y1="0" x2="220" y2="38" gradientUnits="userSpaceOnUse">
        <stop stop-color="#0F172A" />
        <stop offset="1" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="badge_gradient" x1="120" y1="0" x2="216" y2="38" gradientUnits="userSpaceOnUse">
        <stop stop-color="#2563EB" />
        <stop offset="1" stop-color="#1D4ED8" />
      </linearGradient>
      <filter id="glow" x="0" y="0" width="220" height="38" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.35"/>
      </filter>
    </defs>

    <g filter="url(#glow)">
      <!-- Base Container -->
      <rect width="220" height="38" rx="10" fill="url(#bg_gradient)" stroke="#1E293B" stroke-width="1.5"/>

      <!-- Brand Section (Left) -->
      <g transform="translate(10, 9)">
        <!-- Mini Vault Icon -->
        <rect width="20" height="20" rx="5" fill="#2563EB"/>
        <path d="M6 10L9 13L14 7" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Text -->
        <text x="26" y="14" fill="#F8FAFC" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="900" letter-spacing="0.5">AI VAULT</text>
      </g>

      <!-- Score Pillar (Right) -->
      <g transform="translate(122, 4)">
        <rect width="90" height="30" rx="7" fill="url(#badge_gradient)"/>
        <text x="14" y="19" fill="#93C5FD" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" letter-spacing="0.5">SCORE</text>
        <text x="54" y="20" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="900">${score}</text>
      </g>
    </g>
  </svg>
  `.trim();

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
