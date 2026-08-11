import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  const { data: links } = await supabase.from("affiliate_links").select("*");
  return NextResponse.json({ links: links || [] });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { toolId, networkName, programName, affiliateUrl, officialUrl, affiliateId, trackingId, commissionType, commissionRate, status } = body;

    if (!toolId) {
      return NextResponse.json({ error: "toolId is required" }, { status: 400 });
    }

    const nextStatus = status || (affiliateUrl ? "ACTIVE" : "NO_LINK");

    // Upsert into affiliate_links
    const { data: linkRecord, error: linkErr } = await supabase
      .from("affiliate_links")
      .upsert(
        {
          tool_id: toolId,
          network_name: networkName || "Direct",
          program_name: programName || null,
          affiliate_url: affiliateUrl ? affiliateUrl.trim() : null,
          official_url: officialUrl || null,
          affiliate_id: affiliateId || null,
          tracking_id: trackingId || null,
          commission_type: commissionType || "Unknown",
          commission_rate: commissionRate ? parseFloat(commissionRate) : null,
          status: nextStatus,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tool_id" }
      )
      .select()
      .single();

    if (linkErr) throw linkErr;

    // Sync public ai_tools row if affiliate URL is active
    if (affiliateUrl && nextStatus === "ACTIVE") {
      await supabase
        .from("ai_tools")
        .update({
          affiliate_url: affiliateUrl.trim(),
          affiliate_status: "ACTIVE",
          affiliate_network: networkName || "Direct",
        })
        .eq("id", toolId);
    } else if (nextStatus === "PAUSED" || nextStatus === "NO_LINK") {
      await supabase
        .from("ai_tools")
        .update({
          affiliate_status: nextStatus,
        })
        .eq("id", toolId);
    }

    return NextResponse.json({ success: true, link: linkRecord });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error saving affiliate link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
