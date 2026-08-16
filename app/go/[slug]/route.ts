// app/go/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

// Curated Top-Tier AI Platforms Mapping
const TOP_KNOWN_PLATFORMS: Record<string, string> = {
  investorfinder: "https://www.producthunt.com/products/investorfinder",
  "tailgrids-3-0": "https://tailgrids.com",
  "claude-share": "https://claude.ai",
  buggyverse: "https://www.producthunt.com/products/buggyverse",
  "ntsc-rs": "https://github.com/ntsc-rs",
  "angel-match-4-0": "https://angelmatch.io",
  folio: "https://www.producthunt.com/products/folio",
  dropmatico: "https://www.producthunt.com/products/dropmatico",
  termique: "https://www.producthunt.com/products/termique",
  brainflow: "https://brainflow.org",
  clade: "https://www.producthunt.com/products/clade",
  metal: "https://getmetal.io",
  auriko: "https://www.producthunt.com/products/auriko",
  eqk: "https://www.producthunt.com/products/eqk",
  acebuilder: "https://www.producthunt.com/products/acebuilder",
  "docusynth-ai": "https://docusynth.ai",
  "promptengine-pro": "https://promptengine.pro",
  audiencepulse: "https://audiencepulse.io",
  "visiongrid-3d": "https://visiongrid3d.com",
  "voicecraft-studio": "https://voicecraft.studio",
  "scriptflow-ai": "https://scriptflow.ai",
  "codepulse-radar": "https://codepulse.dev",
  "castframe-ai": "https://castframe.ai",
  "botscribe-live": "https://botscribe.live",
  "leadnova-ai": "https://leadnova.ai",
  chatgpt: "https://chatgpt.com",
  midjourney: "https://www.midjourney.com",
  cursor: "https://www.cursor.com",
  v0: "https://v0.dev",
  perplexity: "https://www.perplexity.ai",
};

function formatAndSanitizeUrl(rawTarget: string, fallbackSlug: string): string {
  let target = (rawTarget || "").trim();

  // If empty or obvious fake guessed domain, fallback to clean producthunt launch entry
  if (!target || target.includes(".ai/?ref=") || target.includes(".co/?ref=")) {
    const clean = fallbackSlug.replace(/[^a-z0-9-]/g, "");
    return `https://www.producthunt.com/products/${clean}`;
  }

  // Ensure protocol is present
  if (!target.startsWith("http://") && !target.startsWith("https://")) {
    target = `https://${target}`;
  }

  return target;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const rawSlug = decodeURIComponent(slug || "").trim().toLowerCase();

  if (!rawSlug) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Instant redirect for high-priority curated entries
  if (TOP_KNOWN_PLATFORMS[rawSlug]) {
    return NextResponse.redirect(TOP_KNOWN_PLATFORMS[rawSlug], { status: 307 });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.redirect(
      new URL(`https://www.producthunt.com/products/${rawSlug}`, request.url)
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const { data: tool } = await supabase
      .from("ai_tools")
      .select("id, slug, name, website_url, website, affiliate_url, click_count")
      .or(`slug.ilike.${rawSlug},name.ilike.${rawSlug}`)
      .limit(1)
      .maybeSingle();

    if (!tool) {
      return NextResponse.redirect(
        new URL(`https://www.producthunt.com/products/${rawSlug}`, request.url)
      );
    }

    // Increment click counter in background
    const currentClicks = Number(tool.click_count || 0);
    supabase
      .from("ai_tools")
      .update({
        click_count: currentClicks + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tool.id)
      .then(() => {});

    // Determine target URL: 1. Affiliate -> 2. Website -> 3. Fallback
    const candidateUrl =
      tool.affiliate_url?.trim() ||
      tool.website_url?.trim() ||
      tool.website?.trim() ||
      "";

    const destination = formatAndSanitizeUrl(candidateUrl, tool.slug || rawSlug);
    return NextResponse.redirect(destination, { status: 307 });
  } catch (err) {
    console.error("Redirect Error:", err);
    return NextResponse.redirect(
      new URL(`https://www.producthunt.com/products/${rawSlug}`, request.url)
    );
  }
}
