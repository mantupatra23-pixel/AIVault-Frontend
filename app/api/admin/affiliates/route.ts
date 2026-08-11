import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { toolId, affiliateUrl, networkName, status } = body;

    if (!toolId) {
      return NextResponse.json({ error: "Missing toolId" }, { status: 400 });
    }

    const nextStatus = status || (affiliateUrl ? "ACTIVE" : "DISCOVERY_REQUIRED");

    // Persist into relational affiliate_links table
    const { data: linkRecord, error: linkErr } = await supabase
      .from("affiliate_links")
      .upsert(
        {
          tool_id: toolId,
          network_name: networkName || "Direct",
          affiliate_url: affiliateUrl ? affiliateUrl.trim() : null,
          status: nextStatus,
          validation_status: affiliateUrl ? "VALID" : "UNKNOWN",
          last_validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tool_id" }
      )
      .select()
      .single();

    if (linkErr) throw linkErr;

    return NextResponse.json({ success: true, link: linkRecord });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error saving affiliate link";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
