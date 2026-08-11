import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function generateVisitorHash(ip: string, userAgent: string): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  return crypto.createHash("sha256").update(`${ip}-${userAgent}-${dateStr}`).digest("hex").slice(0, 16);
}

function sanitizeDestinationUrl(targetUrlStr: string): string | null {
  if (!targetUrlStr || typeof targetUrlStr !== "string") return null;

  try {
    const formatted = targetUrlStr.startsWith("http") ? targetUrlStr : `https://${targetUrlStr}`;
    const parsed = new URL(formatted);

    // Reject javascript:, data:, and malformed protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug;

  if (!rawSlug) {
    return NextResponse.json({ error: "Tool slug required" }, { status: 400 });
  }

  const cleanSlug = decodeURIComponent(rawSlug).toLowerCase().trim();
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
  }

  try {
    // 1. Fetch base tool record
    const { data: tool, error: toolErr } = await supabase
      .from("ai_tools")
      .select("id, name, slug, website_url")
      .ilike("slug", cleanSlug)
      .maybeSingle();

    if (toolErr || !tool) {
      return NextResponse.json({ error: `Tool '/tool/${cleanSlug}' not found` }, { status: 404 });
    }

    // 2. Query ACTIVE affiliate link ONLY
    const { data: affLink } = await supabase
      .from("affiliate_links")
      .select("id, affiliate_url, status")
      .eq("tool_id", tool.id)
      .eq("status", "ACTIVE")
      .maybeSingle();

    const isAffiliateActive = Boolean(affLink && affLink.affiliate_url && affLink.affiliate_url.trim() !== "");
    const rawDestination = isAffiliateActive ? affLink!.affiliate_url! : tool.website_url;

    const validatedUrl = sanitizeDestinationUrl(rawDestination || "");

    if (!validatedUrl) {
      // Fallback if URL is missing or malformed
      return NextResponse.redirect(new URL(`/tool/${tool.slug}`, request.url));
    }

    // 3. Asynchronous Non-Blocking Click Tracking
    if (isAffiliateActive && affLink) {
      const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
      const userAgent = request.headers.get("user-agent") || "unknown";
      const referrer = request.headers.get("referer") || "direct";
      const visitorHash = generateVisitorHash(ip, userAgent);

      // Fire and forget: click tracking errors will not halt user redirects
      supabase
        .from("affiliate_clicks")
        .insert({
          tool_id: tool.id,
          affiliate_link_id: affLink.id,
          visitor_hash: visitorHash,
          referrer,
          landing_page: `/tool/${tool.slug}`,
          device_type: userAgent.includes("Mobile") ? "mobile" : "desktop",
          created_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) {
            console.error("[AFFILIATE_CLICK_ERR] Failed logging click:", error.message);
          }
        });
    }

    // 4. Perform 307 Temporary Redirect with No-Index Search Tags
    return NextResponse.redirect(validatedUrl, {
      status: 307,
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Redirect processing error";
    console.error("[GO_REDIRECT_EXCEPTION]", msg);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
