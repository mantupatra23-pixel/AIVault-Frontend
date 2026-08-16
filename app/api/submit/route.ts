// app/api/submit/route.ts
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, website_url, category, pricing, description, founder_email, plan } = body;

    if (!name || !website_url || !category) {
      return NextResponse.json(
        { error: "Name, website URL, and category are required." },
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
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const isFeatured = plan === "featured";

    const { data, error } = await supabase.from("ai_tools").insert([
      {
        name: name.trim(),
        slug,
        website_url: website_url.trim(),
        website: website_url.trim(),
        category: category.trim(),
        pricing: pricing || "Freemium",
        overview: description?.trim() || `${name} provides AI workflow acceleration.`,
        description: description?.trim() || `${name} provides AI workflow acceleration.`,
        score: isFeatured ? 96 : 88,
        affiliate_status: "discovery_required",
        affiliate_network: "Direct",
        is_verified: isFeatured,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]).select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: isFeatured
        ? "Priority submission received! Your tool has been verified and listed."
        : "Submission received! Tool indexed successfully.",
      data,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
