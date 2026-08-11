import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function GET() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return new NextResponse("Database unavailable", { status: 500 });
  }

  const { data: tools } = await supabase.from("ai_tools").select("id, name, slug, category, affiliate_url, affiliate_status");

  let csv = "Tool Name,Slug,Category,Affiliate Status,Affiliate URL\n";

  if (tools) {
    tools.forEach((t) => {
      const cleanName = `"${(t.name || "").replace(/"/g, '""')}"`;
      const cleanCat = `"${(t.category || "").replace(/"/g, '""')}"`;
      const cleanUrl = `"${(t.affiliate_url || "").replace(/"/g, '""')}"`;
      csv += `${cleanName},${t.slug},${cleanCat},${t.affiliate_status || "NO_LINK"},${cleanUrl}\n`;
    });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aivault-affiliates-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
