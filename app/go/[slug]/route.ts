// app/go/[slug]/route.ts
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

function formatUrl(target: string): string {
  let url = target.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url;
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

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: tool } = await supabase
    .from("ai_tools")
    .select("id, slug, name, website_url, website, affiliate_url, click_count")
    .or(`slug.ilike.${rawSlug},name.ilike.${rawSlug}`)
    .limit(1)
    .maybeSingle();

  if (!tool) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Increment Click Count in Supabase
  const nextClicks = Number(tool.click_count || 0) + 1;
  await supabase
    .from("ai_tools")
    .update({ click_count: nextClicks })
    .eq("id", tool.id);

  // Priority: 1. Affiliate URL -> 2. Website URL -> 3. Fallback
  const rawTarget =
    tool.affiliate_url?.trim() ||
    tool.website_url?.trim() ||
    tool.website?.trim();

  if (!rawTarget) {
    return NextResponse.redirect(new URL(`/tool/${tool.slug || rawSlug}`, request.url));
  }

  const finalDestination = formatUrl(rawTarget);
  return NextResponse.redirect(finalDestination, { status: 307 });
}
