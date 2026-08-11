import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug;

  if (!rawSlug) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const cleanSlug = decodeURIComponent(rawSlug).toLowerCase().trim();
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.redirect(new URL(`/tool/${cleanSlug}`, request.url));
  }

  try {
    // 1. Fetch destination URL from database
    const { data: tool } = await supabase
      .from("ai_tools")
      .select("id, slug, website_url, official_url, affiliate_url")
      .ilike("slug", cleanSlug)
      .maybeSingle();

    if (!tool) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const rawTarget = tool.affiliate_url || tool.website_url || tool.official_url;
    if (!rawTarget) {
      return NextResponse.redirect(new URL(`/tool/${tool.slug}`, request.url));
    }

    // 2. Validate URL to prevent open redirect vulnerabilities
    let targetUrl: URL;
    try {
      targetUrl = new URL(rawTarget.startsWith("http") ? rawTarget : `https://${rawTarget}`);
    } catch {
      return NextResponse.redirect(new URL(`/tool/${tool.slug}`, request.url));
    }

    // 3. Asynchronously record click analytics (non-blocking)
    const destinationType = tool.affiliate_url ? "affiliate" : "official";
    const referrer = request.headers.get("referer") || "direct";
    const userAgent = request.headers.get("user-agent") || "unknown";

    supabase
      .from("affiliate_clicks")
      .insert({
        tool_id: tool.id,
        slug: tool.slug,
        destination_type: destinationType,
        destination_url: targetUrl.toString(),
        referrer,
        user_agent: userAgent,
      })
      .then(({ error }) => {
        if (error) console.error("[CLICK_TRACKING_ERR]", error.message);
      });

    // 4. Return 307 temporary redirect
    return NextResponse.redirect(targetUrl.toString(), { status: 307 });
  } catch (err) {
    console.error("[GO_REDIRECT_EXCEPTION]", err);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
