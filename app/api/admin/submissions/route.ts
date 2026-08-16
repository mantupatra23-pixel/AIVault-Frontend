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
      submitter_email,
      description,
      is_featured,
    } = body;

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Moderation Action (Approve / Reject)
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

    // New Tool Submission Insertion
    if (!name || !website_url || !description) {
      return NextResponse.json(
        { error: "Required fields missing (name, website, description)." },
        { status: 400 }
      );
    }

    const cleanSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const slug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;

    const { data, error } = await supabase
      .from("ai_tools")
      .insert([
        {
          name: name.trim(),
          slug,
          website_url: website_url.trim(),
          logo_url: logo_url && logo_url.trim() ? logo_url.trim() : null,
          category: category || "Productivity",
          pricing: pricing || "Freemium",
          pricing_type: pricing || "Freemium",
          description: description.trim(),
          overview: description.trim(),
          affiliate_status: "pending_submission",
          is_featured: Boolean(is_featured),
          featured: Boolean(is_featured),
          score: is_featured ? 96 : 92,
          ai_vault_score: is_featured ? 96 : 92,
          submitter_email: submitter_email ? submitter_email.trim() : null,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Submission Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
