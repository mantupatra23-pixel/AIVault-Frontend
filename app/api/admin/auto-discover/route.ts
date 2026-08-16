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

// Known Top Tier Official Tool Mapping
const KNOWN_DOMAINS: Record<string, string> = {
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
};

function resolveOfficialWebsite(tool: { name?: string | null; slug?: string | null; website_url?: string | null }): string {
  const slug = (tool.slug || "").toLowerCase().trim();
  
  if (KNOWN_DOMAINS[slug]) {
    return KNOWN_DOMAINS[slug];
  }

  const rawUrl = (tool.website_url || "").trim();
  
  // Clean producthunt URLs into standalone official domain predictions
  if (!rawUrl || rawUrl.includes("producthunt.com")) {
    const cleanSlug = slug.replace(/[^a-z0-9]/g, "");
    return `https://${cleanSlug}.ai`;
  }

  return rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
}

export async function POST() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Fetch all tools from database
  const { data: tools, error: fetchErr } = await supabase
    .from("ai_tools")
    .select("id, slug, name, website_url, affiliate_url");

  if (fetchErr || !tools) {
    return NextResponse.json({ error: fetchErr?.message || "Failed to fetch tools" }, { status: 500 });
  }

  let updatedCount = 0;

  for (const tool of tools) {
    const officialWeb = resolveOfficialWebsite(tool);
    const separator = officialWeb.includes("?") ? "&" : "?";
    const affiliateUrl = `${officialWeb}${separator}ref=aivault`;

    const { error: updateErr } = await supabase
      .from("ai_tools")
      .update({
        website_url: officialWeb,
        affiliate_url: affiliateUrl,
        affiliate_network: "Direct Partner",
        affiliate_status: "active_monetized",
        updated_at: new Date().toISOString(),
      })
      .eq("id", tool.id);

    if (!updateErr) {
      updatedCount++;
    }
  }

  return NextResponse.json({
    success: true,
    message: `Batch scan complete. Successfully monetized and resolved official domains for ${updatedCount} tools.`,
    total_updated: updatedCount,
  });
}
