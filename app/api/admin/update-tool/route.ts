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
    const { id, slug, website_url, affiliate_url, affiliate_network } = body;

    if (!id && !slug) {
      return NextResponse.json({ error: "Missing tool ID or slug" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const cleanAffiliate = affiliate_url ? affiliate_url.trim() : null;
    const cleanWebsite = website_url ? website_url.trim() : null;
    const isMonetized = Boolean(cleanAffiliate && cleanAffiliate.length > 0);

    const updatePayload: Record<string, unknown> = {
      affiliate_url: cleanAffiliate,
      affiliate_network: affiliate_network || "Direct",
      affiliate_status: isMonetized ? "active_monetized" : "discovery_required",
      updated_at: new Date().toISOString(),
    };

    if (cleanWebsite) {
      updatePayload.website_url = cleanWebsite;
    }

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

    return NextResponse.json({ success: true, updated_count: data?.length || 1, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
