// app/api/admin/update-tool/route.ts
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
    const { id, affiliate_url, affiliate_network } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing tool ID" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const isMonetized = Boolean(affiliate_url && affiliate_url.trim().length > 0);

    const { data, error } = await supabase
      .from("ai_tools")
      .update({
        affiliate_url: affiliate_url ? affiliate_url.trim() : null,
        affiliate_network: affiliate_network || "Direct",
        affiliate_status: isMonetized ? "active_monetized" : "discovery_required",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
