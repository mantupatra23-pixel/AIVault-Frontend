import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ candidates: [] });
  }

  const { data } = await supabase
    .from("affiliate_candidates")
    .select("*")
    .eq("status", "PENDING_REVIEW")
    .order("confidence_score", { ascending: false });

  return NextResponse.json({ candidates: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { candidateId, action, customUrl } = body;

    if (!candidateId || !action) {
      return NextResponse.json({ error: "Missing candidateId or action" }, { status: 400 });
    }

    const { data: candidate } = await supabase
      .from("affiliate_candidates")
      .select("*")
      .eq("id", candidateId)
      .single();

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    if (action === "REJECT") {
      await supabase
        .from("affiliate_candidates")
        .update({ status: "REJECTED" })
        .eq("id", candidateId);

      await supabase
        .from("ai_tools")
        .update({ affiliate_status: "NO_AFFILIATE_PROGRAM", last_checked_at: new Date().toISOString() })
        .eq("id", candidate.tool_id);

      return NextResponse.json({ success: true, message: "Candidate rejected" });
    }

    if (action === "APPROVE") {
      const finalUrl = customUrl || candidate.candidate_url;

      // Security check: Must start with http(s)
      if (!finalUrl.startsWith("http")) {
        return NextResponse.json({ error: "Invalid candidate URL format" }, { status: 400 });
      }

      // 1. Update candidate status
      await supabase
        .from("affiliate_candidates")
        .update({ status: "APPROVED", candidate_url: finalUrl })
        .eq("id", candidateId);

      // 2. Activate tool affiliate link
      await supabase
        .from("ai_tools")
        .update({
          affiliate_url: finalUrl,
          affiliate_status: "ACTIVE",
          affiliate_network: candidate.affiliate_network || "Direct Partner",
          affiliate_program_name: candidate.program_name || null,
          last_validated_at: new Date().toISOString(),
          last_checked_at: new Date().toISOString(),
        })
        .eq("id", candidate.tool_id);

      // 3. Sync or create affiliate_links record
      await supabase.from("affiliate_links").upsert(
        {
          tool_id: candidate.tool_id,
          network_name: candidate.affiliate_network || "Direct Partner",
          program_name: candidate.program_name || null,
          affiliate_url: finalUrl,
          official_url: candidate.official_url || null,
          status: "ACTIVE",
          validation_status: "VALID",
          last_validated_at: new Date().toISOString(),
        },
        { onConflict: "tool_id" }
      );

      return NextResponse.json({ success: true, message: `Approved and activated affiliate link for ${candidate.tool_name}` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Candidate processing failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
