// app/api/track-click/route.ts
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
    const { id, slug } = await req.json();
    if (!id && !slug) {
      return NextResponse.json({ error: "Missing identifier" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    let query = supabase.from("ai_tools").select("id, click_count");
    if (id) query = query.eq("id", id);
    else if (slug) query = query.eq("slug", slug);

    const { data: tool } = await query.limit(1).maybeSingle();

    if (tool) {
      const nextClicks = Number(tool.click_count || 0) + 1;
      await supabase
        .from("ai_tools")
        .update({ click_count: nextClicks })
        .eq("id", tool.id);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
