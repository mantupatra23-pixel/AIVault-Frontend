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
      plan,
    } = body;

    if (!name || !website_url) {
      return NextResponse.json(
        { error: "Tool name and website URL are required." },
        { status: 400 }
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

    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Insert directly into ai_tools with pending_submission status
    const { data, error } = await supabase
      .from("ai_tools")
      .insert([
        {
          name: cleanName,
          slug,
          category: cleanCategory,
          pricing: cleanPricing,
          pricing_type: cleanPricing,
          website_url: cleanWebsite,
          website: cleanWebsite,
          description: cleanDesc,
          overview: cleanDesc,
          score: plan === "featured" ? 96 : 90,
          ai_vault_score: plan === "featured" ? 96 : 90,
          affiliate_status: "pending_submission",
          affiliate_network: email ? `Email: ${email}` : "Direct",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Submission received and queued for review!",
      submission: data,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Submission failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
