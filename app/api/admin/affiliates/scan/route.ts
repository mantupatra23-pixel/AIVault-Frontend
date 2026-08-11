import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
  }

  try {
    // Query tools requiring affiliate discovery
    const { data: unmonetizedTools } = await supabase
      .from("ai_tools")
      .select("id, name, slug, website_url, official_url, affiliate_url")
      .or("affiliate_url.is.null,affiliate_status.eq.DISCOVERY_REQUIRED,affiliate_status.eq.NO_LINK")
      .limit(100);

    if (!unmonetizedTools || unmonetizedTools.length === 0) {
      return NextResponse.json({
        scanned: 0,
        discovered: 0,
        message: "All tools are already checked or active.",
      });
    }

    let scannedCount = 0;
    let discoveredCount = 0;

    for (const tool of unmonetizedTools) {
      scannedCount++;
      const domainUrl = tool.website_url || tool.official_url;
      if (!domainUrl) continue;

      let cleanDomain = "";
      try {
        const parsed = new URL(domainUrl.startsWith("http") ? domainUrl : `https://${domainUrl}`);
        cleanDomain = parsed.hostname.replace("www.", "");
      } catch {
        continue;
      }

      // Check matching known partner programs in reference table
      const { data: matchedProgram } = await supabase
        .from("affiliate_programs")
        .select("*")
        .ilike("merchant_domain", `%${cleanDomain}%`)
        .maybeSingle();

      if (matchedProgram) {
        const candidateUrl = matchedProgram.affiliate_url_template.replace("{BASE_URL}", encodeURIComponent(domainUrl));

        const { error } = await supabase.from("affiliate_candidates").upsert(
          {
            tool_id: tool.id,
            tool_name: tool.name,
            tool_slug: tool.slug,
            official_url: domainUrl,
            affiliate_network: matchedProgram.network_name,
            program_name: matchedProgram.program_name,
            candidate_url: candidateUrl,
            commission_details: matchedProgram.default_commission || "Standard Network Rate",
            cookie_duration: matchedProgram.cookie_duration_days || 30,
            confidence_score: 90,
            status: "PENDING_REVIEW",
          },
          { onConflict: "tool_id,candidate_url" }
        );

        if (!error) {
          discoveredCount++;
          await supabase
            .from("ai_tools")
            .update({ affiliate_status: "PENDING_REVIEW", last_checked_at: new Date().toISOString() })
            .eq("id", tool.id);
        }
      } else {
        // Stamp last_checked_at to avoid duplicate scans
        await supabase
          .from("ai_tools")
          .update({
            affiliate_status: tool.affiliate_url ? "ACTIVE" : "NO_AFFILIATE_PROGRAM",
            last_checked_at: new Date().toISOString(),
          })
          .eq("id", tool.id);
      }
    }

    return NextResponse.json({
      success: true,
      scanned: scannedCount,
      discovered: discoveredCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
