// app/api/admin/submissions/route.ts
import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
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

export async function POST(req: Request) {
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
      is_featured,
    } = body;

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. Admin Moderation Actions
    if (action === "approve" && id) {
      const { error } = await supabase
        .from("ai_tools")
        .update({ affiliate_status: "direct" })
        .eq("id", id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === "reject" && id) {
      const { error } = await supabase
        .from("ai_tools")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // 2. User Tool Submission Validation
    if (!name || !website_url || !description) {
      return NextResponse.json(
        { error: "Required fields missing (Name, Website, Description)." },
        { status: 400 }
      );
    }

    const cleanSlug = String(name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const slug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;

    // Core fields guaranteed in ai_tools schema
    const payload: Record<string, unknown> = {
      name: String(name).trim(),
      slug: slug,
      website_url: String(website_url).trim(),
      category: category || "Productivity",
      pricing: pricing || "Freemium",
      pricing_type: pricing || "Freemium",
      description: String(description).trim(),
      overview: String(description).trim(),
      affiliate_status: "pending_submission",
      score: is_featured ? 96 : 92,
      ai_vault_score: is_featured ? 96 : 92,
      created_at: new Date().toISOString(),
    };

    if (logo_url && String(logo_url).trim()) {
      payload.logo_url = String(logo_url).trim();
    }

    const { data, error } = await supabase
      .from("ai_tools")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Submission failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
