// app/api/admin/reviews/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tctovtckukoxcvvwtvwy.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function GET(req: Request) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Admin key use kar rahe hain, isliye saara data milega
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, reviews: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, reviews: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { id, action } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    if (action === "delete") {
      await supabase.from("reviews").delete().eq("id", id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
