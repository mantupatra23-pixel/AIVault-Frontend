import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { toolIds, networkName, programName, status } = body;

    if (!Array.isArray(toolIds) || toolIds.length === 0) {
      return NextResponse.json({ error: "No tool IDs provided" }, { status: 400 });
    }

    let updatedCount = 0;

    for (const toolId of toolIds) {
      const { data: existing } = await supabase.from("affiliate_links").select("id, affiliate_url").eq("tool_id", toolId).maybeSingle();

      if (existing) {
        await supabase
          .from("affiliate_links")
          .update({
            network_name: networkName || undefined,
            program_name: programName || undefined,
            status: status || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, count: updatedCount });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bulk update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
