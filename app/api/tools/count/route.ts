import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { count, error } = await supabase
    .from("ai_tools")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ count: 0, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: count || 0 });
}
