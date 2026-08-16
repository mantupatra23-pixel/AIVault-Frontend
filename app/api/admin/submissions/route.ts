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
      const { error } = await supabase
        .from("ai_tools")
        .update({
          affiliate_status: "discovery_required",
        })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Tool approved and published live!",
      });
    }

    if (action === "reject") {
      const { error } = await supabase.from("ai_tools").delete().eq("id", id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: "Submission rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Moderation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
