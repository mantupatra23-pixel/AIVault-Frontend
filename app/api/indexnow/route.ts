import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const KEY = "aivaultindexnowkey2026";

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: tools } = await supabase
      .from("ai_tools")
      .select("slug")
      .not("slug", "is", null)
      .limit(100);

    const host = "www.aivault.pp.ua";
    const urlList = [
      `https://${host}/`,
      `https://${host}/compare`,
      `https://${host}/ai-finder`,
      `https://${host}/category/coding`,
      `https://${host}/category/productivity`,
      `https://${host}/category/chatbot`,
      `https://${host}/category/marketing`,
      `https://${host}/compare/deepseek-vs-claude`,
      `https://${host}/compare/cursor-vs-bolt-new`,
      `https://${host}/compare/midjourney-vs-flux-ai`,
      `https://${host}/compare/perplexity-vs-deepseek`,
      ...(tools || []).map((t) => `https://${host}/tool/${t.slug}`),
    ];

    // Push directly to Bing IndexNow Gateway
    const res = await fetch("https://www.bing.com/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: host,
        key: KEY,
        keyLocation: `https://${host}/aivaultindexnowkey2026.txt`,
        urlList: urlList,
      }),
    });

    return NextResponse.json({
      success: true,
      message: `Pushed ${urlList.length} URLs to Bing & IndexNow Engine`,
      indexNowStatus: res.status, // 200 = Success, 202 = Accepted
      totalUrls: urlList.length,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Submission failed" },
      { status: 500 }
    );
  }
}
