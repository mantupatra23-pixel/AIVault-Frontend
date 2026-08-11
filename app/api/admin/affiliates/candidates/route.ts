import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  const supabase = getSupabaseClient();
  if (!supabase) return NextResponse.json({ candidates: [] });

  const { data } = await supabase
    .from("affiliate_candidates")
    .select("*")
    .eq("status", "PENDING_REVIEW")
    .order("confidence", { ascending: false });

  return NextResponse.json({ candidates: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });

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
      return NextResponse.json({ error: "Candidate record not found" }, { status: 404 });
    }

    if (action === "REJECT") {
      await supabase
        .from("affiliate_candidates")
        .update({ status: "REJECTED" })
        .eq("id", candidateId);

      await supabase.from("affiliate_links").upsert(
        {
          tool_id: candidate.tool_id,
          status: "REJECTED",
          last_checked_at: new Date().toISOString(),
        },
        { onConflict: "tool_id" }
      );

      return NextResponse.json({ success: true, message: "Candidate rejected" });
    }

    if (action === "APPROVE") {
      const finalUrl = customUrl || candidate.candidate_url;

      if (!finalUrl || typeof finalUrl !== "string" || !finalUrl.startsWith("http")) {
        return NextResponse.json({ error: "Invalid URL syntax. Must begin with http:// or https://" }, { status: 400 });
      }

      // Link Validation
      let isValid = true;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const checkRes = await fetch(finalUrl, {
          method: "HEAD",
          signal: controller.signal,
          headers: { "User-Agent": "AI-Vault-Verifier/1.0" },
        });
        clearTimeout(timeout);
        if (checkRes.status >= 400 && checkRes.status !== 403) {
          isValid = false;
        }
      } catch {
        // Non-blocking timeout assumption
      }

      const now = new Date().toISOString();

      // 1. Update candidate
      await supabase
        .from("affiliate_candidates")
        .update({
          status: "APPROVED",
          candidate_url: finalUrl,
          verified_at: now,
        })
        .eq("id", candidateId);

      // 2. Activate link in affiliate_links table
      await supabase.from("affiliate_links").upsert(
        {
          tool_id: candidate.tool_id,
          network_name: candidate.network || "Direct Partner",
          program_name: candidate.program_name || null,
          affiliate_url: finalUrl,
          status: "ACTIVE",
          validation_status: isValid ? "VALID" : "INVALID",
          last_validated_at: now,
          updated_at: now,
        },
        { onConflict: "tool_id" }
      );

      return NextResponse.json({
        success: true,
        message: `Approved and activated affiliate URL for ${candidate.tool_name}`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Candidate approval error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
