// app/api/submit/route.ts
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      website_url,
      category,
      pricing,
      description,
      founder_email,
      submitter_email,
      logo_url,
      plan,
    } = body;

    if (!name || !website_url) {
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const cleanName = String(name).trim();
    const cleanWebsite = String(website_url).trim();
    const cleanCategory = String(category || "Productivity").trim();
    const cleanPricing = String(pricing || "Freemium").trim();
    const cleanDesc = String(
      description ||
        `${cleanName} is an AI software platform for ${cleanCategory.toLowerCase()} workflows.`
    ).trim();
    const email = String(founder_email || submitter_email || "").trim();
    const cleanLogo = String(logo_url || "").trim();

    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Safe DB insert schema
    const insertPayload: Record<string, unknown> = {
      name: cleanName,
      slug,
      category: cleanCategory,
      pricing: cleanPricing,
      website_url: cleanWebsite,
      website: cleanWebsite,
      description: cleanDesc,
      overview: cleanDesc,
      score: plan === "featured" ? 96 : 90,
      affiliate_status: "pending_submission",
      affiliate_network: email ? `Email: ${email}` : "Direct",
      created_at: new Date().toISOString(),
    };

    if (cleanLogo) {
      insertPayload.logo_url = cleanLogo;
      insertPayload.logo = cleanLogo;
    }

    const { data, error } = await supabase
      .from("ai_tools")
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.error("Submission DB error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Tool submitted successfully for review!",
      submission: data,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Submission failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
