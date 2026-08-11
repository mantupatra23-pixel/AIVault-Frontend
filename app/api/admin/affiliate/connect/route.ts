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
    const { toolId, affiliateUrl, networkName, action } = body;

    if (!toolId) {
      return NextResponse.json({ error: "Missing required toolId" }, { status: 400 });
    }

    if (action === "DISCONNECT") {
      // Revert tool back to official website handling
      const { error } = await supabase
        .from("ai_tools")
        .update({
          affiliate_url: null,
          affiliate_status: "DISCONNECTED",
        })
        .eq("id", toolId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Affiliate disconnected successfully" });
    }

    // Validate provided URL
    if (!affiliateUrl || typeof affiliateUrl !== "string" || !affiliateUrl.startsWith("http")) {
      return NextResponse.json({ error: "Invalid affiliate URL format. Must start with http:// or https://" }, { status: 400 });
    }

    // Fetch tool details for notification logging
    const { data: tool } = await supabase
      .from("ai_tools")
      .select("name, slug, affiliate_url")
      .eq("id", toolId)
      .single();

    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    const isUpdate = Boolean(tool.affiliate_url);

    // 1. Update ai_tools table directly
    const { error: updateErr } = await supabase
      .from("ai_tools")
      .update({
        affiliate_url: affiliateUrl.trim(),
        affiliate_status: "ACTIVE",
        affiliate_network: networkName || "Direct Partner",
        affiliate_last_checked_at: new Date().toISOString(),
      })
      .eq("id", toolId);

    if (updateErr) throw updateErr;

    // 2. Update matching opportunity status if present
    await supabase
      .from("affiliate_opportunities")
      .update({ status: "ACTIVE" })
      .eq("tool_id", toolId);

    // 3. Log Admin Notification
    await supabase.from("affiliate_notifications").insert({
      tool_id: toolId,
      tool_name: tool.name,
      type: isUpdate ? "AFFILIATE_LINK_UPDATED" : "AFFILIATE_CONNECTED",
      title: isUpdate ? `Affiliate Link Updated: ${tool.name}` : `Affiliate Connected: ${tool.name}`,
      message: isUpdate
        ? `The connected affiliate destination for ${tool.name} was updated.`
        : `Successfully activated affiliate tracking for ${tool.name}. Public CTA updated to VISIT OFFICIAL PORTAL.`,
    });

    return NextResponse.json({ success: true, message: "Tool affiliate status updated to ACTIVE" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
