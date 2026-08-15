// app/go/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const rawSlug = decodeURIComponent(slug || "").trim();

  if (!rawSlug) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = getSupabase();

  const { data: tool } = await supabase
    .from("ai_tools")
    .select("id, slug, name, website_url, website, affiliate_url, click_count")
    .or(`slug.eq.${rawSlug},name.ilike.${rawSlug}`)
    .limit(1)
    .maybeSingle();

  if (!tool) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Increment Click Counter
  const currentClicks = Number(tool.click_count || 0);
  await supabase
    .from("ai_tools")
    .update({ click_count: currentClicks + 1 })
    .eq("id", tool.id);

  const destination =
    tool.affiliate_url?.trim() ||
    tool.website_url?.trim() ||
    tool.website?.trim() ||
    "/";

  return NextResponse.redirect(destination, { status: 307 });
}
