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

function generateCleanSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
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
      description,
      overview,
      founder_email,
      submitter_email,
      tier = "standard",
    } = body;

    const cleanName = String(name || "").trim();
    const targetWebsite = String(website_url || "").trim();
    const cleanDesc = String(
      description ||
        overview ||
        `${cleanName} is an AI solution designed for modern workflow automation.`
    ).trim();

    if (!cleanName || !targetWebsite) {
      return NextResponse.json(
        { error: "Tool name and official website URL are required." },
        { status: 400 }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json(
        { error: "Supabase environment not configured." },
        { status: 500 }
      );
    }

    const supabase = getSupabase();
    let baseSlug = generateCleanSlug(cleanName);
    if (!baseSlug) baseSlug = `ai-tool-${Date.now()}`;

    // Collision check
    try {
      const { data: existing } = await supabase
        .from("ai_tools")
        .select("slug")
        .eq("slug", baseSlug)
        .maybeSingle();

      if (existing) {
        baseSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } catch {}

    const cleanCategory = String(category || "Productivity").trim();
    const cleanPricing = String(pricing || "Freemium").trim();
    const email = String(founder_email || submitter_email || "").trim();
    const cleanLogo = String(logo_url || "").trim();

    // Exact database schema payload (NO 'tagline', NO 'pricing_model')
    const payload: Record<string, unknown> = {
      name: cleanName,
      slug: baseSlug,
      website_url: targetWebsite,
      category: cleanCategory,
      pricing: cleanPricing,
      description: cleanDesc,
      overview: cleanDesc,
      score: tier === "spotlight" ? 98 : tier === "featured" ? 95 : 91,
      ai_vault_score: tier === "spotlight" ? 98 : tier === "featured" ? 95 : 91,
      affiliate_status: "pending_submission",
      affiliate_network: email ? `Founder: ${email} | Tier: ${tier.toUpperCase()}` : `Tier: ${tier.toUpperCase()}`,
      created_at: new Date().toISOString(),
    };

    if (cleanLogo) {
      payload.logo_url = cleanLogo;
    }

    const { data, error } = await supabase
      .from("ai_tools")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Submission DB Insert Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Tool successfully placed in the review queue!",
      slug: baseSlug,
      toolId: data?.id,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Submission request failed";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
