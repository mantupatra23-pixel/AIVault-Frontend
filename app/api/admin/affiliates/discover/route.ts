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

    // Schema-Safe Selection: Select ONLY verified columns from public.ai_tools
    let query = supabase
      .from("ai_tools")
      .select("id, name, slug, category, website_url");

    if (targetSlug) {
      query = query.ilike("slug", targetSlug.trim());
    } else {
      query = query.limit(100);
    }

    const { data: tools, error: fetchErr } = await query;

    if (fetchErr) {
      console.error("[affiliate-discovery][DB_ERROR]", fetchErr.message);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!tools || tools.length === 0) {
      console.log("[affiliate-discovery] completed - 0 tools loaded");
      return NextResponse.json({
        success: true,
        scanned: 0,
        candidatesFound: 0,
        pendingReview: 0,
        active: 0,
        noProgramFound: 0,
        errors: 0,
        message: "No unmonetized tools pending discovery.",
      });
    }

    // Load existing affiliate records from public.affiliate_links
    const { data: existingLinks } = await supabase
      .from("affiliate_links")
      .select("tool_id, affiliate_url, status");

    const activeToolIds = new Set(
      (existingLinks || [])
        .filter((l) => l.status === "ACTIVE" && l.affiliate_url)
        .map((l) => l.tool_id)
    );

    // Load publisher settings
    const { data: enabledNetworks } = await supabase
      .from("affiliate_settings")
      .select("network_name, publisher_id")
      .eq("is_enabled", true);

    const activeSettings = enabledNetworks || [];

    let scanned = 0;
    let candidatesFound = 0;
    let noProgramFound = 0;

    for (const tool of tools) {
      if (activeToolIds.has(tool.id)) continue; // Skip already verified active links
      scanned++;

      const websiteUrl = tool.website_url;
      if (!websiteUrl) {
        await supabase.from("affiliate_links").upsert(
          {
            tool_id: tool.id,
            status: "DISCOVERY_REQUIRED",
            last_checked_at: new Date().toISOString(),
          },
          { onConflict: "tool_id" }
        );
        continue;
      }

      let cleanDomain = "";
      try {
        const parsed = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
        cleanDomain = parsed.hostname.replace("www.", "").toLowerCase();
      } catch {
        cleanDomain = websiteUrl.replace(/https?:\/\//, "").replace("www.", "").split("/")[0].toLowerCase();
      }

      let candidateMatched = false;

      for (const setting of activeSettings) {
        if (setting.publisher_id) {
          candidateMatched = true;
          candidatesFound++;

          const candidateUrl = `https://${setting.network_name.toLowerCase()}.com/c/${setting.publisher_id}/aivault?u=${encodeURIComponent(websiteUrl)}`;

          await supabase.from("affiliate_candidates").upsert(
            {
              tool_id: tool.id,
              tool_name: tool.name,
              tool_slug: tool.slug,
              official_url: websiteUrl,
              network: setting.network_name,
              program_name: `${tool.name} Affiliate Program`,
              candidate_url: candidateUrl,
              confidence: 85,
              status: "PENDING_REVIEW",
            },
            { onConflict: "tool_id,candidate_url" }
          );

          await supabase.from("affiliate_links").upsert(
            {
              tool_id: tool.id,
              network_name: setting.network_name,
              status: "PENDING_REVIEW",
              last_checked_at: new Date().toISOString(),
            },
            { onConflict: "tool_id" }
          );

          break;
        }
      }

      if (!candidateMatched) {
        noProgramFound++;
        await supabase.from("affiliate_links").upsert(
          {
            tool_id: tool.id,
            status: "NO_AFFILIATE_PROGRAM",
            last_checked_at: new Date().toISOString(),
          },
          { onConflict: "tool_id" }
        );
      }
    }

    console.log(`[affiliate-discovery] tools_loaded=${tools.length}`);
    console.log(`[affiliate-discovery] scanned=${scanned}`);
    console.log(`[affiliate-discovery] candidates_found=${candidatesFound}`);
    console.log(`[affiliate-discovery] completed`);

    return NextResponse.json({
      success: true,
      scanned,
      candidatesFound,
      pendingReview: candidatesFound,
      active: activeToolIds.size,
      noProgramFound,
      errors: 0,
      message: `Scanned ${scanned} tools. Discovered ${candidatesFound} candidates. ${noProgramFound} marked No Program.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unhandled discovery exception";
    console.error("[affiliate-discovery][EXCEPTION]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
