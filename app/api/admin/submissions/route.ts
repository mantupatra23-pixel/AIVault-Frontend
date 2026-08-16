// app/api/admin/submissions/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

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

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { name, website_url, logo_url, category, pricing, submitter_email, description, is_featured } = body;

    if (!name || !website_url || !description) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase.from("ai_tools").insert([
      {
        name,
        slug,
        website_url,
        logo_url: logoUrl(website_url, logo_url),
        category: category || "Productivity",
        pricing: pricing || "Freemium",
        pricing_type: pricing || "Freemium",
        description,
        overview: description,
        affiliate_status: "pending_submission",
        is_featured: Boolean(is_featured),
        featured: Boolean(is_featured),
        score: is_featured ? 96 : 92,
        ai_vault_score: is_featured ? 96 : 92,
        created_at: new Date().toISOString(),
      },
    ]).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Insert error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function logoUrl(website: string, customLogo?: string | null): string | null {
  if (customLogo && customLogo.trim().startsWith("http")) return customLogo.trim();
  try {
    const host = new URL(website.startsWith("http") ? website : `https://${website}`).hostname;
    return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAV&fallback_opts=TYPE,SIZE,URL&url=https://${host}&size=128`;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { id, action } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    if (action === "approve") {
      await supabase.from("ai_tools").update({ affiliate_status: "direct" }).eq("id", id);
    } else if (action === "reject") {
      await supabase.from("ai_tools").delete().eq("id", id);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Action error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
