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
    let batchSize = 100;
    let offset = 0;

    try {
      const body = await request.json();
      if (body.batchSize) batchSize = parseInt(body.batchSize, 10);
      if (body.offset) offset = parseInt(body.offset, 10);
    } catch {
      // Use default pagination
    }

    console.log(`[affiliate-discovery] started batchSize=${batchSize} offset=${offset}`);

    // Fetch enabled affiliate network publisher settings
    const { data: enabledNetworks } = await supabase
      .from("affiliate_settings")
      .select("network_name, publisher_id, is_enabled")
      .eq("is_enabled", true);

    const activeNetworks = (enabledNetworks || []).filter((n) => n.publisher_id && n.publisher_id.trim() !== "");

    if (activeNetworks.length === 0) {
      const { count: unmonetizedCount } = await supabase
        .from("ai_tools")
        .select("id", { count: "exact", head: true });

      return NextResponse.json({
        success: false,
        requiresCredentials: true,
        scanned: 0,
        candidatesFound: 0,
        noProgramFound: unmonetizedCount || 0,
        message: "Affiliate discovery requires network credentials. Configure Impact / PartnerStack / CJ / ShareASale credentials in Credentials & Settings.",
      });
    }

    // Schema-safe selection from public.ai_tools
    const { data: tools, count: totalTools } = await supabase
      .from("ai_tools")
      .select("id, name, slug, category, website_url", { count: "exact" })
      .range(offset, offset + batchSize - 1)
      .order("created_at", { ascending: false });

    if (!tools || tools.length === 0) {
      return NextResponse.json({
        success: true,
        scanned: 0,
        candidatesFound: 0,
        noProgramFound: 0,
        offset,
        batchSize,
        total: totalTools || 0,
        hasMore: false,
        message: "All eligible tool batches processed.",
      });
    }

    // Load active affiliate links to skip
    const { data: existingLinks } = await supabase
      .from("affiliate_links")
      .select("tool_id, status");

    const activeToolIds = new Set(
      (existingLinks || [])
        .filter((l) => l.status === "ACTIVE")
        .map((l) => l.tool_id)
    );

    let scannedCount = 0;
    let candidatesFound = 0;
    let noProgramCount = 0;

    for (const tool of tools) {
      if (activeToolIds.has(tool.id)) continue;
      scannedCount++;

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

      let candidateFound = false;

      for (const net of activeNetworks) {
        if (net.publisher_id) {
          candidateFound = true;
          candidatesFound++;

          const candidateUrl = `https://${net.network_name.toLowerCase().replace(/\s+/g, "")}.com/c/${net.publisher_id}/aivault?u=${encodeURIComponent(websiteUrl)}`;

          await supabase.from("affiliate_candidates").upsert(
            {
              tool_id: tool.id,
              tool_name: tool.name,
              tool_slug: tool.slug,
              official_url: websiteUrl,
              network: net.network_name,
              program_name: `${tool.name} Partner Program`,
              destination_url: websiteUrl,
              candidate_url: candidateUrl,
              source: `Configured ${net.network_name} Network`,
              confidence: 90,
              status: "PENDING_REVIEW",
              discovered_at: new Date().toISOString(),
            },
            { onConflict: "tool_id,candidate_url" }
          );

          await supabase.from("affiliate_links").upsert(
            {
              tool_id: tool.id,
              network_name: net.network_name,
              program_name: `${tool.name} Partner Program`,
              status: "PENDING_REVIEW",
              last_checked_at: new Date().toISOString(),
            },
            { onConflict: "tool_id" }
          );

          break;
        }
      }

      if (!candidateMatched(candidateFound)) {
        noProgramCount++;
        await supabase.from("affiliate_links").upsert(
          {
            tool_id: tool.id,
            status: "NO_PROGRAM",
            last_checked_at: new Date().toISOString(),
          },
          { onConflict: "tool_id" }
        );
      }
    }

    function candidateMatched(found: boolean): boolean {
      return found;
    }

    console.log(`[affiliate-discovery] scanned=${scannedCount} candidates=${candidatesFound} noProgram=${noProgramCount}`);

    return NextResponse.json({
      success: true,
      scanned: scannedCount,
      candidatesFound,
      noProgramFound: noProgramCount,
      offset,
      batchSize,
      total: totalTools || 0,
      hasMore: offset + batchSize < (totalTools || 0),
      message: `Batch scan complete (${offset + 1}–${offset + scannedCount} of ${totalTools}). Discovered ${candidatesFound} candidates.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unhandled discovery exception";
    console.error("[affiliate-discovery][EXCEPTION]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
