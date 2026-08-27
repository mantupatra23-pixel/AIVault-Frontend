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

// GET: Fetch all pending submissions waiting for Admin Review
export async function GET() {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json(
        { error: "Supabase environment credentials missing." },
        { status: 500 }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("ai_tools")
      .select("*")
      .or("affiliate_status.eq.pending_submission,is_approved.eq.false")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      submissions: data || [],
      count: data?.length || 0,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch pending submissions";
    console.error("Admin submissions GET error:", msg);
    return NextResponse.json({ error: msg, submissions: [] }, { status: 500 });
  }
}

// POST: Moderate (Approve / Reject) or Direct-Submit Tools
export async function POST(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json(
        { error: "Supabase environment credentials missing." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      id,
      action,
      name,
      website_url,
      logo_url,
      category,
      pricing,
      pricing_model,
      description,
      overview,
      is_featured,
      tier,
    } = body;

    const supabase = getSupabase();

    // 1. APPROVE ACTION: Publish tool live to Public Frontend
    if (action === "approve" && id) {
      const updatePayload: Record<string, unknown> = {
        affiliate_status: "direct",
        is_approved: true,
      };

      const { error } = await supabase
        .from("ai_tools")
        .update(updatePayload)
        .eq("id", id);

      if (error) {
        // Fallback without is_approved column if not present in schema
        const fallback = await supabase
          .from("ai_tools")
          .update({ affiliate_status: "direct" })
          .eq("id", id);
        if (fallback.error) throw fallback.error;
      }

      return NextResponse.json({
        success: true,
        message: "Tool successfully approved and published live!",
      });
    }

    // 2. REJECT / DELETE ACTION: Permanently remove submission
    if ((action === "reject" || action === "delete") && id) {
      const { error } = await supabase
        .from("ai_tools")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: "Tool submission rejected and permanently removed.",
      });
    }

    // 3. DIRECT SUBMISSION HANDLER (Validation & Queue Insertion)
    const cleanName = String(name || "").trim();
    const cleanWebsite = String(website_url || "").trim();
    const cleanDesc = String(
      description || overview || `${cleanName} is an AI solution for modern operations.`
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

    const insertPayload: Record<string, unknown> = {
      name: cleanName,
      slug: slug,
      website_url: cleanWebsite,
      website: cleanWebsite,
      category: category || "Productivity",
      pricing: pricing || pricing_model || "Freemium",
      pricing_model: pricing || pricing_model || "Freemium",
      description: cleanDesc,
      overview: cleanDesc,
      affiliate_status: "pending_submission",
      score: isFeaturedTier ? 96 : 92,
      ai_vault_score: isFeaturedTier ? 96 : 92,
      created_at: new Date().toISOString(),
    };

    if (logo_url && String(logo_url).trim()) {
      insertPayload.logo_url = String(logo_url).trim();
      insertPayload.logo = String(logo_url).trim();
    }

    const { data, error } = await supabase
      .from("ai_tools")
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.error("Supabase submission error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Tool submitted successfully to editorial review queue!",
      data,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Submission request failed";
    console.error("Admin submissions POST error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
