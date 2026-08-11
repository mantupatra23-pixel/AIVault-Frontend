import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
}

function generateVisitorHash(ip: string, userAgent: string): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  return crypto.createHash("sha256").update(`${ip}-${userAgent}-${dateStr}`).digest("hex").slice(0, 16);
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
    // Schema-Safe Selection: ONLY query verified columns
    const { data: tool } = await supabase
      .from("ai_tools")
      .select("id, slug, website_url, affiliate_url, affiliate_status")
      .ilike("slug", cleanSlug)
      .maybeSingle();

    if (!tool) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const rawTarget = (tool.affiliate_status === "ACTIVE" && tool.affiliate_url)
      ? tool.affiliate_url
      : tool.website_url;

    if (!rawTarget) {
      return NextResponse.redirect(new URL(`/tool/${tool.slug}`, request.url));
    }

    // Strict Protocol Security
    let targetUrl: URL;
    try {
      const formatted = rawTarget.startsWith("http") ? rawTarget : `https://${rawTarget}`;
      targetUrl = new URL(formatted);
      if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
        return NextResponse.redirect(new URL(`/tool/${tool.slug}`, request.url));
      }
    } catch {
      return NextResponse.redirect(new URL(`/tool/${tool.slug}`, request.url));
    }

    // Asynchronous Click Logging
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const referrer = request.headers.get("referer") || "direct";
    const visitorHash = generateVisitorHash(ip, userAgent);

    supabase
      .from("affiliate_clicks")
      .insert({
        tool_id: tool.id,
        visitor_hash: visitorHash,
        referrer,
        landing_page: `/tool/${tool.slug}`,
        device_type: userAgent.includes("Mobile") ? "mobile" : "desktop",
      })
      .then(({ error }) => {
        if (error) console.error("[CLICK_LOG_ERR]", error.message);
      });

    return NextResponse.redirect(targetUrl.toString(), {
      status: 307,
      headers: { "X-Robots-Tag": "noindex, nofollow" },
    });
  } catch (err) {
    console.error("[GO_REDIRECT_EXCEPTION]", err);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
