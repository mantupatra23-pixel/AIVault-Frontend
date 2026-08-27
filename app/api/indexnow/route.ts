import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const HOST = "www.aivault.pp.ua";
const KEY = "aivaultindexnowkey2026";

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: tools } = await supabase
      .from("ai_tools")
      .select("slug")
      .not("slug", "is", null)
      .limit(300);

    const urlList = [
      `https://${HOST}`,
      `https://${HOST}/compare`,
      `https://${HOST}/ai-finder`,
      `https://${HOST}/category/coding`,
      `https://${HOST}/category/productivity`,
      `https://${HOST}/category/chatbot`,
      `https://${HOST}/category/marketing`,
      `https://${HOST}/category/image`,
      `https://${HOST}/compare/deepseek-vs-claude`,
      `https://${HOST}/compare/cursor-vs-bolt-new`,
      `https://${HOST}/compare/midjourney-vs-flux-ai`,
      `https://${HOST}/compare/perplexity-vs-deepseek`,
      ...(tools || []).map((t) => `https://${HOST}/tool/${t.slug}`),
    ];

    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: `https://${HOST}/${KEY}.txt`,
        urlList: urlList.slice(0, 300),
      }),
    });

    return NextResponse.json({
      success: true,
      message: `Pushed ${urlList.length} URLs to Bing & Yandex IndexNow`,
      indexNowStatus: res.status,
      totalUrls: urlList.length,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "IndexNow push failed" },
      { status: 500 }
    );
  }
}
