import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
  }

  try {
    // Fetch active affiliate tools for validation pass
    const { data: tools } = await supabase
      .from("ai_tools")
      .select("id, name, slug, affiliate_url")
      .not("affiliate_url", "is", null)
      .limit(50);

    if (!tools || tools.length === 0) {
      return NextResponse.json({ message: "No active affiliate tools to validate" });
    }

    let checked = 0;
    let broken = 0;

    for (const tool of tools) {
      checked++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(tool.affiliate_url!, {
          method: "HEAD",
          signal: controller.signal,
          headers: { "User-Agent": "AI-Vault-LinkValidator/1.0" },
        });

        clearTimeout(timeoutId);

        if (res.status >= 400 && res.status !== 403) {
          broken++;
          await supabase
            .from("ai_tools")
            .update({
              affiliate_status: "LINK_INVALID",
              affiliate_last_checked_at: new Date().toISOString(),
            })
            .eq("id", tool.id);

          await supabase.from("affiliate_notifications").insert({
            tool_id: tool.id,
            tool_name: tool.name,
            type: "AFFILIATE_LINK_INVALID",
            title: `Broken Link Detected: ${tool.name}`,
            message: `Outbound check returned HTTP ${res.status}. Public traffic falls back to official website URL safely.`,
          });
        } else {
          await supabase
            .from("ai_tools")
            .update({ affiliate_last_checked_at: new Date().toISOString() })
            .eq("id", tool.id);
        }
      } catch {
        broken++;
        await supabase
          .from("ai_tools")
          .update({
            affiliate_status: "LINK_INVALID",
            affiliate_last_checked_at: new Date().toISOString(),
          })
          .eq("id", tool.id);
      }
    }

    return NextResponse.json({
      success: true,
      summary: { checkedCount: checked, brokenLinksDetected: broken },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Validation exception";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
