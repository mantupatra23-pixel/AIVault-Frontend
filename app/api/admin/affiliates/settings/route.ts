import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { network_name, publisher_id, tracking_default, is_enabled } = body;

    if (!network_name) {
      return NextResponse.json({ error: "Missing network_name" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("affiliate_settings")
      .upsert(
        {
          network_name,
          publisher_id: publisher_id || null,
          tracking_default: tracking_default || "aivault",
          is_enabled: Boolean(is_enabled),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "network_name" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, setting: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error saving settings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
