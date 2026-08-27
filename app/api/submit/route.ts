import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      website_url,
      logo_url,
      category,
      pricing,
      pricing_model,
      description,
      overview,
      founder_email,
      submitter_email,
      tier,
      is_featured,
    } = body;

    const cleanName = String(name || "").trim();
    const cleanWebsite = String(website_url || "").trim();
    const cleanDesc = String(
      description || overview || `${cleanName} is an AI solution designed for modern workflow automation.`
    ).trim();

    if (!cleanName || !cleanWebsite) {
      return NextResponse.json(
        { error: "Tool Name and Official Website URL are required." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const cleanSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const slug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
    const isFeaturedTier = is_featured || tier === "featured";
    const email = String(founder_email || submitter_email || "").trim();

    const insertPayload: Record<string, unknown> = {
      name: cleanName,
      slug: slug,
      website_url: cleanWebsite,
      category: category || "Productivity",
      pricing: pricing || pricing_model || "Freemium",
      description: cleanDesc,
      overview: cleanDesc,
      affiliate_status: "pending_submission",
      affiliate_network: email ? `Founder: ${email}` : "Direct Submission",
      score: isFeaturedTier ? 96 : 92,
      ai_vault_score: isFeaturedTier ? 96 : 92,
      created_at: new Date().toISOString(),
    };

    if (logo_url && String(logo_url).trim()) {
      insertPayload.logo_url = String(logo_url).trim();
    }

    const { data, error } = await supabase
      .from("ai_tools")
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.error("Submission DB Insert Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Tool successfully placed in the editorial review queue!",
      data,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Submission failed";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
