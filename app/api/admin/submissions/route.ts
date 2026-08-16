// app/api/admin/submissions/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase
      .from("tool_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ submissions: [] });
    }
    return NextResponse.json({ submissions: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load submissions";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "Missing id or action" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    if (action === "approve") {
      // 1. Fetch submission data
      const { data: sub, error: fetchErr } = await supabase
        .from("tool_submissions")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchErr || !sub) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 });
      }

      const slug = (sub.slug || sub.name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      // 2. Publish to live ai_tools catalog
      const { error: insertErr } = await supabase.from("ai_tools").insert([
        {
          name: sub.name,
          slug,
          category: sub.category || "Productivity",
          pricing: sub.pricing || "Freemium",
          pricing_type: sub.pricing || "Freemium",
          website_url: sub.website_url,
          affiliate_url: "",
          description: sub.description || sub.overview || "",
          overview: sub.overview || sub.description || "",
          score: 93,
          ai_vault_score: 93,
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      // 3. Remove from pending submissions queue
      await supabase.from("tool_submissions").delete().eq("id", id);

      return NextResponse.json({ success: true, message: "Tool published live to directory!" });
    }

    if (action === "reject") {
      await supabase.from("tool_submissions").delete().eq("id", id);
      return NextResponse.json({ success: true, message: "Submission dismissed" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Moderation execution failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
