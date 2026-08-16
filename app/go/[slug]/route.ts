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

function sanitizeDestination(rawUrl?: string | null, fallbackSlug: string = ""): string {
  let target = (rawUrl || "").trim();

  // If empty or broken synthetic placeholder, fallback safely
  if (!target || target.includes(".ai/?ref=") || target.includes(".co/?ref=")) {
    const cleanSlug = fallbackSlug.replace(/[^a-z0-9-]/g, "");
    return `https://www.producthunt.com/products/${cleanSlug}`;
  }

  // Ensure valid HTTP/HTTPS protocol prefix
  if (!target.startsWith("http://") && !target.startsWith("https://")) {
    target = `https://${target}`;
  }

  return target;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const rawSlug = decodeURIComponent(slug || "").trim().toLowerCase();

  if (!rawSlug) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const { data: tool } = await supabase
      .from("ai_tools")
      .select("id, slug, name, website_url, website, affiliate_url, click_count")
      .or(`slug.ilike.${rawSlug},name.ilike.${rawSlug}`)
      .limit(1)
      .maybeSingle();

    if (!tool) {
      return NextResponse.redirect(
        new URL(`https://www.producthunt.com/products/${rawSlug}`, request.url)
      );
    }

    // Increment click telemetry in background
    const currentClicks = Number(tool.click_count || 0);
    supabase
      .from("ai_tools")
      .update({
        click_count: currentClicks + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tool.id)
      .then(() => {});

    // Priority: 1. Manual Affiliate URL -> 2. Official Website URL -> 3. Fallback
    const candidateUrl =
      tool.affiliate_url && tool.affiliate_url.trim().length > 0
        ? tool.affiliate_url
        : tool.website_url || tool.website || "";

    const destination = sanitizeDestination(candidateUrl, tool.slug || rawSlug);
    return NextResponse.redirect(destination, { status: 307 });
  } catch (err) {
    console.error("Outbound Redirect Error:", err);
    return NextResponse.redirect(
      new URL(`https://www.producthunt.com/products/${rawSlug}`, request.url)
    );
  }
}
