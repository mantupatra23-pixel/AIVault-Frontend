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

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("ai_tools")
      .select("*")
      .eq("affiliate_status", "pending_submission")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, submissions: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Fetch error";
    return NextResponse.json({ error: msg, submissions: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      action,
      name,
      website_url,
      logo_url,
      category,
      pricing,
      description,
      overview,
      founder_email,
      submitter_email,
      is_featured,
      tier,
    } = body;

    const supabase = getSupabase();

    // 1. Admin Moderation (Approve)
    if (action === "approve" && id) {
      const { error } = await supabase
        .from("ai_tools")
        .update({ affiliate_status: "direct" })
        .eq("id", id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Tool approved and published live!" });
    }

    // 2. Admin Moderation (Reject / Delete)
    if ((action === "reject" || action === "delete") && id) {
      const { error } = await supabase
        .from("ai_tools")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Tool submission removed." });
    }

    // 3. New Tool Submission
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

    const cleanSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const slug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
    const isFeaturedTier = is_featured || tier === "featured";
    const email = String(founder_email || submitter_email || "").trim();

    // Clean payload matching exact Supabase schema (NO pricing_model column)
    const insertPayload: Record<string, unknown> = {
      name: cleanName,
      slug: slug,
      website_url: cleanWebsite,
      category: category || "Productivity",
      pricing: pricing || "Freemium",
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
      console.error("Supabase insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Tool successfully placed in the editorial review queue!",
      data,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Submission failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
