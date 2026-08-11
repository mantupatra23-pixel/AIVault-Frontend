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
    const { searchParams } = new URL(request.url);
    const targetSlug = searchParams.get("slug");

    console.log("[affiliate-discovery] started", { targetSlug: targetSlug || "all" });

    // Schema-Safe Selection: ONLY query verified columns from public.ai_tools
    let query = supabase
      .from("ai_tools")
      .select("id, name, slug, category, website_url, affiliate_url, affiliate_status");

    if (targetSlug) {
      query = query.ilike("slug", targetSlug.trim());
    } else {
      query = query
        .or("affiliate_url.is.null,affiliate_status.eq.DISCOVERY_REQUIRED,affiliate_status.eq.NO_LINK")
        .limit(100);
    }

    const { data: tools, error: fetchErr } = await query;

    if (fetchErr) {
      console.error("[affiliate-discovery][DB_ERROR]", fetchErr.message);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!tools || tools.length === 0) {
      console.log("[affiliate-discovery] completed - no tools pending discovery");
      return NextResponse.json({
        success: true,
        scanned: 0,
        candidates: 0,
        noProgramFound: 0,
        message: targetSlug
          ? `Tool '${targetSlug}' already processed or not found.`
          : "No unmonetized tools pending discovery.",
      });
    }

    // Read active publisher settings from affiliate_settings table safely
    const { data: enabledNetworks } = await supabase
      .from("affiliate_settings")
      .select("id, network_name, publisher_id, is_enabled")
      .eq("is_enabled", true);

    const activeSettings = enabledNetworks || [];

    let scannedCount = 0;
    let candidatesCount = 0;
    let noProgramCount = 0;

    for (const tool of tools) {
      scannedCount++;
      const domainUrl = tool.website_url; // Use ONLY website_url (official_url removed)

      if (!domainUrl) {
        await supabase
          .from("ai_tools")
          .update({
            affiliate_status: "DISCOVERY_REQUIRED",
            last_checked_at: new Date().toISOString(),
          })
          .eq("id", tool.id);
        continue;
      }

      let cleanDomain = "";
      try {
        const parsed = new URL(domainUrl.startsWith("http") ? domainUrl : `https://${domainUrl}`);
        cleanDomain = parsed.hostname.replace("www.", "").toLowerCase();
      } catch {
        // Fallback for simple domain strings
        cleanDomain = domainUrl.replace(/https?:\/\//, "").replace("www.", "").split("/")[0].toLowerCase();
      }

      let candidateFound = false;

      // Match against active server publisher settings
      for (const setting of activeSettings) {
        if (setting.publisher_id) {
          candidateFound = true;
          candidatesCount++;

          const candidateUrl = `https://${setting.network_name.toLowerCase()}.com/c/${setting.publisher_id}/aivault?u=${encodeURIComponent(domainUrl)}`;

          await supabase.from("affiliate_candidates").upsert(
            {
              tool_id: tool.id,
              tool_name: tool.name,
              tool_slug: tool.slug,
              official_url: domainUrl,
              network: setting.network_name,
              program_name: `${tool.name} Affiliate Program`,
              candidate_url: candidateUrl,
              evidence_url: `https://${cleanDomain}/affiliates`,
              confidence: 85,
              status: "PENDING_REVIEW",
            },
            { onConflict: "tool_id,candidate_url" }
          );

          await supabase
            .from("ai_tools")
            .update({
              affiliate_status: "PENDING_REVIEW",
              last_checked_at: new Date().toISOString(),
            })
            .eq("id", tool.id);

          break;
        }
      }

      if (!candidateFound) {
        noProgramCount++;
        await supabase
          .from("ai_tools")
          .update({
            affiliate_status: tool.affiliate_url ? "ACTIVE" : "NO_AFFILIATE_PROGRAM",
            last_checked_at: new Date().toISOString(),
          })
          .eq("id", tool.id);
      }
    }

    console.log(`[affiliate-discovery] scanned=${scannedCount}`);
    console.log(`[affiliate-discovery] candidates=${candidatesCount}`);
    console.log(`[affiliate-discovery] completed`);

    return NextResponse.json({
      success: true,
      scanned: scannedCount,
      candidates: candidatesCount,
      noProgramFound: noProgramCount,
      message: `Scanned ${scannedCount} tools. Found ${candidatesCount} candidates pending review. ${noProgramCount} tools marked NO_AFFILIATE_PROGRAM.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unhandled discovery exception";
    console.error("[affiliate-discovery][EXCEPTION]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
