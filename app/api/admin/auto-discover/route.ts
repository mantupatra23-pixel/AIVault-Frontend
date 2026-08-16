// app/api/admin/auto-discover/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

// Curated Verified Official Domains
const VERIFIED_OFFICIAL_DOMAINS: Record<string, string> = {
  investorfinder: "https://investorfinder.co",
  "tailgrids-3-0": "https://tailgrids.com",
  "claude-share": "https://claude.ai",
  buggyverse: "https://buggyverse.com",
  "ntsc-rs": "https://github.com/ntsc-rs",
  "angel-match-4-0": "https://angelmatch.io",
  folio: "https://folio.ai",
  dropmatico: "https://dropmatico.com",
  termique: "https://termique.com",
  brainflow: "https://brainflow.org",
  clade: "https://clade.ai",
  metal: "https://getmetal.io",
  auriko: "https://auriko.com",
  eqk: "https://eqk.ai",
  acebuilder: "https://acebuilder.io",
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
  jasper: "https://www.jasper.ai",
  copyai: "https://www.copy.ai",
  elevenlabs: "https://elevenlabs.io",
  runway: "https://runwayml.com",
};

function resolveOfficialWebsite(tool: {
  slug?: string | null;
  name?: string | null;
  website_url?: string | null;
}): string {
  const slug = (tool.slug || "").toLowerCase().trim();

  // 1. Check curated domain list
  if (VERIFIED_OFFICIAL_DOMAINS[slug]) {
    return VERIFIED_OFFICIAL_DOMAINS[slug];
  }

  const existingUrl = (tool.website_url || "").trim();

  // 2. Keep valid HTTP/HTTPS URLs (excluding broken synthetic .ai guesses)
  if (
    existingUrl &&
    (existingUrl.startsWith("http://") || existingUrl.startsWith("https://")) &&
    !existingUrl.includes(".ai/?ref=") &&
    !existingUrl.includes(".co/?ref=") &&
    !existingUrl.includes("producthunt.com")
  ) {
    return existingUrl;
  }

  // 3. Fallback to official launch entry on Product Hunt
  const cleanSlug = slug.replace(/[^a-z0-9-]/g, "");
  return `https://www.producthunt.com/products/${cleanSlug}`;
}

export async function POST() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json(
      { error: "Missing Supabase credentials configuration." },
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const { data: tools, error: fetchErr } = await supabase
      .from("ai_tools")
      .select("id, slug, name, website_url, affiliate_url");

    if (fetchErr || !tools) {
      return NextResponse.json(
        { error: fetchErr?.message || "Failed to fetch catalog tools." },
        { status: 500 }
      );
    }

    let updatedCount = 0;

    for (const tool of tools) {
      const officialUrl = resolveOfficialWebsite(tool);
      const hasManualAffiliate = Boolean(
        tool.affiliate_url && tool.affiliate_url.trim().length > 0
      );

      const { error: updateErr } = await supabase
        .from("ai_tools")
        .update({
          website_url: officialUrl,
          affiliate_status: hasManualAffiliate
            ? "active_monetized"
            : "discovery_required",
          updated_at: new Date().toISOString(),
        })
        .eq("id", tool.id);

      if (!updateErr) {
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully resolved official websites for ${updatedCount} tools.`,
      total_updated: updatedCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
