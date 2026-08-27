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
      website,
      logo_url,
      logo,
      category,
      pricing_model,
      pricing,
      description,
      overview,
      founder_email,
      submitter_email,
      tier,
      plan,
    } = body;

    const cleanName = String(name || "").trim();
    const targetWebsite = String(website_url || website || "").trim();
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

    // 1. Slug Collision Check & Deduplication
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
    const cleanPricing = String(pricing_model || pricing || "Freemium").trim();
    const email = String(founder_email || submitter_email || "").trim();
    const cleanLogo = String(logo_url || logo || "").trim();
    const selectedPlan = String(tier || plan || "standard").toLowerCase();

    // 2. Strict Pending Review Payload (Excludes tool from Public Frontend)
    const payload: Record<string, unknown> = {
      name: cleanName,
      slug: baseSlug,
      website_url: targetWebsite,
      website: targetWebsite,
      category: cleanCategory,
      pricing: cleanPricing,
      pricing_model: cleanPricing,
      description: cleanDesc,
      overview: cleanDesc,
      tagline: `${cleanName} is a verified AI platform for ${cleanCategory.toLowerCase()} operations.`,
      score: selectedPlan === "featured" ? 96 : 91,
      ai_vault_score: selectedPlan === "featured" ? 96 : 91,
      affiliate_status: "pending_submission", // Public feeds filter out this status until approved
      affiliate_network: email ? `Founder: ${email}` : "Direct Submission",
    };

    if (cleanLogo) {
      payload.logo_url = cleanLogo;
      payload.logo = cleanLogo;
    }

    // 3. Database Insertion
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
      message: "Tool successfully placed in the editorial review queue!",
      slug: baseSlug,
      toolId: data?.id,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Submission request failed";
    console.error("Submission API Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
