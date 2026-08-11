import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ notifications: [] });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  let query = supabase
    .from("affiliate_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data } = await query;
  return NextResponse.json({ notifications: data || [] });
}

export async function PATCH(request: NextRequest) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ success: false }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await supabase
        .from("affiliate_notifications")
        .update({ is_read: true })
        .eq("is_read", false);
    } else if (id) {
      await supabase
        .from("affiliate_notifications")
        .update({ is_read: true })
        .eq("id", id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
