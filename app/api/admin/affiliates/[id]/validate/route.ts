import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ManualAdapter } from "@/lib/affiliate-adapters";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
  }

  // Fetch link record
  const { data: linkRecord } = await supabase.from("affiliate_links").select("*").eq("id", id).maybeSingle();

  if (!linkRecord || !linkRecord.affiliate_url) {
    return NextResponse.json({ status: "INVALID", message: "No affiliate URL configured" }, { status: 400 });
  }

  const adapter = new ManualAdapter();
  const res = await adapter.validateLink(linkRecord.affiliate_url);

  // Update validation status in DB
  await supabase
    .from("affiliate_links")
    .update({
      validation_status: res.status,
      last_validated_at: new Date().toISOString(),
      status: res.status === "INVALID" ? "BROKEN" : linkRecord.status,
    })
    .eq("id", id);

  return NextResponse.json({ success: true, validation: res });
}
