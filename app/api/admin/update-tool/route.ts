// app/api/admin/update-tool/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, slug, affiliate_url, affiliate_network } = body;

    if (!id && !slug) {
      return NextResponse.json({ error: "Missing tool ID or slug" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const cleanUrl = affiliate_url ? affiliate_url.trim() : null;
    const isMonetized = Boolean(cleanUrl && cleanUrl.length > 0);

    const updatePayload = {
      affiliate_url: cleanUrl,
      affiliate_network: affiliate_network || "Direct",
      affiliate_status: isMonetized ? "active_monetized" : "discovery_required",
      updated_at: new Date().toISOString(),
    };

    let query = supabase.from("ai_tools").update(updatePayload);

    if (id) {
      query = query.eq("id", id);
    } else if (slug) {
      query = query.eq("slug", slug);
    }

    const { data, error } = await query.select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      // Fallback update by slug if ID failed
      if (slug) {
        const { data: retryData, error: retryErr } = await supabase
          .from("ai_tools")
          .update(updatePayload)
          .ilike("slug", slug)
          .select();
        
        if (retryErr) return NextResponse.json({ error: retryErr.message }, { status: 500 });
        return NextResponse.json({ success: true, updated_count: retryData?.length || 1, data: retryData });
      }
    }

    return NextResponse.json({ success: true, updated_count: data?.length || 1, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
